from django.urls import path
from . import views

urlpatterns = [
    path('', views.homepage, name='homepage_url'),
    path('login', views.login, name='login_url'),
    path('registration', views.registration, name='registration_url'),
]
