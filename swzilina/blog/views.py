from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from .forms import contactForm, reviewForm, loginForm, passwordResetForm, registrationForm, editAccountForm, writeArticleForm, blogSubscribeForm, writeCommentForm
from blog.models import Users, Reviews, Articles, ArticleForum
from django.contrib.auth import authenticate, login, logout
from pathlib import Path
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from django.contrib import messages
from django.utils import timezone
from datetime import timedelta, datetime
from django.db.models import Avg
from django.core.mail import EmailMultiAlternatives
import random, requests, os, secrets
from django.contrib.auth.hashers import make_password, check_password

# Functions
def captureError(message):
    with open(f"{settings.BASE_DIR}/error.log", mode="a", encoding="utf-8") as file:
        # timezone.LocalTimezone
        file.write(f"[{timezone.now().strftime("%d.%m. %Y %X %Z")}] - {message}\n")

def homepageView(request):
    # Contact Form
    if request.method == "POST" and request.POST.get("contact_form_submit"):
        # Loads Data From reCaptcha In Registration Page
        recaptcha_response = request.POST.get("g-recaptcha-response")
        recaptcha_data = {
            "secret": settings.RECAPTCHA_SECRET_KEY,
            "response": recaptcha_response
        }

        # Loads reCaptcha API
        recaptcha_api = requests.post('https://www.google.com/recaptcha/api/siteverify', data=recaptcha_data).json()

        # Checks Validity Of reCaptcha Response
        if not recaptcha_api.get("success") or recaptcha_api.get("score", 0) < 0.5:
            messages.add_message(request, messages.ERROR, "Overenie&nbsp;reCaptcha&nbsp;zlyhalo")
            captureError("Overenie reCaptcha zlyhalo")

        else:
            contact_form = contactForm(request.POST, request.FILES)
            if contact_form.is_valid():
                # Send Mail
                subject = f"SW Žilina - {contact_form.cleaned_data["subject"]}"
                text_content = f"{contact_form.cleaned_data["first_name"]} {contact_form.cleaned_data["last_name"]} - {contact_form.cleaned_data["email_address"]}\n\n{contact_form.cleaned_data["message"]}"
                sender = contact_form.cleaned_data["email_address"]
                receiver = [settings.EMAIL_HOST_USER]
                html_content = f"""
                    <p>
                        <b>{contact_form.cleaned_data["first_name"]} {contact_form.cleaned_data["last_name"]} - {contact_form.cleaned_data["email_address"]}</b><br><br>
                        {contact_form.cleaned_data["message"]}
                    </p>
                """

                mail_message = EmailMultiAlternatives(subject, text_content, sender, receiver)
                mail_message.attach_alternative(html_content, "text/html")

                attachment_file = request.FILES.get("select_attachment")
                if attachment_file and attachment_file != None: # Checks If Is Any Attachment Selected
                    if attachment_file.size < 25000000:
                        mail_message.attach(attachment_file.name, attachment_file.read(), attachment_file.content_type)

                        # mail_message.send()

                        messages.add_message(request, messages.SUCCESS, "Správa&nbsp;bola&nbsp;odoslaná")

                    else:
                        messages.add_message(request, messages.ERROR, "Príloha&nbsp;je&nbsp;príliš&nbsp;veľká")
                        captureError("Príloha je príliš veľká")

                else: # Sends Mail Without An Attachment
                    # mail_message.send()

                    messages.add_message(request, messages.SUCCESS, "Správa bola odoslaná")
            
            else:
                messages.add_message(request, messages.ERROR, "Správu&nbsp;sa&nbsp;nepodarilo&nbsp;odoslať")
                captureError("Správu sa nepodarilo odoslať")

        return HttpResponseRedirect(reverse("homepage_url"))
            
    # Get All Reviews From DB
    reviews = Reviews.objects.all()

    # Info About Reviews
    avg_rating = reviews.aggregate(Avg("rating"))
    num_reviews = reviews.count()

    # Checks If User Is Logged In
    if "logged_in_user_id" in request.session:
        # Get Logged In User ID From Session
        logged_in_user_id = request.session.get("logged_in_user_id")

        # Write Review Form
        if request.method == "POST" and request.POST.get("write_review_form_submit"):
            # Loads Data From reCaptcha In Registration Page
            recaptcha_response = request.POST.get("g-recaptcha-response")
            recaptcha_data = {
                "secret": settings.RECAPTCHA_SECRET_KEY,
                "response": recaptcha_response
            }

            # Loads reCaptcha API
            recaptcha_api = requests.post('https://www.google.com/recaptcha/api/siteverify', data=recaptcha_data).json()

            # Checks Validity Of reCaptcha Response
            if not recaptcha_api.get("success") or recaptcha_api.get("score", 0) < 0.5:
                messages.add_message(request, messages.ERROR, "Overenie&nbsp;reCaptcha&nbsp;zlyhalo")
                captureError("Overenie reCaptcha zlyhalo")

                return HttpResponseRedirect(reverse("homepage_url"))
            
            else:
                review_form = reviewForm(request.POST)
                if review_form.is_valid():
                    # Checks If User Has Already Written A Review
                    if Reviews.objects.filter(user_id=logged_in_user_id).exists():
                        messages.add_message(request, messages.ERROR, "Skúste&nbsp;upraviť&nbsp;aktuálne&nbsp;hodnotenie")

                        return HttpResponseRedirect(reverse("edit_review_url"))

                    # Saves New Review To DB
                    else:
                        if int(review_form.cleaned_data["rating"]) == 0:
                            messages.add_message(request, messages.ERROR, "Ukážte&nbsp;nám&nbsp;vašu&nbsp;spokojnosť")

                        else:
                            new_review = Reviews(
                                user_id = logged_in_user_id,
                                rating = int(review_form.cleaned_data["rating"]),
                                review = review_form.cleaned_data["review"],
                            )
                            new_review.save()

                            messages.add_message(request, messages.SUCCESS, "Ďakujeme&nbsp;za&nbsp;vaše&nbsp;hodnotenie")
                        
                else:
                    messages.add_message(request, messages.ERROR, "Hodnotenie&nbsp;sa&nbsp;nepodarilo&nbsp;zverejniť")
                    captureError("Hodnotenie sa nepodarilo zverejniť")

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
            "avg_rating": avg_rating,
            "num_reviews": num_reviews,
        })
    
    else:
        # Write Review Form
        if request.method == "POST" and request.POST.get("write_review_form_submit"):
            messages.add_message(request, messages.ERROR, "Pred&nbsp;napísaním&nbsp;hodnotenia&nbsp;sa&nbsp;prihláste")

            return HttpResponseRedirect(reverse("login_url"))

    # Renders Homepage With Reviews
    return render(request, "blog/homepage.html", {
        "contact_form": contactForm,
        "review_form": reviewForm,
        "reviews": reviews,
        "avg_rating": avg_rating,
        "num_reviews": num_reviews,
    })

