from django.shortcuts import render
from django.http import HttpResponse

def homepage(request):
    return render(request, "blog/homepage.html")

def login(request):
    return render(request, "blog/login.html")

def registration(request):
    return render(request, "blog/registration.html")