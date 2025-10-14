from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from .forms import contactForm, loginForm, registrationForm
from blog.models import Users
from django.contrib.auth import authenticate, login

def homepage(request):
    # if request.method == "POST":
    #     message = request.POST.get("message")

    #     filled_contact_form = contactForm(initial={
    #         "message": message
    #     })

    #     return render(request, "blog/homepage.html", {
    #         "contact_form": filled_contact_form,
    #     })

    if "logged_in_user_id" in request.session:
        # Find Logged In User In DB From His ID
        logged_in_user_id = request.session.get("logged_in_user_id")

        user = Users.objects.get(id=logged_in_user_id)

        # Automatically Set Values Into Contact Form When User Is Logged In
        filled_contact_form = contactForm(initial={
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email_address": user.email_address,
        })

        # Render Homepage With Filled Contact Form And User Data
        return render(request, "blog/homepage.html", {
            "contact_form": filled_contact_form,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email_address": user.email_address,
            "phone_number": user.phone_number,
            "role": user.role,
        })

    return render(request, "blog/homepage.html", {
        "contact_form": contactForm,
    })

def login(request):
    if request.method == "POST":
        email_address = request.POST.get("email_address")
        password = request.POST.get("password")

        try:
            user = Users.objects.get(email_address=email_address, password=password)
            request.session["logged_in_user_id"] = user.id
            return HttpResponseRedirect(reverse("homepage_url"))
        
        except Users.DoesNotExist:
            print("Nesprávne prihlasovacie údaje!")
            return HttpResponseRedirect(reverse("homepage_url"))

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

def logout(request):
    request.session.flush()
    return HttpResponseRedirect(reverse("homepage_url"))