def loginView(request):
    if request.method == "POST":
        email_address = request.POST.get("email_address")
        password = request.POST.get("password")

        try:
            user = Users.objects.get(email_address=email_address)
            if check_password(password, user.password):
                request.session["logged_in_user_id"] = user.id

                messages.add_message(request, messages.SUCCESS, f"Úspešne&nbsp;prihlásený&nbsp;ako<br>{user.first_name}&nbsp;{user.last_name}")

                return HttpResponseRedirect(reverse("homepage_url"))
            
            else: # Wrong Password
                messages.add_message(request, messages.ERROR, "Nesprávne&nbsp;prihlasovacie&nbsp;údaje")
                captureError("Nesprávne prihlasovacie údaje")
        
        except Users.DoesNotExist: # Wrong E-mail Address
            messages.add_message(request, messages.ERROR, "Nesprávne&nbsp;prihlasovacie&nbsp;údaje")
            captureError("Nesprávne prihlasovacie údaje")

    if request.GET.get("password-reset"):
        email_address = request.COOKIES.get("email_address")
        user = Users.objects.get(email_address=email_address)

        # Generates Random 6-Digit Code
        code = ""

        for one_number in range(6):
            one_number = random.randint(0, 9)
            code += str(one_number)

        # Send Mail
        subject = "SW Žilina - Obnova hesla"
        text_content = f"Dobrý deň {user.first_name} {user.last_name},\ndostali sme žiadosť o obnovenie hesla k vášmu účtu. Ak ste to boli vy, prosím použite nasledujúci odkaz a zadajte nasledovný overovací kód.\n\nhttp://127.0.0.1:8000/obnova-hesla?password-reset-code={code} - {code}\n\nAk ste o obnovu hesla nežiadali, tento e-mail prosím ignorujte.\nTím Street Workout Žilina."
        sender = settings.EMAIL_HOST_USER
        receiver = [email_address]
        html_content = f"""
            <h1>Dobrý deň {user.first_name} {user.last_name},</h1>
            <p>dostali sme žiadosť o obnovenie hesla k vášmu účtu. Ak ste to boli vy, prosím použite <a href="http://127.0.0.1:8000/obnova-hesla?password-reset-code={code}" title="Obnoviť heslo" target="_blank">tento</a> odkaz a zadajte nasledovný overovací kód.<p>
            <h1>{code}</h1>
            <p>Ak ste o obnovu hesla nežiadali, tento e-mail prosím ignorujte.<br>
            Tím Street Workout Žilina.</p>
        """

        mail_message = EmailMultiAlternatives(subject, text_content, sender, receiver)
        mail_message.attach_alternative(html_content, "text/html")
        mail_message.send()

        # Saves Password Reset Code To Database
        user.password_reset_code = code
        user.save()

        messages.add_message(request, messages.SUCCESS, f"Overovací&nbsp;kód&nbsp;bol&nbsp;odoslaný&nbsp;na&nbsp;adresu<br>{email_address}")

        # Redirect After Sending Mail
        response = HttpResponseRedirect(reverse("password_reset_url"))
        # response["Location"] += f"?password-reset-code={code}" # Add Parameter With Code To URL
        return response

    return render(request, "blog/login.html", {
        "login_form": loginForm,
    })

