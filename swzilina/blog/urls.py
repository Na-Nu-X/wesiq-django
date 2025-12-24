from django.urls import path
from . import views

urlpatterns = [
    path('', views.homepageView, name='homepage_url'),
    path('domov', views.homepageView),
    path('home', views.homepageView),

    path('prihlasenie', views.loginView, name='login_url'),
    path('login', views.loginView),

    path('obnova-hesla', views.passwordResetView, name='password_reset_url'),
    path('password-reset', views.passwordResetView),

    path('odhlasenie', views.logoutView, name='logout_url'),
    path('logout', views.logoutView),

    path('registracia', views.registrationView, name='registration_url'),
    path('registration', views.registrationView),

    path('moj-ucet', views.editAccountView, name='edit_account_url'),
    path('my-account', views.editAccountView),

    path('moje-hodnotenie', views.editReviewView, name='edit_review_url'),
    path('my-review', views.editReviewView),

    path('blog/', views.blogView, name='blog_url'),
    path('blog/<str:theme>', views.blogThemeView, name='blog_theme_url'),

    path('pridat-clanok', views.writeArticleView, name='write_article_url'),
    path('write-article', views.writeArticleView),

    path('trening', views.trainingSessionView, name='training_session_url'),
    path('training-session', views.trainingSessionView),

    path('like-comment/<int:comment_id>', views.likeComment, name='like_comment_url'),
    path('cancel-like-comment/<int:comment_id>', views.cancelLikeComment, name='cancel_like_comment_url'),
    path('report-comment/<int:comment_id>', views.reportComment, name='report_comment_url'),
]