from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from .forms import contactForm, loginForm, registrationForm
from blog.models import Users

def homepage(request):
    return render(request, "blog/homepage.html", {
        "contact_form": contactForm,
    })

def login(request):
    return render(request, "blog/login.html", {
        "login_form": loginForm,
    })

def registration(request):
    if request.method == "POST":
        registration_form = registrationForm(request.POST)
        if registration_form.is_valid():
            new_user = Users(
                first_name = registration_form.cleaned_data["first_name"],
                last_name = registration_form.cleaned_data["last_name"],
                email_address = registration_form.cleaned_data["email_address"],
                phone_number = registration_form.cleaned_data["phone_number"],
                password = registration_form.cleaned_data["password"],
            )
            new_user.save()

            # return render(request, "blog/registration.html", {
            #     "registration_form": registrationForm,
            #     "registration_successful": True,
            # })

            return HttpResponseRedirect(reverse("homepage_url"))
        
    return render(request, "blog/registration.html", {
        "registration_form": registrationForm,
    })