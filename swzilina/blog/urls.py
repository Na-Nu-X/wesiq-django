from django.urls import path
from . import views

urlpatterns = [
    path('', views.homepage, name='homepage_url'),
    path('prihlasenie', views.login, name='login_url'),
    path('registracia', views.registration, name='registration_url'),
    path('moj-ucet', views.edit_account, name='edit_account_url')
]
