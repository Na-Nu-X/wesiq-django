from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.

def home_page(request):
    return render(request, "blog/index.html")

def blog(request):
    return render(request, "blog/blog.html")

def blog_theme(request):
    return render(request, "blog/blog_theme.html")

# def frontlever(request):
#     return render(request, "blog/frontlever.html")