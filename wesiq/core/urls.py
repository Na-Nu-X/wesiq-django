from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns
from django.views.i18n import JavaScriptCatalog
import os
from app import views

urlpatterns = [
    path(os.environ.get('ADMIN_URL'), admin.site.urls), # admin/
    path('accounts/', include('allauth.urls')), # Google OAuth 2.0
    path('i18n/', include('django.conf.urls.i18n')), # Translation
    path('jsi18n/', JavaScriptCatalog.as_view(), name='javascript_catalog_url'), # JS Translation
    path('rosetta/', include('rosetta.urls')), # Rosetta (Language Admin Site)

    # URLs For JS POST Data
    path('like-comment/<int:comment_id>/', views.likeComment, name='like_comment_url'),
    path('cancel-like-comment/<int:comment_id>/', views.cancelLikeComment, name='cancel_like_comment_url'),
    path('report-comment/<int:comment_id>/', views.reportComment, name='report_comment_url'),

    path('follow/<int:user_id>/', views.follow, name='follow_url'),
    path('unfollow/<int:user_id>/', views.unfollow, name='unfollow_url'),
    path('like-post/<int:post_id>/', views.likePost, name='like_post_url'),
    path('cancel-like-post/<int:post_id>/', views.cancelLikePost, name='cancel_like_post_url'),
]

urlpatterns += i18n_patterns(
    path('', include('app.urls')),

    # prefix_default_language=False
)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)