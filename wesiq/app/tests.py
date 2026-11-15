from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from app.models import Activity, ChatAttachment, Post, Users
from app.security import (
    PASSWORD_RESET_MAX_ATTEMPTS, issue_password_reset_code, max_activity_xp, verify_password_reset_code
)

TEST_SETTINGS = dict(
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}},
    EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend",
    RATELIMIT_ENABLE = False,
)

OLD_PASSWORD = "Old-Pass-1234!"

def make_user(username, **extra):
    defaults = dict(
        first_name = "Test",
        last_name = "User",
        email_address = f"{username}@example.com",
        password = make_password(OLD_PASSWORD),
        account_status = "OK",
    )
    defaults.update(extra)
    return Users.objects.create(username = username, **defaults)

@override_settings(**TEST_SETTINGS)
class SecurityTestCase(TestCase):
    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        self.api = APIClient()

class PasswordResetTests(SecurityTestCase):
    def test_web_reset_without_code_does_not_change_password(self):
        # Previously: password_reset_code (None) == user.password_reset_code (None) -> password changed for any e-mail in the cookie
        user = make_user("victim")
        self.client.cookies["email_address"] = user.email_address

        self.client.post(reverse("password_reset_url"), {"new_password": "Attacker-Pass-999"})

        user.refresh_from_db()
        self.assertTrue(check_password(OLD_PASSWORD, user.password))

    def test_api_reset_works_logged_out(self):
        user = make_user("alice")

        response = self.api.post("/native-api/get-password-reset-code/", {"identifier": "alice"}, format = "json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)

        user.refresh_from_db()
        response = self.api.post("/native-api/password-reset/", {
            "identifier": "alice@example.com",
            "password_reset_code": user.password_reset_code,
            "new_password": "Brand-New-Pass-42",
        }, format = "json")

        self.assertEqual(response.status_code, 200, response.content)
        user.refresh_from_db()
        self.assertTrue(check_password("Brand-New-Pass-42", user.password))
        self.assertIsNone(user.password_reset_code) # Single use

    def test_unknown_identifier_gives_same_response(self):
        response = self.api.post("/native-api/get-password-reset-code/", {"identifier": "nobody"}, format = "json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)

    def test_code_locks_after_max_attempts(self):
        user = make_user("bob")
        code = issue_password_reset_code(user)
        wrong = "000000" if code != "000000" else "111111"

        for _attempt in range(PASSWORD_RESET_MAX_ATTEMPTS):
            self.assertEqual(verify_password_reset_code(user, wrong), "invalid")

        # Even the right code is refused once the attempts are used up
        self.assertEqual(verify_password_reset_code(user, code), "locked")

class WebPasswordResetFlowTests(SecurityTestCase):
    """
    The homepage, login and profile flows stored the code without its expiry marker, so every code was "expired" (shown as
    "Overovací kód sa nezhoduje"), and the mail mixed the page's language with the account's language prefix
    (e.g. "/es/obnova-hesla", a 404). The whole mail now uses the language of the page the code was requested from.
    """

    def reset_with_mailed_code(self, user, new_password):
        import re
        from urllib.parse import urlparse

        self.assertEqual(len(mail.outbox), 1)
        body = mail.outbox[-1].body
        link = re.search(r"(\S*\?password-reset-code=(\d{6}))", body)
        self.assertIsNotNone(link, body)

        # The Reset Page Identifies The Account By The Cookie Set When The Code Was Requested (The Profile Script Sets It Too)
        self.client.cookies["email_address"] = user.email_address

        # The Link From The Mail Opens The Reset Page (Like A Browser, It Follows The Trailing Slash Redirect)
        path = urlparse(link.group(1)).path
        query = urlparse(link.group(1)).query
        response = self.client.get(f"{path}?{query}", follow = True)
        self.assertEqual(response.status_code, 200, path)
        self.assertEqual(response.context["password_reset_code"], link.group(2)) # The Page Received The Code From The Link

        self.client.post(response.request["PATH_INFO"], {"password_reset_code": link.group(2), "new_password": new_password})

        user.refresh_from_db()
        return path

    def test_login_page_flow_with_spanish_account_from_english_page(self):
        # Logged Out, The Footer Flags Only Change The Page, So The Account Can Still Be Spanish
        user = make_user("carlos", language = "es")
        self.client.cookies["email_address"] = user.email_address

        self.client.get("/en/login/?password-reset=true") # Requested From An English Page

        self.assertIn("Password reset", mail.outbox[-1].subject) # English Subject
        self.assertIn("Hi carlos", mail.outbox[-1].body) # English Greeting, Not "Hola"

        path = self.reset_with_mailed_code(user, "Brand-New-Pass-2026!")
        self.assertTrue(path.startswith("/en/password-reset"), path) # The English Route Under The English Prefix
        self.assertTrue(check_password("Brand-New-Pass-2026!", user.password))
        self.assertIsNone(user.password_reset_code) # Single Use

    def test_homepage_flow_from_spanish_page(self):
        user = make_user("hana", language = "sk")
        self.client.cookies["email_address"] = user.email_address

        self.client.get("/es/?password-reset=true") # Requested From A Spanish Page

        self.assertIn("Hola hana", mail.outbox[-1].body)

        path = self.reset_with_mailed_code(user, "Nuevo-Pass-2026!")
        self.assertTrue(path.startswith("/es/recuperacion-de-contrasena"), path) # The Spanish Route, Not "/es/obnova-hesla"
        self.assertTrue(check_password("Nuevo-Pass-2026!", user.password))

    def test_profile_flow(self):
        user = make_user("emma", language = "en")
        session = self.client.session
        session["logged_in_user_id"] = user.id
        session.save()

        self.client.get(reverse("profile_url", args = [user.username]) + "?password-reset=true")

        path = self.reset_with_mailed_code(user, "Brand-New-Pass-2026!")
        self.assertTrue(path.startswith("/en/password-reset"), path)
        self.assertTrue(check_password("Brand-New-Pass-2026!", user.password))

class EditPostSettingsTests(SecurityTestCase):
    def test_cannot_change_post_owner(self):
        owner = make_user("owner")
        attacker = make_user("attacker")
        post = Post.objects.create(user = attacker)
        self.api.force_authenticate(attacker)

        response = self.api.post("/native-api/edit-post-settings/", {"post_id": post.public_id, "setting": "user_id", "action": owner.id}, format = "json")

        self.assertEqual(response.status_code, 400)
        post.refresh_from_db()
        self.assertEqual(post.user_id, attacker.id)

    def test_allowed_setting_still_works(self):
        user = make_user("poster")
        post = Post.objects.create(user = user, allow_comments = True)
        self.api.force_authenticate(user)

        response = self.api.post("/native-api/edit-post-settings/", {"post_id": post.public_id, "setting": "allow_comments", "action": False}, format = "json")

        self.assertEqual(response.status_code, 200)
        post.refresh_from_db()
        self.assertFalse(post.allow_comments)

class ActivityXPTests(SecurityTestCase):
    def test_fake_xp_is_capped(self):
        user = make_user("runner")
        self.api.force_authenticate(user)

        # 1 hour without boost can earn at most 100 XP; the client claims a million
        response = self.api.post("/native-api/new-activity/", {"new_activity_data": {
            "elapsed_time": 3600 * 1000, "gained_xp": 1_000_000, "type": None, "day": None, "training_plan_summary": None
        }}, format = "json")

        self.assertEqual(response.status_code, 201, response.content)
        user.refresh_from_db()
        self.assertEqual(user.xp, 100)
        self.assertEqual(Activity.objects.get(user = user).gained_xp, 100)

    def test_boost_doubles_only_while_active(self):
        user = make_user("booster")
        now = timezone.now()
        user.creation_time = now - timedelta(days = 30)
        user.xp_boost_expiration_time = now # Boost covered the last 30 minutes
        self.assertEqual(max_activity_xp(user, 3600, now), 150) # 30 min x1 + 30 min x2

    def test_xp_boost_cannot_be_claimed_without_eligibility(self):
        user = make_user("noboost")
        original_expiration = user.xp_boost_expiration_time
        self.api.force_authenticate(user)

        # No activity yesterday -> not eligible
        response = self.api.get("/native-api/use-xp-boost/")

        self.assertEqual(response.status_code, 400)
        user.refresh_from_db()
        self.assertEqual(user.xp_boost_expiration_time, original_expiration)

class PostVisibilityTests(SecurityTestCase):
    def test_followers_only_post_hidden_from_strangers(self):
        author = make_user("author")
        stranger = make_user("stranger")
        post = Post.objects.create(user = author, public_visibility = False)
        self.api.force_authenticate(stranger)

        response = self.api.get(f"/native-api/get-post/{post.public_id}/")

        self.assertNotEqual(response.status_code, 200)

class ChatAttachmentTests(SecurityTestCase):
    def test_cannot_attach_someone_elses_attachment(self):
        from app.consumers import ChatConsumer

        alice, bob, mallory = make_user("alice2"), make_user("bob2"), make_user("mallory")
        foreign = ChatAttachment.objects.create(sent_by = alice, original_filename = "secret.pdf", type = "file")

        consumer = ChatConsumer()
        consumer.sender, consumer.receiver = mallory, bob

        # Calls The Wrapped Sync Function Directly (database_sync_to_async Would Close The Test DB Connection)
        result = ChatConsumer.__dict__["save_attachments"].func(consumer, None, [foreign.id])

        self.assertIsNone(result)
        foreign.refresh_from_db()
        self.assertIsNone(foreign.chat_id)

class WebPublicIdTests(SecurityTestCase):
    """The web frontend sends post public IDs (strings); these flows broke when posts moved to public IDs."""

    def login(self, user):
        session = self.client.session
        session["logged_in_user_id"] = user.id
        session.save()

    def web_post(self, action, payload):
        import json
        return self.client.post(
            reverse("community_url"), data = json.dumps(payload), content_type = "application/json",
            HTTP_X_REQUESTED_ACTION = action
        )

    def test_add_comment_with_public_id(self):
        from app.models import PostForum
        author = make_user("webauthor")
        post = Post.objects.create(user = author, allow_comments = True)
        self.login(author)

        response = self.web_post("add-comment", {"post_id": post.public_id, "comment": "Nice!", "parent_id": None})

        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(PostForum.objects.get().post_id, post.id)

    def test_add_comment_respects_allow_comments(self):
        author = make_user("quietauthor")
        post = Post.objects.create(user = author, allow_comments = False)
        self.login(author)

        response = self.web_post("add-comment", {"post_id": post.public_id, "comment": "Hi", "parent_id": None})

        self.assertEqual(response.status_code, 400)

    def test_toggle_save_with_public_id(self):
        user = make_user("saver")
        post = Post.objects.create(user = user)
        self.login(user)

        self.web_post("toggle-post-save", post.public_id)

        self.assertTrue(user.saved_posts.filter(id = post.id).exists())

    def test_post_absolute_url_uses_public_id(self):
        post = Post.objects.create(user = make_user("urlauthor"))
        self.assertIn(post.public_id, post.get_absolute_url())
