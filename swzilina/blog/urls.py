from django.urls import path
from . import views

urlpatterns = [
    path('', views.homepage_view, name='homepage_url'),
    path('prihlasenie', views.login_view, name='login_url'),
    path('obnova-hesla', views.password_reset_view, name='password_reset_url'),
    path('odhlasenie', views.logout_view, name='logout_url'),
    path('registracia', views.registration_view, name='registration_url'),
    path('moj-ucet', views.edit_account_view, name='edit_account_url'),
    path('moje-hodnotenie', views.edit_review_view, name='edit_review_url'),
]