def passwordResetView(request):
    if request.COOKIES.get("email_address"):
        if request.method == "POST":
            password_reset_form = passwordResetForm(request.POST)
            if password_reset_form.is_valid():
                password_reset_code = password_reset_form.cleaned_data["password_reset_code"]
                new_password = password_reset_form.cleaned_data["new_password"]

                user = Users.objects.get(email_address=request.COOKIES.get("email_address"))

                if password_reset_code == user.password_reset_code:
                    if len(new_password) < 8:
                        messages.add_message(request, messages.ERROR, "Heslo&nbsp;je&nbsp;príliš&nbsp;krátke")

                    else:
                        # Saves New Password To Database And Deletes Password Reset Code From Database
                        user.password = make_password(new_password)
                        user.password_reset_code = None
                        user.save()

                        messages.add_message(request, messages.SUCCESS, "Heslo&nbsp;bolo&nbsp;úspešne&nbsp;zmenené")

                        # Redirect After Changing Password
                        response = HttpResponseRedirect(reverse("login_url"))
                        response.delete_cookie("email_address") # Deletes Cookie With Email Address
                        return response
                
                else:
                    messages.add_message(request, messages.ERROR, "Overovací&nbsp;kód&nbsp;sa&nbsp;nezhoduje")
                    captureError("Overovací kód sa nezhoduje")

            else:
                messages.add_message(request, messages.ERROR, "Overenie&nbsp;zlyhalo")
                captureError("Overenie zlyhalo")

        if request.GET.get("password-reset"):
            email_address = request.COOKIES.get("email_address")
            user = Users.objects.get(email_address=email_address)

            # Generates Random 6-Digit Code
            code = ""

            for one_number in range(6):
                one_number = random.randint(0, 9)
                code += str(one_number)

            # Send Mail
            subject = "SW Žilina - Obnova hesla"
            text_content = f"Dobrý deň {user.first_name} {user.last_name},\ndostali sme žiadosť o obnovenie hesla k vášmu účtu. Ak ste to boli vy, prosím použite nasledujúci odkaz a zadajte nasledovný overovací kód.\n\nhttp://127.0.0.1:8000/obnova-hesla?password-reset-code={code} - {code}\n\nAk ste o obnovu hesla nežiadali, tento e-mail prosím ignorujte.\nTím Street Workout Žilina."
            sender = settings.EMAIL_HOST_USER
            receiver = [email_address]
            html_content = f"""
                <h1>Dobrý deň {user.first_name} {user.last_name},</h1>
                <p>dostali sme žiadosť o obnovenie hesla k vášmu účtu. Ak ste to boli vy, prosím použite <a href="http://127.0.0.1:8000/obnova-hesla?password-reset-code={code}" title="Obnoviť heslo" target="_blank">tento</a> odkaz a zadajte nasledovný overovací kód.<p>
                <h1>{code}</h1>
                <p>Ak ste o obnovu hesla nežiadali, tento e-mail prosím ignorujte.<br>
                Tím Street Workout Žilina.</p>
            """

            mail_message = EmailMultiAlternatives(subject, text_content, sender, receiver)
            mail_message.attach_alternative(html_content, "text/html")
            mail_message.send()

            # Saves Password Reset Code To Database
            user.password_reset_code = code
            user.save()

            messages.add_message(request, messages.SUCCESS, f"Overovací&nbsp;kód&nbsp;bol&nbsp;odoslaný&nbsp;na&nbsp;adresu<br>{email_address}")

            # Redirect After Sending Mail
            response = HttpResponseRedirect(reverse("password_reset_url"))
            # response["Location"] += f"?password-reset-code={code}" # Add Parameter With Code To URL
            return response

        # Gets Password Reset Code From URL Parameters If User Opened Attached Link In Mail
        if request.method == "GET" and request.GET.get("password-reset-code"):
            filled_password_reset_form = passwordResetForm(initial={
                "password_reset_code": request.GET.get("password-reset-code")
            })

            return render(request, "blog/password_reset.html", {
                "password_reset_form": filled_password_reset_form,
            })

    return render(request, "blog/password_reset.html", {
        "password_reset_form": passwordResetForm,
    })

