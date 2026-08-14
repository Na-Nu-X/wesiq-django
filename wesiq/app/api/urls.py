from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Authentication (JWT)
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API (Native App)
    path('login/', views.login, name='login_url'),
    path('load-first-users/', views.load_first_users, name='load_first_users_url'),
    path('search-users/', views.search_users, name='search_users_url'),
]