from allauth.socialaccount.signals import social_account_added, pre_social_login
from allauth.socialaccount.models import SocialAccount
from django.dispatch import receiver
from .models import Users

# Google OAuth 2.0
@receiver(social_account_added)
def save_google_user(sender, request, sociallogin, **kwargs):
    if sociallogin.account.provider == "google":
        data = sociallogin.account.extra_data
        
        google_id = data.get("id")
        email = data.get("email")
        first_name = data.get("given_name")
        last_name = data.get("family_name")

        user_obj, created = Users.objects.get_or_create(
            email_address=email,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "password": "",
                "google_id": google_id,
            }
        )

        if not user_obj.google_id:
            user_obj.google_id = google_id
            user_obj.save()