def logoutView(request):
    logout(request)

    messages.add_message(request, messages.ERROR, "Boli&nbsp;ste&nbsp;odhlásený")

    return HttpResponseRedirect(reverse("homepage_url"))

def registrationView(request):
    if request.method == "POST":
        # Loads Data From reCaptcha In Registration Page
        recaptcha_response = request.POST.get("g-recaptcha-response")
        recaptcha_data = {
            "secret": settings.RECAPTCHA_SECRET_KEY,
            "response": recaptcha_response
        }

        # Loads reCaptcha API
        recaptcha_api = requests.post('https://www.google.com/recaptcha/api/siteverify', data=recaptcha_data).json()

        # Checks Validity Of reCaptcha Response
        if not recaptcha_api.get("success") or recaptcha_api.get("score", 0) < 0.5:
            messages.add_message(request, messages.ERROR, "Overenie&nbsp;reCaptcha&nbsp;zlyhalo")
            captureError("Overenie reCaptcha zlyhalo")

            return HttpResponseRedirect(reverse("registration_url"))

        else:
            registration_form = registrationForm(request.POST)
            if registration_form.is_valid():
                if Users.objects.filter(email_address=registration_form.cleaned_data["email_address"]).exists():
                    messages.add_message(request, messages.ERROR, "Tento&nbsp;e-mail&nbsp;už&nbsp;je&nbsp;zaregistrovaný")
                    captureError("Tento e-mail už je zaregistrovaný")

                elif registration_form.cleaned_data["password"] != registration_form.cleaned_data["password_check"]:
                    messages.add_message(request, messages.ERROR, "Heslá&nbsp;sa&nbsp;nezhodujú")

                elif len(registration_form.cleaned_data["password"]) < 8:
                    messages.add_message(request, messages.ERROR, "Heslo&nbsp;je&nbsp;príliš&nbsp;krátke")

                else:
                    new_user = Users(
                        first_name = registration_form.cleaned_data["first_name"],
                        last_name = registration_form.cleaned_data["last_name"],
                        email_address = registration_form.cleaned_data["email_address"],
                        phone_number = registration_form.cleaned_data["phone_number"],
                        password = make_password(registration_form.cleaned_data["password"]),
                    )
                    new_user.save()

                    # Deletes Previous User ID Session If Was Logged In
                    if "logged_in_user_id" in request.session:
                        del request.session["logged_in_user_id"]

                    # Sets User ID Session For New Registered User For Login or Switch Account
                    request.session["logged_in_user_id"] = new_user.id

                    messages.add_message(request, messages.SUCCESS, f"Úspešne&nbsp;prihlásený&nbsp;ako<br>{new_user.first_name}&nbsp;{new_user.last_name}")

                    return HttpResponseRedirect(reverse("homepage_url"))
                
            else:
                messages.add_message(request, messages.ERROR, "Registrácia&nbsp;zlyhala")
                captureError("Registrácia zlyhala")

            return HttpResponseRedirect(reverse("registration_url"))
        
    return render(request, "blog/registration.html", {
        "registration_form": registrationForm,
    })

