from django.urls import path
from . import views

urlpatterns = [
    path("", views.home_page, name="home_page"),
    # path("frontlever/", views.frontlever, name="frontlever")
    path("blog/", views.blog, name="blog"),
    path("blog/<slug:slug>", views.blog_theme, name="blog_theme")
]