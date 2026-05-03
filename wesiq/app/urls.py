from django.urls import path
from . import views
from django.utils.translation import gettext_lazy as _

urlpatterns = [
    path('', views.homepageView, name='homepage_url'),
    path(_('domov/'), views.homepageView),
    path(_('prihlasenie/'), views.loginView, name='login_url'),
    path(_('obnova-hesla/'), views.passwordResetView, name='password_reset_url'),
    path(_('odhlasenie/'), views.logoutView, name='logout_url'),
    path(_('registracia/'), views.registrationView, name='registration_url'),
    path(_('profil/<str:username>'), views.profileView, name='profile_url'),
    path(_('moje-hodnotenie/'), views.editReviewView, name='edit_review_url'),
    path(_('pridat-clanok/'), views.writeArticleView, name='write_article_url'),
    path(_('trening/'), views.trainingSessionView, name='training_session_url'),
    path(_('moje-treningove-plany/'), views.manageTrainingPlansView, name='manage_training_plans_url'),
    path(_('komunita/'), views.communityView, name='community_url'),
    path('api/load-posts/', views.loadPostsView, name='load_posts_url'),
    path(_('prispevok/<str:post_id>'), views.postView, name='post_url'),
    path('blog/', views.blogView, name='blog_url'),
    path('blog/<str:theme>', views.blogThemeView, name='blog_theme_url'),
    path('change-language/', views.changeLanguage, name='change_language_url'),
    path(_('platba-uspesna/'), views.successDonation, name='success_donation_url'),
    # path(_('platba-zrusena/'), views.cancelDonation, name='cancel_donation_url'),
    path('create-payment-intent/', views.createPaymentIntent, name='create_payment_intent_url'),
    path('stripe/webhook/', views.stripeWebhook, name='stripe_webhook_url'),
]