def editAccountView(request):
    logged_in_user_id = request.session.get("logged_in_user_id")

    if logged_in_user_id:
        logged_in_user = Users.objects.get(id=logged_in_user_id)

        if request.method == "POST":
            edit_account_form = editAccountForm(request.POST, request.FILES)
            if edit_account_form.is_valid():
                delete_account = edit_account_form.cleaned_data["delete_account"]
                if delete_account:
                    current_profile_picture_name = logged_in_user.profile_picture_name
                    path = os.path.join(settings.MEDIA_ROOT, f"images/{str(logged_in_user_id)}")
                    if current_profile_picture_name != "" and current_profile_picture_name != None:
                        os.remove(f"{path}/{current_profile_picture_name}")

                    messages.add_message(request, messages.ERROR, f"Účet&nbsp;{logged_in_user.first_name}&nbsp;{logged_in_user.last_name}&nbsp;bol&nbsp;odstránený")
                    captureError(f"Účet {logged_in_user.first_name} {logged_in_user.last_name} bol odstránený")

                    logged_in_user.delete()

                    # Deletes Previous User ID Session If Was Logged In
                    del request.session["logged_in_user_id"]

                    return HttpResponseRedirect(reverse("homepage_url"))

                if logged_in_user.last_edit == None or timezone.now() - logged_in_user.last_edit >= timedelta(days=30):
                    profile_picture_file = request.FILES.get("select_profile_picture")
                    if profile_picture_file:
                        path = os.path.join(settings.MEDIA_ROOT, f"images/{str(logged_in_user_id)}")

                        current_profile_picture_name = logged_in_user.profile_picture_name
                        if current_profile_picture_name != "" and current_profile_picture_name != None:
                            os.remove(f"{path}/{current_profile_picture_name}")

                        new_image_name = f"IMG-{secrets.token_hex(nbytes=10) + Path(profile_picture_file.name).suffix}"

                        image_save_location = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, f"images/{str(logged_in_user_id)}"))
                        image_save_location.save(new_image_name, profile_picture_file)

                        logged_in_user.profile_picture_name = new_image_name

                        logged_in_user.last_edit = timezone.now()

                    delete_profile_picture = edit_account_form.cleaned_data["delete_profile_picture"]
                    if delete_profile_picture:
                        current_profile_picture_name = logged_in_user.profile_picture_name
                        path = os.path.join(settings.MEDIA_ROOT, f"images/{str(logged_in_user_id)}")
                        os.remove(f"{path}/{current_profile_picture_name}")

                        logged_in_user.profile_picture_name = ""

                        logged_in_user.last_edit = timezone.now()

                    if logged_in_user.first_name != edit_account_form.cleaned_data["first_name"] and edit_account_form.cleaned_data["first_name"] != "":
                        logged_in_user.first_name = edit_account_form.cleaned_data["first_name"]
                        logged_in_user.last_edit = timezone.now()

                    if logged_in_user.last_name != edit_account_form.cleaned_data["last_name"] and edit_account_form.cleaned_data["last_name"] != "":
                        logged_in_user.last_name = edit_account_form.cleaned_data["last_name"]
                        logged_in_user.last_edit = timezone.now()

                    if logged_in_user.email_address != edit_account_form.cleaned_data["email_address"] and edit_account_form.cleaned_data["email_address"] != "":
                        logged_in_user.email_address = edit_account_form.cleaned_data["email_address"]
                        logged_in_user.last_edit = timezone.now()

                    if logged_in_user.phone_number != edit_account_form.cleaned_data["phone_number"] and edit_account_form.cleaned_data["phone_number"] != "":
                        logged_in_user.phone_number = edit_account_form.cleaned_data["phone_number"]
                        logged_in_user.last_edit = timezone.now()

                    logged_in_user.save()

                    messages.add_message(request, messages.SUCCESS, "Zmeny&nbsp;boli&nbsp;uložené")

                    return HttpResponseRedirect(reverse("homepage_url"))

                else:
                    messages.add_message(request, messages.ERROR, f"Ďalšie&nbsp;úpravy&nbsp;budú&nbsp;možné&nbsp;{(logged_in_user.last_edit + timedelta(days=30)).strftime('%d.%m. %Y')}")
            
            else:
                messages.add_message(request, messages.ERROR, "Zmeny&nbsp;sa&nbsp;nepodarilo&nbsp;vykonať")
                captureError("Zmeny sa nepodarilo vykonať")

            return HttpResponseRedirect(reverse("edit_account_url"))
        
        if request.GET.get("password-reset"):
            # Generates Random 6-Digit Code
            code = ""

            for one_number in range(6):
                one_number = random.randint(0, 9)
                code += str(one_number)

            # Send Mail
            subject = "SW Žilina - Obnova hesla"
            text_content = f"Dobrý deň {logged_in_user.first_name} {logged_in_user.last_name},\ndostali sme žiadosť o obnovenie hesla k vášmu účtu. Ak ste to boli vy, prosím použite nasledujúci odkaz a zadajte nasledovný overovací kód.\n\nhttp://127.0.0.1:8000/obnova-hesla?password-reset-code={code} - {code}\n\nAk ste o obnovu hesla nežiadali, tento e-mail prosím ignorujte.\nTím Street Workout Žilina."
            sender = settings.EMAIL_HOST_USER
            receiver = [logged_in_user.email_address]
            html_content = f"""
                <h1>Dobrý deň {logged_in_user.first_name} {logged_in_user.last_name},</h1>
                <p>dostali sme žiadosť o obnovenie hesla k vášmu účtu. Ak ste to boli vy, prosím použite <a href="http://127.0.0.1:8000/obnova-hesla?password-reset-code={code}" title="Obnoviť heslo" target="_blank">tento</a> odkaz a zadajte nasledovný overovací kód.<p>
                <h1>{code}</h1>
                <p>Ak ste o obnovu hesla nežiadali, tento e-mail prosím ignorujte.<br>
                Tím Street Workout Žilina.</p>
            """

            mail_message = EmailMultiAlternatives(subject, text_content, sender, receiver)
            mail_message.attach_alternative(html_content, "text/html")
            mail_message.send()

            # Saves Password Reset Code To Database
            logged_in_user.password_reset_code = code
            logged_in_user.save()

            messages.add_message(request, messages.SUCCESS, f"Overovací&nbsp;kód&nbsp;bol&nbsp;odoslaný&nbsp;na&nbsp;adresu<br>{logged_in_user.email_address}")

            # Redirect After Sending Mail
            response = HttpResponseRedirect(reverse("password_reset_url"))
            # response["Location"] += f"?password-reset-code={code}" # Add Parameter With Code To URL
            return response

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
    
    return render(request, "blog/edit_account.html")
    
