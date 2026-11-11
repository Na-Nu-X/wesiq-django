"""
Shared security helpers used by both the web views (app/views.py) and the native API (app/api/views.py).

Keep business rules that must be enforced server-side (password reset codes, post visibility,
XP calculation, upload validation) here, so the two back ends can't drift apart.
"""

import math
import secrets
from datetime import timedelta
from urllib.parse import urlparse

from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from django.db import transaction
from django.db.models import F, Q
from django.db.models.functions import Greatest
from django.utils import timezone
from PIL import Image, UnidentifiedImageError

from .models import Users, FollowRelation, Activity, SpecialBadges

##################
# Password Reset #
##################

PASSWORD_RESET_CODE_TTL = 15 * 60 # Code Is Valid For 15 Minutes
PASSWORD_RESET_MAX_ATTEMPTS = 5 # Wrong Guesses Allowed Per Issued Code
PASSWORD_RESET_COOLDOWN = 60 # Minimum Seconds Between Two Issued Codes For One User

def _reset_issued_key(user_id): return f"password_reset:{user_id}:issued"
def _reset_attempts_key(user_id): return f"password_reset:{user_id}:attempts"
def _reset_cooldown_key(user_id): return f"password_reset:{user_id}:cooldown"

def generate_numeric_code(length = 6):
    """Cryptographically secure numeric code (the `random` module is predictable)."""
    return "".join(secrets.choice("0123456789") for _ in range(length))

def issue_password_reset_code(user):
    """
    Creates and stores a new reset code for the user.
    Returns the code, or None if a code was issued less than PASSWORD_RESET_COOLDOWN seconds ago.
    """
    # cache.add Only Succeeds When The Key Doesn't Exist, So It Works As An Atomic Cooldown Lock
    if not cache.add(_reset_cooldown_key(user.pk), 1, timeout = PASSWORD_RESET_COOLDOWN):
        return None

    code = generate_numeric_code()

    Users.objects.filter(pk = user.pk).update(password_reset_code = code)
    user.password_reset_code = code

    cache.set(_reset_issued_key(user.pk), 1, timeout = PASSWORD_RESET_CODE_TTL)
    cache.delete(_reset_attempts_key(user.pk))

    return code

def clear_password_reset_code(user):
    Users.objects.filter(pk = user.pk).update(password_reset_code = None)
    user.password_reset_code = None
    cache.delete_many([_reset_issued_key(user.pk), _reset_attempts_key(user.pk)])

def verify_password_reset_code(user, submitted_code):
    """
    Returns one of: "ok", "invalid", "expired", "locked".
    A missing code never matches, so `None == None` can't let a request through.
    """
    stored_code = user.password_reset_code

    if not stored_code or not submitted_code:
        return "invalid"

    # Expired (Or Cache Was Flushed): Fail Closed
    if cache.get(_reset_issued_key(user.pk)) is None:
        clear_password_reset_code(user)
        return "expired"

    attempts_key = _reset_attempts_key(user.pk)
    cache.add(attempts_key, 0, timeout = PASSWORD_RESET_CODE_TTL)

    try:
        attempts = cache.incr(attempts_key)

    except ValueError:
        attempts = PASSWORD_RESET_MAX_ATTEMPTS + 1 # Key Vanished Between add And incr: Fail Closed

    if attempts > PASSWORD_RESET_MAX_ATTEMPTS:
        clear_password_reset_code(user)
        return "locked"

    if not secrets.compare_digest(str(submitted_code).strip(), stored_code):
        return "invalid"

    return "ok"

###################
# Post Visibility #
###################

def visible_posts_q(viewer_id):
    """
    Q filter for the posts a viewer is allowed to see. It applies the same rule as the community feed:
    public posts from public accounts, the viewer's own posts, or posts from authors the viewer follows (accepted).
    """
    public_q = Q(public_visibility = True, user__private_account = False)

    if not viewer_id:
        return public_q

    accepted_following_ids = FollowRelation.objects.filter(
        from_user_id = viewer_id,
        status = "accepted"
    ).values("to_user_id")

    return public_q | Q(user_id = viewer_id) | Q(user_id__in = accepted_following_ids)

########################
# Post Settings Fields #
########################

EDITABLE_POST_SETTINGS = frozenset({"public_visibility", "allow_comments", "hide_likes"})

def parse_bool(value):
    """Strict boolean parsing for JSON/form values. Returns None if the value isn't a recognisable boolean."""
    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in ("true", "1"): return True
        if lowered in ("false", "0"): return False

    if isinstance(value, int) and value in (0, 1):
        return bool(value)

    return None

######################
# Activity / XP Rule #
######################

