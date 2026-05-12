from allauth.socialaccount.signals import social_account_added, pre_social_login
from allauth.socialaccount.models import SocialAccount
from django.dispatch import receiver
from .models import Users, Activity, Reviews, Articles, ArticleForum, TrainingPlan, Exercises, Post, PostForum
from django.db.models.signals import post_save, post_delete, m2m_changed
from .tasks import modelsWarmUp
from django.utils import timezone
from datetime import timedelta

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

# Pages Warming Up
def updateCacheOnChange(sender, instance, **kwargs):
    modelsWarmUp.delay() # Every Change In The Database Triggers Pages Warm Up

models_for_warm_up = [Users, Activity, Reviews, Articles, ArticleForum, TrainingPlan, Exercises] # Gets All Models For Warm Up

for one_model in models_for_warm_up:
    post_save.connect(updateCacheOnChange, sender=one_model) # Updates Cache On Save
    post_delete.connect(updateCacheOnChange, sender=one_model) # Updates Cache On Delete

# Update Latest Interaction Time In Posts

def update_post_activity(post):
    limit_date = timezone.now() - timedelta(days=30)
    
    if post.created_at > limit_date:
        post.__class__.objects.filter(id=post.id).update(
            latest_interaction=timezone.now()
        )

# Checks For New Comment In The Post
@receiver(post_save, sender=PostForum)
def on_comment_added(sender, instance, created, **kwargs):
    if created:
        update_post_activity(instance.post)

# Checks For New Like On The Post
@receiver(m2m_changed, sender=Post.likes_from_users.through)
def update_interaction_on_like(sender, instance, action, **kwargs):
    if action == "post_add":
        update_post_activity(instance)