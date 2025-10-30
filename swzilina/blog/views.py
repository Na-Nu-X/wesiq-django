from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from .forms import contactForm, reviewForm, loginForm, registrationForm, editAccountForm
from blog.models import Users, Reviews
from django.contrib.auth import authenticate, login, logout
import secrets
from pathlib import Path
import os
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from django.contrib import messages

def homepage_view(request):
    # Get All Reviews From DB
    reviews = Reviews.objects.all()

    if "logged_in_user_id" in request.session:
        # Get Logged In User ID From Session
        logged_in_user_id = request.session.get("logged_in_user_id")

        # Write Review Form
        if request.method == "POST" and request.POST.get("write_review_form_submit"):
            review_form = reviewForm(request.POST)
            if review_form.is_valid():
                # Checks If User Has Already Written A Review
                existing_review = Reviews.objects.filter(user_id=logged_in_user_id)
                if existing_review:
                    messages.add_message(request, messages.ERROR, "Skúste upraviť aktuálne hodnotenie")

                # Saves New Review To DB
                else:
                    new_review = Reviews(
                        user_id = logged_in_user_id,
                        rating = int(review_form.cleaned_data["rating"]),
                        review = review_form.cleaned_data["review"],
                    )
                    new_review.save()

                    messages.add_message(request, messages.SUCCESS, "Ďakujeme za vaše hodnotenie")

                return HttpResponseRedirect(reverse("homepage_url"))

        # Get Logged In User From DB
        user = Users.objects.get(id=logged_in_user_id)

        # Automatically Set Values Into Contact Form When User Is Logged In
        filled_contact_form = contactForm(initial={
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email_address": user.email_address,
        })

        # Renders Homepage With Filled Contact Form, User Data And Reviews
        return render(request, "blog/homepage.html", {
            "contact_form": filled_contact_form,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email_address": user.email_address,
            "phone_number": user.phone_number,
            "role": user.role,
            "profile_picture_name": user.profile_picture_name,
            "review_form": reviewForm,
            "reviews": reviews,
        })

    # Renders Homepage With Reviews
    return render(request, "blog/homepage.html", {
        "contact_form": contactForm,
        "review_form": reviewForm,
        "reviews": reviews,
    })

def login_view(request):
    if request.method == "POST":
        email_address = request.POST.get("email_address")
        password = request.POST.get("password")

        try:
            user = Users.objects.get(email_address=email_address, password=password)
            request.session["logged_in_user_id"] = user.id

            messages.add_message(request, messages.SUCCESS, f"Úspešne prihlásený ako {user.first_name + " " + user.last_name}")

            return HttpResponseRedirect(reverse("homepage_url"))
        
        except Users.DoesNotExist:
            messages.add_message(request, messages.ERROR, "Nepodarilo sa prihlásiť")

            return HttpResponseRedirect(reverse("homepage_url"))

    return render(request, "blog/login.html", {
        "login_form": loginForm,
    })

def logout_view(request):
    logout(request)

    messages.add_message(request, messages.ERROR, "Boli ste odhlásený")

    return HttpResponseRedirect(reverse("homepage_url"))

def registration_view(request):
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

            return HttpResponseRedirect(reverse("homepage_url"))
        
    return render(request, "blog/registration.html", {
        "registration_form": registrationForm,
    })

