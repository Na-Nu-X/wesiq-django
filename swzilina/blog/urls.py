from django.urls import path
from . import views

urlpatterns = [
    path('', views.homepageView, name='homepage_url'),
    path('prihlasenie', views.loginView, name='login_url'),
    path('obnova-hesla', views.passwordResetView, name='password_reset_url'),
    path('odhlasenie', views.logoutView, name='logout_url'),
    path('registracia', views.registrationView, name='registration_url'),
    path('moj-ucet', views.editAccountView, name='edit_account_url'),
    path('moje-hodnotenie', views.editReviewView, name='edit_review_url'),
]
