from django.contrib.sitemaps import Sitemap
from .models import Users, Post
from django.urls import reverse

# Maps For Static Pages + Translated Versions
class StaticSitemap(Sitemap):
    changefreq = "daily"
    priority = 1.0
    i18n = True
    alternates = True

    def items(self):
        return ["homepage_url", "training_session_url", "manage_training_plans_url", "community_url", "blog_url"]

    def location(self, item):
        return reverse(item)

# Map For All Profile Pages + Translated Versions
class ProfileSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.5
    i18n = True
    alternates = True

    def items(self):
        return Users.objects.filter(private_account=False, account_status="OK")

# Map For All Post Pages + Translated Versions
class PostSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.8
    i18n = True
    alternates = True

    def items(self):
        return Post.objects.filter(public_visibility=True, user__private_account=False)

    def lastmod(self, obj):
        return obj.created_at