XP_PER_HOUR = 100 # Mirrors app/static/app/ts/src/pages/training_session/functions/playback.ts
XP_BOOST_MULTIPLIER = 2 # Mirrors xp_boost_interval.amount In training_session/state.ts
XP_BOOST_DURATION = timedelta(minutes = 30)
MAX_ACTIVITY_SECONDS = 12 * 60 * 60 # One Recorded Activity Can't Be Longer Than 12 Hours
MAX_TRAINING_PLAN_SUMMARY_ITEMS = 200

class ActivityValidationError(ValueError):
    pass

def is_xp_boost_available(user, now = None):
    """Server-side version of the availability check from the training session page."""
    now = now or timezone.now()
    today = timezone.localtime(now).date()

    if user.xp_boost_expiration_time:
        if user.xp_boost_expiration_time > now:
            return False # Already Active

        if timezone.localtime(user.xp_boost_expiration_time).date() == today:
            return False # Already Claimed Today

    return Activity.objects.filter(
        user_id = user.pk,
        end_time__date = today - timedelta(days = 1)
    ).exists()

def _boost_was_claimed(user):
    # xp_boost_expiration_time Uses auto_now_add, So A Never-Claimed Boost "Expires" At Account Creation
    if not user.xp_boost_expiration_time:
        return False

    creation_time = getattr(user, "creation_time", None)

    return not (creation_time and abs((user.xp_boost_expiration_time - creation_time).total_seconds()) < 60)

def _boost_overlap_seconds(user, start, end):
    if not _boost_was_claimed(user):
        return 0

    boost_start = max(user.xp_boost_expiration_time - XP_BOOST_DURATION, start)
    boost_end = min(user.xp_boost_expiration_time, end)

    return max(0.0, (boost_end - boost_start).total_seconds())

def max_activity_xp(user, elapsed_seconds, now):
    """Maximum XP the activity could legitimately have earned, including any XP boost overlap."""
    start = now - timedelta(seconds = elapsed_seconds)
    boosted_seconds = _boost_overlap_seconds(user, start, now)

    xp = (elapsed_seconds + boosted_seconds * (XP_BOOST_MULTIPLIER - 1)) * XP_PER_HOUR / 3600

    return math.ceil(xp)

def _parse_non_negative_int(value, field):
    try:
        number = int(float(value))

    except (TypeError, ValueError):
        raise ActivityValidationError(f"Invalid {field}.")

    if number < 0:
        raise ActivityValidationError(f"Invalid {field}.")

    return number

def record_activity(user_id, elapsed_seconds, claimed_xp, activity_type = None, day = None, training_plan_summary = None):
    """
    Records an activity and awards XP, streaks and badges.

    The client's XP and duration aren't trusted:
      * the duration is capped at MAX_ACTIVITY_SECONDS and at the wall-clock time since the user's previous activity,
      * XP is capped at what that duration could have earned (XP_PER_HOUR, plus the XP boost only while it was really active).

    Returns the XP that was actually awarded.
    """
    elapsed_seconds = _parse_non_negative_int(elapsed_seconds, "elapsed_time")
    claimed_xp = _parse_non_negative_int(claimed_xp, "gained_xp")

    if elapsed_seconds == 0:
        raise ActivityValidationError("Activity has no duration.")

    if activity_type is not None:
        activity_type = str(activity_type)[:50]

    if day in ("", None):
        day = None

    else:
        day = _parse_non_negative_int(day, "day")

    if training_plan_summary is not None:
        if not isinstance(training_plan_summary, list) or len(training_plan_summary) > MAX_TRAINING_PLAN_SUMMARY_ITEMS:
            raise ActivityValidationError("Invalid training plan summary.")

    now = timezone.now()
    today = timezone.localdate(now)
    yesterday = today - timedelta(days = 1)

    with transaction.atomic():
        user = Users.objects.select_for_update().get(pk = user_id) # Serialises Concurrent Submissions For One User

        # The Activity Can't Have Started Before The Previous One Ended
        previous_activity = Activity.objects.filter(user_id = user_id).order_by("-end_time").only("end_time").first()
        elapsed_seconds = min(elapsed_seconds, MAX_ACTIVITY_SECONDS)

        if previous_activity:
            elapsed_seconds = min(elapsed_seconds, max(0, int((now - previous_activity.end_time).total_seconds())))

        gained_xp = min(claimed_xp, max_activity_xp(user, elapsed_seconds, now))

        updates = {
            "xp": F("xp") + gained_xp,
            "total_activities": F("total_activities") + 1,
        }

        last_increase_date = user.last_activity_streak_increase_time.date() if user.last_activity_streak_increase_time else None

        if last_increase_date is None or last_increase_date < today:
            if last_increase_date == yesterday or user.activity_streak == 0:
                updates["activity_streak"] = F("activity_streak") + 1
                updates["last_activity_streak_increase_time"] = now
                # Compares Against The New Streak Value (The Old Code Compared Against The Value Before The Increase)
                updates["max_activity_streak"] = Greatest(F("max_activity_streak"), F("activity_streak") + 1)

        Users.objects.filter(pk = user_id).update(**updates)

        Activity.objects.create(
            user_id = user_id,
            elapsed_time = elapsed_seconds,
            gained_xp = gained_xp,
            type = activity_type,
            training_plan_day = day,
            training_plan_summary = training_plan_summary
        )

        _award_activity_badges(user)

    return gained_xp

