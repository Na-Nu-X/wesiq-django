from django.shortcuts import render
from django.http import HttpResponse
from .forms import contactForm, loginForm, registrationForm

def homepage(request):
    return render(request, "blog/homepage.html", {
        "contact_form": contactForm,
    })

def login(request):
    return render(request, "blog/login.html", {
        "login_form": loginForm,
    })

def registration(request):
    return render(request, "blog/registration.html", {
        "registration_form": registrationForm,
    })