def edit_account_view(request):
    logged_in_user_id = request.session.get("logged_in_user_id")

    if logged_in_user_id:
        logged_in_user = Users.objects.get(id=logged_in_user_id)

        if request.method == "POST":
            edit_account_form = editAccountForm(request.POST, request.FILES)
            if edit_account_form.is_valid():
                profile_picture_file = request.FILES.get("select_profile_picture")
                if profile_picture_file:
                    current_profile_picture_name = logged_in_user.profile_picture_name
                    if current_profile_picture_name != "":
                        path = os.path.join(settings.MEDIA_ROOT, f"images/{str(logged_in_user_id)}")
                        os.remove(f"{path}/{current_profile_picture_name}")

                    new_image_name = f"IMG-{secrets.token_hex(nbytes=10) + Path(profile_picture_file.name).suffix}"

                    image_save_location = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, f"images/{str(logged_in_user_id)}"))
                    image_save_location.save(new_image_name, profile_picture_file)

                    logged_in_user.profile_picture_name = new_image_name

                delete_profile_picture = edit_account_form.cleaned_data["delete_profile_picture"]
                if delete_profile_picture:
                    current_profile_picture_name = logged_in_user.profile_picture_name
                    path = os.path.join(settings.MEDIA_ROOT, f"images/{str(logged_in_user_id)}")
                    os.remove(f"{path}/{current_profile_picture_name}")

                    logged_in_user.profile_picture_name = ""

                if logged_in_user.first_name != edit_account_form.cleaned_data["first_name"] and edit_account_form.cleaned_data["first_name"] != "":
                    logged_in_user.first_name = edit_account_form.cleaned_data["first_name"]

                if logged_in_user.last_name != edit_account_form.cleaned_data["last_name"] and edit_account_form.cleaned_data["last_name"] != "":
                    logged_in_user.last_name = edit_account_form.cleaned_data["last_name"]

                if logged_in_user.email_address != edit_account_form.cleaned_data["email_address"] and edit_account_form.cleaned_data["email_address"] != "":
                    logged_in_user.email_address = edit_account_form.cleaned_data["email_address"]

                if logged_in_user.phone_number != edit_account_form.cleaned_data["phone_number"] and edit_account_form.cleaned_data["phone_number"] != "":
                    logged_in_user.phone_number = edit_account_form.cleaned_data["phone_number"]

                logged_in_user.save()

                delete_account = edit_account_form.cleaned_data["delete_account"]
                if delete_account:
                    current_profile_picture_name = logged_in_user.profile_picture_name
                    path = os.path.join(settings.MEDIA_ROOT, f"images/{str(logged_in_user_id)}")
                    os.remove(f"{path}/{current_profile_picture_name}")

                    logged_in_user.delete()

            messages.add_message(request, messages.SUCCESS, "Zmeny boli uložené")

            return HttpResponseRedirect(reverse("homepage_url"))

        filled_edit_account_form = editAccountForm(initial={
            "first_name": logged_in_user.first_name,
            "last_name": logged_in_user.last_name,
            "email_address": logged_in_user.email_address,
            "phone_number": logged_in_user.phone_number,
        })

        return render(request, "blog/edit_account.html", {
            "edit_account_form": filled_edit_account_form,
            "first_name": logged_in_user.first_name,
            "last_name": logged_in_user.last_name,
            "email_address": logged_in_user.email_address,
            "phone_number": logged_in_user.phone_number,
            "profile_picture_name": logged_in_user.profile_picture_name,
        })
    
def edit_review_view(request):
    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id")

        review = Reviews.objects.get(user_id=logged_in_user_id)

        if request.method == "POST":
            review_form = reviewForm(request.POST)
            if review_form.is_valid():
                if review.rating != int(review_form.cleaned_data["rating"]):
                    review.rating = int(review_form.cleaned_data["rating"])

                if review.review != review_form.cleaned_data["review"]:
                    review.review = review_form.cleaned_data["review"]

                review.save()

                delete_review = review_form.cleaned_data["delete_review"]
                if delete_review:
                    review.delete()

                    messages.add_message(request, messages.ERROR, "Vaše hodnotenie bolo odstránené")

                    return HttpResponseRedirect(reverse("homepage_url"))
                
            messages.add_message(request, messages.SUCCESS, "Zmeny boli uložené")

            return HttpResponseRedirect(reverse("homepage_url"))
        
        filled_review_form = reviewForm(initial={
            "rating": review.rating,
            "review": review.review,
        })

        return render(request, "blog/edit_review.html", {
            "review_form": filled_review_form,
            "review": review,
        })
    
    return render(request, "blog/edit_review.html")