from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns
from django.views.i18n import JavaScriptCatalog
import os
from app import views

urlpatterns = [
    path(os.environ.get('ADMIN_URL'), admin.site.urls), # Admin Page
    path('accounts/', include('allauth.urls')), # Google OAuth 2.0
    path('i18n/', include('django.conf.urls.i18n')), # Translation
    path('jsi18n/', JavaScriptCatalog.as_view(), name='javascript_catalog_url'), # JS Translation
    path('rosetta/', include('rosetta.urls')), # Rosetta (Language Admin Site)

    path('api/load-posts/', views.loadPostsView, name='load_posts_url'),
    path('api/load-post-comments/<int:post_id>/', views.loadPostCommentsView, name='load_post_comments_url'),
    path('api/stream-video/<int:user_id>/<int:media_id>/<path:filename>', views.streamVideo, name='stream_video_url'),
    path('api/compression-status/<str:task_id>/', views.getCompressionStatus, name='compression_status_url'),
    path('api/update-video-watch-time/', views.updateVideoWatchTime, name='update_video_watch_time_url')
]

urlpatterns += i18n_patterns(
    path('', include('app.urls')),

    # prefix_default_language=False
)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)