def editReviewView(request):
    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id")

        review = Reviews.objects.get(user_id=logged_in_user_id)

        if request.method == "POST":
            if review.last_edit == None or timezone.now() - review.last_edit >= timedelta(days=30):
                review_form = reviewForm(request.POST)
                if review_form.is_valid():
                    if review.rating != int(review_form.cleaned_data["rating"]):
                        review.rating = int(review_form.cleaned_data["rating"])
                        review.last_edit = timezone.now()

                    if review.review != review_form.cleaned_data["review"]:
                        review.review = review_form.cleaned_data["review"]
                        review.last_edit = timezone.now()

                    review.save()

                    delete_review = review_form.cleaned_data["delete_review"]
                    if delete_review:
                        review.delete()

                        messages.add_message(request, messages.ERROR, "Vaše&nbsp;hodnotenie&nbsp;bolo&nbsp;odstránené")

                        return HttpResponseRedirect(reverse("homepage_url"))
                    
                    messages.add_message(request, messages.SUCCESS, "Zmeny&nbsp;boli&nbsp;uložené")

                    return HttpResponseRedirect(reverse("homepage_url"))
                
                else:
                    messages.add_message(request, messages.ERROR, "Zmeny&nbsp;sa&nbsp;nepodarilo&nbsp;vykonať")
                    captureError("Zmeny sa nepodarilo vykonať")

                return HttpResponseRedirect(reverse("edit_review_url"))
            
            else:
                messages.add_message(request, messages.ERROR, f"Ďalšie&nbsp;úpravy&nbsp;budú&nbsp;možné&nbsp;{(review.last_edit + timedelta(days=30)).strftime('%d.%m. %Y')}")
        
        filled_review_form = reviewForm(initial={
            "rating": review.rating,
            "review": review.review,
        })

        return render(request, "blog/edit_review.html", {
            "review_form": filled_review_form,
            "review": review,
        })
    
    return render(request, "blog/edit_review.html")

