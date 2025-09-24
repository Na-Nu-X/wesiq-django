from django.shortcuts import render
from django.http import HttpResponse

# Data For Themes In Blog Page.

themes = [
    {
        "theme": "Front Lever",
        "slug": "frontlever",
        "page": "frontlever.html"
    },

    {
        "theme": "Stojka",
        "slug": "handstand",
        "page": "handstand.html"
    }
]

# Functions For Render Content On Pages.

def home_page(request):
    return render(request, "blog/index.html")

def blog(request):
    return render(request, "blog/blog.html", {
        "themes": themes
    })

def blog_theme(request, slug):
    identified_theme = next(theme for theme in themes if theme["slug"] == slug)
    print(identified_theme)
    return render(request, "blog/blog_theme.html", {
        "identified_theme": identified_theme
    })

# def frontlever(request):
#     return render(request, "blog/frontlever.html")