from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Authentication (JWT)
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API (Native App)
    path('login/', views.login, name='login_url'),
    path('get-logged-in-user/', views.get_logged_in_user, name='get_logged_in_user_url'),
    path('load-first-users/', views.load_first_users, name='load_first_users_url'),
    path('search-users/', views.search_users, name='search_users_url'),
    path('toggle-post-like/', views.toggle_post_like, name='toggle_post_like_url'),
    path('report-post/', views.report_post, name='report_post_url'),
    path('toggle-post-save/', views.toggle_post_save, name='toggle_post_save_url'),
    path('report-post-comment/', views.report_post_comment, name='report_post_comment_url'),
    path('add-comment/', views.add_comment, name='add_comment_url'),
    path('toggle-post-comment-like/', views.toggle_post_comment_like, name='toggle_post_comment_like_url'),
    path('get-processing-posts/', views.get_processing_posts, name='get_processing_posts_url'),
    path('get-unread-chats/', views.get_unread_chats, name='get_unread_chats_url'),
    path('get-posts/', views.get_posts, name='get_posts_url'),
]