def blogView(request):
    # Gets All Articles From DB
    articles = Articles.objects.all()

    no_articles = True # Default Value That Says That There Are No Articles In The Database

    # Sorts Articles By User Preferencies (The Latest Articles Are Set As Default)
    sort = request.GET.get("sort", "latest").lower()
    category = request.GET.get("category", "all").lower()

    if sort == "latest":
        if category == "all":
            articles.order_by("-creation_time")

        else:
            articles = articles.filter(categories__contains=[category]).order_by("-creation_time")

    if sort == "popular":
        if category == "all":
            articles = articles.order_by("-visitors")

        else:
            articles = articles.filter(categories__contains=[category]).order_by("-visitors")

    elif sort == "best":
        if category == "all":
            articles = articles.order_by("-rating")

        else:
            articles = articles.filter(categories__contains=[category]).order_by("-rating")

    elif sort == "a-z":
        if category == "all":
            articles = articles.order_by("title")
        
        else:
            articles = articles.filter(categories__contains=[category]).order_by("title")

    elif sort == "z-a":
        if category == "all":
            articles = articles.order_by("-title")
        
        else:
            articles = articles.filter(categories__contains=[category]).order_by("-title")

    num_articles = articles.count() # Number Of All Articles

    # Checks If There Are Any Articles In The Database
    if(articles.exists()):
        no_articles = False

    # Blog Subscribe Form
    if request.method == "POST":
        blog_subscribe_form = blogSubscribeForm(request.POST)
        if blog_subscribe_form.is_valid():
            email_address = blog_subscribe_form.cleaned_data["email_address"]
            
            try:
                subscribed_user = Users.objects.get(email_address=email_address)
                subscribed_user.blog_subscribe = True
                subscribed_user.save()

                messages.add_message(request, messages.SUCCESS, f"Budete&nbsp;dostávať&nbsp;upozornenia&nbsp;na&nbsp;adresu<br>{email_address}")

            # Account With The Entered E-mail Address Does Not Exist
            except:
                pass

    # Checks If User Is Logged In
    if "logged_in_user_id" in request.session:
        # Get Logged In User ID From Session
        logged_in_user_id = request.session.get("logged_in_user_id")

        # Get Logged In User From DB
        user = Users.objects.get(id=logged_in_user_id)

        # Automatically Set Values Into Contact Form When User Is Logged In
        filled_blog_subscribe_form = blogSubscribeForm(initial={
            "email_address": user.email_address,
        })

        # Renders Homepage With Filled Contact Form, User Data And Reviews
        return render(request, "blog/blog.html", {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "profile_picture_name": user.profile_picture_name,
            "articles": articles,
            "no_articles": no_articles,
            "blog_subscribe_form": filled_blog_subscribe_form,
            "num_articles": num_articles,
        })

    # Renders Page With Articles Data
    return render(request, "blog/blog.html", {
        "articles": articles,
        "blog_subscribe_form": blogSubscribeForm,
        "num_articles": num_articles,
    })