def _award_activity_badges(user):
    owned_badges = set(user.badges.values_list("data", flat = True))
    today = timezone.localdate()

    if "no_day_off_week" not in owned_badges:
        active_days = Activity.objects.filter(
            user_id = user.pk,
            end_time__date__range = [today - timedelta(days = 6), today]
        ).values("end_time__date").distinct().count()

        if active_days == 7:
            SpecialBadges.objects.create(user_id = user.pk, title = "No Day Off Week", data = "no_day_off_week")

    if "xmas_activity" not in owned_badges:
        if Activity.objects.filter(user_id = user.pk, end_time__month = 12, end_time__day = 24).exists():
            SpecialBadges.objects.create(user_id = user.pk, title = "X-Mas Activity", data = "xmas_activity")

    if "new_year_new_goals" not in owned_badges:
        if Activity.objects.filter(user_id = user.pk, end_time__month = 1, end_time__day = 1).exists():
            SpecialBadges.objects.create(user_id = user.pk, title = "New Year, New Goals", data = "new_year_new_goals")

####################
# Upload Validation #
####################

ALLOWED_PROFILE_IMAGE_FORMATS = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp", "GIF": ".gif"}
MAX_PROFILE_IMAGE_SIZE = 10 * 1000 * 1000

def validate_uploaded_image(uploaded_file, max_size = MAX_PROFILE_IMAGE_SIZE):
    """
    Checks that an upload really is an image and returns the safe file extension for its format.
    The user-supplied filename extension is never used, so an .html or .svg file can't be stored as an "image".
    """
    if uploaded_file.size > max_size:
        raise ValidationError("File is too large.")

    try:
        uploaded_file.seek(0)

        with Image.open(uploaded_file) as image:
            image_format = image.format
            image.verify()

    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise ValidationError("File is not a valid image.")

    finally:
        uploaded_file.seek(0)

    if image_format not in ALLOWED_PROFILE_IMAGE_FORMATS:
        raise ValidationError("Unsupported image format.")

    return ALLOWED_PROFILE_IMAGE_FORMATS[image_format]

_url_validator = URLValidator(schemes = ["http", "https"])

def clean_bio_link(url):
    """Returns a normalised http(s) URL or raises ValidationError (blocks javascript:/data: links)."""
    url = str(url).strip()

    if len(url) > 200:
        raise ValidationError("URL is too long.")

    if not urlparse(url).scheme:
        url = f"https://{url}"

    _url_validator(url)

    return url

###########################
# Session / Token Revoking #
###########################

def revoke_user_refresh_tokens(user):
    """Blacklists every outstanding refresh token of the user (e.g. after a password reset or account deletion)."""
    from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

    for token in OutstandingToken.objects.filter(user = user).exclude(blacklistedtoken__isnull = False):
        BlacklistedToken.objects.get_or_create(token = token)

############
# Comments #
############

MAX_COMMENT_LENGTH = 100 # Mirrors PostForum.comment max_length (TextField max_length Isn't Enforced By The Database)

class CommentValidationError(ValueError):
    pass

def clean_post_comment(post, comment, parent_id):
    """
    Validates a new post comment. Returns (comment_text, parent_id).
    The post must allow comments and the parent comment (if any) must belong to the same post.
    """
    from .models import PostForum

    if not post.allow_comments:
        raise CommentValidationError("comments_disabled")

    comment = str(comment or "").strip()

    if not comment or len(comment) > MAX_COMMENT_LENGTH:
        raise CommentValidationError("invalid_comment")

    if parent_id in ("", None):
        return comment, None

    try:
        parent_id = int(parent_id)

    except (TypeError, ValueError):
        raise CommentValidationError("invalid_parent")

    if not PostForum.objects.filter(id = parent_id, post = post).exclude(status = "hidden").exists():
        raise CommentValidationError("invalid_parent")

    return comment, parent_id