def blogThemeView(request, theme):
    try:
        # Gets Logged In User
        if "logged_in_user_id" in request.session:
            # Gets Logged In User ID From Session
            logged_in_user_id = request.session.get("logged_in_user_id")

            # Gets Logged In User From DB
            user = Users.objects.get(id=logged_in_user_id)
            # Gets Article By URL Address
            article = Articles.objects.get(link=theme)
            # Gets All Comments Of The Article
            comments = ArticleForum.objects.filter(article_id=article.id)

            # print(comments[0].comment)

        # Adds 1 Visitor to The Article's Unique Visitors
        if not request.COOKIES.get(article.link):
            article.visitors += 1
            article.save()

        # Write Comment Form
        if request.method == "POST":
            write_comment_form = writeCommentForm(request.POST)
            if write_comment_form.is_valid():
                new_comment = ArticleForum(
                    article_id = article.id,
                    user_id = logged_in_user_id,
                    comment = write_comment_form.cleaned_data["comment"],
                )
                new_comment.save()

        response = render(request, "blog/articles.html", {
            "article": article,
            "comments": comments,
            "profile_picture_name": user.profile_picture_name,
            "write_comment_form": writeCommentForm,
            "not_found": False,
        })

        response.set_cookie(article.link, "visited", expires=timezone.now() + timedelta(days=365)) # Sets 1 Year Timed Cookie About Information That The User Has Already Visited The Article

        return response
    
    except:
        return render(request, "blog/articles.html", {
            "not_found": True,
        })
    
def writeArticleView(request):
    logged_in_user_id = request.session.get("logged_in_user_id")

    if request.method == "POST":
        write_article_form = writeArticleForm(request.POST, request.FILES)
        if write_article_form.is_valid():
            categories = []
            categories.append(write_article_form.cleaned_data["category_style"])
            categories.append(write_article_form.cleaned_data["category_movement"])
            categories.append(write_article_form.cleaned_data["category_difficulty"])

            new_image_name = None # Default Image Name Is Saved To Database As null

            article_image_file = request.FILES.get("select_article_image")
            if article_image_file:
                new_image_name = write_article_form.cleaned_data["link"] + Path(article_image_file.name).suffix
                image_save_location = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, f"images/{str(logged_in_user_id)}"))
                image_save_location.save(new_image_name, article_image_file)

            new_article = Articles(
                user_id = logged_in_user_id,
                title = write_article_form.cleaned_data["title"],
                content = write_article_form.cleaned_data["content"],
                categories = categories,
                link = write_article_form.cleaned_data["link"],
                image_name = new_image_name,
            )
            new_article.save()

    return render(request, "blog/write_article.html", {
        "write_article_form": writeArticleForm
    })