from django.shortcuts import render
from django.http import HttpResponseRedirect, HttpResponse
from django.urls import reverse
from urllib3 import HTTPResponse
from .forms import contactForm, reviewForm, loginForm, passwordResetForm, registrationForm, editAccountForm, writeArticleForm, writeCommentForm, uploadPostForm, bioLinksForm
from app.models import Users, FollowRelation, SpecialBadges, UserDailyOfficialTasks, Reviews, ReviewReport, Articles, ArticleRating, ArticleForum, ArticleForumReport, Activity, TrainingPlan, Exercises, OfficialTasks, CustomTasks, Transactions, Post, PostMedia, SeenPost, VideoView, PostForum, PostReport, PostForumReport, BioLinks, UsersReport, Chat, Subscription
from django.contrib.auth import logout
from pathlib import Path
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from django.contrib import messages
from django.utils import timezone
from datetime import timedelta, datetime
from django.db.models import Avg
from django.core.mail import EmailMultiAlternatives
import random, requests, os, secrets, mimetypes
from django.contrib.auth.hashers import make_password, check_password
from django.db.models import Q
import math
from django.http import JsonResponse
from django.db.models import Sum
from django.db.models.functions import TruncDate, Mod, Cast, Coalesce
import json
from django.db.models import F, IntegerField, ExpressionWrapper, Value
from django.utils.translation import gettext as _
from django.utils import translation
from django.urls import translate_url
from django.shortcuts import redirect
from django.core.cache import cache
import stripe
from django.views.decorators.csrf import csrf_exempt
import string
from django.views.decorators.http import require_POST
from django.contrib.gis.geos import Point
import magic
from django_ratelimit.decorators import ratelimit
from django_ratelimit.core import get_usage
from django.db.models import Prefetch
from moviepy import VideoFileClip
from django.core.paginator import Paginator
from .tasks import compressImage, compressVideo
from celery.result import AsyncResult
from django.http import Http404
from ranged_response import RangedFileResponse
from django.core.exceptions import ValidationError
from collections import defaultdict
from django.db.models import Exists, OuterRef, Case, When, BooleanField, Count, Subquery, FloatField
from django.http import FileResponse
from django.template.loader import render_to_string
from django.db import transaction
from celery import current_app
from itertools import chain
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.http import Http404

stripe.api_key = settings.STRIPE_SECRET_KEY
 
# Functions

def changeLanguage(request):
    language_code = request.POST.get("language")
    next_url = request.POST.get("next", "/")

    response = HttpResponseRedirect(next_url)

    if language_code:
        target_url = translate_url(next_url, language_code)
        
        if target_url != next_url:
            response = HttpResponseRedirect(target_url)

        translation.activate(language_code)
        response.set_cookie(settings.LANGUAGE_COOKIE_NAME, language_code)

        # Stores Language To The User's DB
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Get Logged In User ID From Session
            user = Users.objects.get(id=logged_in_user_id) # Get Logged In User From DB

            user.language = language_code
            user.save()
        
    return response

# Functions
def captureError(message):
    with open(f"{settings.LOGS_DIR}/error.log", mode="a", encoding="utf-8") as file:
        # timezone.LocalTimezone
        file.write(f"[{timezone.now().strftime("%d.%m. %Y %X %Z")}] - {message}\n")

def captureLogin(message):
    with open(f"{settings.LOGS_DIR}/login.log", mode="a", encoding="utf-8") as file:
        # timezone.LocalTimezone
        file.write(f"[{timezone.now().strftime("%d.%m. %Y %X %Z")}] - {message}\n")

def getClientIp(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()

    else:
        ip = request.META.get('REMOTE_ADDR')

    return ip

def getClientLocation(ip):
    if ip == "127.0.0.1":
        return _("Lokálny test")

    try:
        response = requests.get(f"http://ip-api.com/json/{ip}", timeout=3)
        data = response.json()

        if data.get("status") == "fail":
            return _("Neznáme.")

        country = data.get("country", "Neznáme.")
        city = data.get("city", "Neznáme.")

        return f"{country}, {city}"
    
    except requests.exceptions.RequestException:
        return _("Služba je nedostupná.")

# Generates Random 6-Digit Code
def generateCode(length=6, letters=False):
    code = ""

    if letters:
        characters = string.digits + string.ascii_letters

        for one_character in range(length):
            one_character = random.choice(characters)
            code += str(one_character)

    else:
        characters = string.digits

        for one_character in range(length):
            one_character = random.choice(characters)
            code += str(one_character)

    return code

def sendMail(user, subject, text_content, html_content, html_content_end, html_content_middle=""):
    with translation.override(user.language):
        # Send Mail
        subject = f"Wesiq - {subject}"
        text_content = _("Ahoj %(username)s") % {"username": user.username} + f",\n{text_content}"
        sender = settings.EMAIL_HOST_USER
        receiver = [user.email_address]
        html_content = f"""
            <h1>{_('Ahoj %(username)s') % {"username": user.username}},</h1>
            <p>{html_content}<p>
            <h1>{html_content_middle}</h1>
            <p>{html_content_end}<br>
            {_('Tím')} Wesiq.</p>
        """

        mail_message = EmailMultiAlternatives(subject, text_content, sender, receiver)
        mail_message.attach_alternative(html_content, "text/html")
        mail_message.send()

# Views

def successDonation(request):
    messages.add_message(request, messages.SUCCESS, _("Ďakujeme za Vašu podporu!"))

    return redirect("homepage_url")

# def cancelDonation(request):
#     messages.add_message(request, messages.SUCCESS, _("Platba nebola dokončená.\nAk ste mali problém, skúste to neskôr."))

#     return redirect("homepage_url")

def createPaymentIntent(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body) # Gets The Data
            amount = int(data.get("amount")) # Gets The Amount
            name = data.get("name", "Anonymous") # Gets The Name

            logged_in_user_id = request.session.get("logged_in_user_id") if "logged_in_user_id" in request.session else None

            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency="eur",

                metadata={
                    "integration_check": "accept_a_payment",
                    "user_id": logged_in_user_id
                },
            )

            # Creates The Transaction
            Transactions.objects.create(
                user_id=logged_in_user_id,
                stripe_intent_id=intent.id,
                cardholder_name=name,
                amount=amount / 100,
                status="pending",
                title="Donation"
            )

            return JsonResponse({
                "client_secret": intent.client_secret
            }, status=200)

        except Exception as e:
            captureError(f"An error occurred while processing the payment.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

            return JsonResponse({
                "success": False, 
                "message": _("Pri spracovávaní platby došlo k chybe.")
            }, status=400)
            
    captureError(f"Payment can only be made using the POST method.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

    return JsonResponse({
        "success": False, 
        "message": _("Platba sa dá uskutočniť len pomocou POST metódy.")
    }, status=405)

def successSubscription(request):
    messages.add_message(request, messages.SUCCESS, _("Ďakujeme za kúpu predplatného!"))

    return redirect("homepage_url")

def createSubscriptionIntent(request):
    logged_in_user_id = None # Default State When The User Isn't Logged In

    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id") # Gets The Logged In User ID

        if request.method == "POST":
            try:
                data = json.loads(request.body) # Gets The Data
                plan = data.get("plan") # Gets The Subscription Plan

                # Maps The Pricing Of The Subscription Plans
                price_ids = {
                    "basic": "price_1TsOhGQyU0Zy3VSn6pKcNAuz",
                    "premium": "price_1TsOhdQyU0Zy3VSnXZl2X1iO",
                }

                selected_price_id = price_ids.get(plan) # Gets The ID Of The Selected Subscription Plan

                if not selected_price_id:
                    return JsonResponse({
                        "success": False, 
                        "message": _("Zvolený neplatný plán predplatného.")
                    }, status=400)

                intent = stripe.checkout.Session.create(
                    payment_method_types=["card"],

                    line_items=[
                        {
                            "price": selected_price_id,
                            "quantity": 1,
                        },
                    ],

                    mode="subscription",
                    
                    success_url=request.build_absolute_uri(reverse("success_subscription_url")),
                    cancel_url=request.build_absolute_uri(reverse("homepage_url")),

                    metadata={
                        "plan": plan,
                        "user_id": logged_in_user_id
                    }
                )

                return JsonResponse({
                    "url": intent.url
                }, status=200)

            except Exception as e:
                captureError(f"An error occurred while processing the payment.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                return JsonResponse({
                    "success": False, 
                    "message": _("Pri spracovávaní platby došlo k chybe.")
                }, status=400)
                
        captureError(f"Payment can only be made using the POST method.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

        return JsonResponse({
            "success": False, 
            "message": _("Platba sa dá uskutočniť len pomocou POST metódy.")
        }, status=405)

    captureError(f"Subscription can only be made when user is logged in.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

    return JsonResponse({
        "success": False, 
        "message": _("Platbu nie je možné vykonať bez prihlásenia.")
    }, status=401)

@csrf_exempt
def stripeWebhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)

    except ValueError:
        return HttpResponse(status=400)

    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)

    # Donation
    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]

        stripe_id = payment_intent.id # Gets The Stripe ID
        metadata = payment_intent.metadata # Gets The Metadata
        user_id = metadata["user_id"] if "user_id" in metadata else None # Gets The User ID If Is Available

        try:
            payment = Transactions.objects.get(stripe_intent_id=stripe_id) # Gets The Transaction
            payment.status = "succeeded" # Updates The Payment Status

            if user_id:
                payment.user_id = int(user_id)

            payment.save() # Saves The Updated Transaction

        except Transactions.DoesNotExist:
            pass

    # Subscription
    if event["type"] == "checkout.session.completed":
        subscription_intent = event["data"]["object"]

        if subscription_intent.mode == "subscription":
            try:
                metadata = subscription_intent.metadata # Gets The Metadata
                stripe_subscription_id = subscription_intent.subscription # Gets The Stripe Subscription ID
                user_id = metadata["user_id"] # Gets The User ID
                user = Users.objects.get(id=int(user_id)) # Gets The User
                plan = metadata["plan"] # Gets The Plan (Basic / Premium)

                subscription, created = Subscription.objects.get_or_create(user=user) # Updates Or Creates The Subscription
                subscription.stripe_subscription_id = stripe_subscription_id
                subscription.plan = plan
                subscription.is_active = True
                subscription.is_cancelled = False
                subscription.save() # Saves The New Subscription

                # Creates The Transaction
                Transactions.objects.create(
                    user_id=int(user_id),
                    stripe_intent_id=stripe_subscription_id,
                    amount=subscription_intent.amount_total / 100,
                    status="succeeded",
                    title="Subscription"
                )
                
            except Exception as e:
                captureError(f"An error occurred while activating the subscription.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                return JsonResponse({
                    "success": False, 
                    "message": _("Pri aktivácii predplatného došlo k chybe.")
                }, status=500)

    # Subscription Cancellation
    if event["type"] == "customer.subscription.deleted":
        subscription_intent = event["data"]["object"]
        stripe_subscription_id = subscription_intent.id # Gets The Stripe Subscription ID

        try:
            subscription = Subscription.objects.get(stripe_subscription_id=stripe_subscription_id) # Gets The Subscription
            subscription.is_active = False
            subscription.plan = "free"
            subscription.save() # Saves The Updated Subscription

        except Subscription.DoesNotExist:
            pass

    return HttpResponse(status=200)

@require_POST
def reportReview(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            report_review_data = json.loads(request.body) # Gets The Report Review Data
            review_id = report_review_data["review_id"] # Gets The Review ID
            reason = report_review_data["reason"] # Gets The Reason
            review = Reviews.objects.get(id=review_id) # Gets The Review
            has_report = review.reports_from_users.filter(id=logged_in_user_id).exists() # Checks If The User Has Already Reported The Review

            # Stores The Reported Review
            ReviewReport.objects.update_or_create(
                review_id=review_id,
                user_id=logged_in_user_id,
                defaults={"reason": reason} # Reason Can Be Updated
            )

            # Report
            if not has_report:
                review.reports += 1 # Increases The Reports Counter

                if review.reports >= 5:
                    review = Reviews.objects.get(id=review.review_id) # Gets The Review
                    review.status = "hidden" # Hides The Review If Has More Than 10% Of Reports

                review.save() # Saves The Review

            return JsonResponse({
                "success": True, 
                "message": _("Nahlásenie bolo úspešne odoslané.")
            }, status=200)

        return JsonResponse({
            "success": False, 
            "message": _("Nahlásenie nie je možné odoslať bez prihlásenia.")
        }, status=401)

    except Exception as e:
        captureError(f"An error occurred while submitting the report.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return JsonResponse({
            "success": False, 
            "message": _("Pri odosielaní nahlásenia došlo k chybe.")
        }, status=500)

@require_POST
def deleteReview(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets Logged In User From The DB
            review_id = json.loads(request.body) # Gets The Review ID
            review = Reviews.objects.get(id=review_id) if logged_in_user.role == "developer" or logged_in_user.role == "admin" else Reviews.objects.get(id=review_id, user_id=logged_in_user_id) # Gets The Review

            if review:
                review.delete() # Deletes The Review

                return JsonResponse({
                    "success": True, 
                    "message": _("Recenzia bola úspešne odstránená.")
                }, status=200)

            return JsonResponse({
                "success": False, 
                "message": _("Recenziu sa nepodarilo odstrániť.")
            }, status=400)

        return JsonResponse({
            "success": False, 
            "message": _("Recenziu nie je možné odstrániť bez prihlásenia.")
        }, status=401)

    except Exception as e:
        captureError(f"An error occurred while deleting the review.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return JsonResponse({
            "success": False, 
            "message": _("Pri odstraňovaní recenzie došlo k chybe.")
        }, status=500)

@require_POST
def markPostAsSeen(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            post_id = json.loads(request.body) # Gets The Post ID

            # Marks The Post As Seen If Exists And Isn't Already Seen By The User
            SeenPost.objects.get_or_create(
                user_id=logged_in_user_id,
                post_id=post_id
            )

            return JsonResponse({
                "success": True, 
                "message": _('Príspevok bol úspešne označený za "už videný".')
            }, status=200)

        return JsonResponse({
            "success": False, 
            "message": _('Príspevok nie je možné označiť za "už videný" bez prihlásenia.')
        }, status=401)

    except Exception as e:
        captureError(f"An error occurred while marking the post as seen.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return JsonResponse({
            "success": False, 
            "message": _('Pri označovaní príspevku za "už videný" došlo k chybe.')
        }, status=500)

@require_POST
def toggleFollow(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets Logged In User From The DB

            user_to_follow_id = json.loads(request.body)
            user_to_follow = Users.objects.get(id=user_to_follow_id) # Gets User To Follow From The DB

            # Checks If The Logged In User Is Already Following The User
            follow_relation = FollowRelation.objects.filter(
                from_user=logged_in_user, 
                to_user=user_to_follow
            ).first()

            # Follow
            if not follow_relation:
                status = "pending" if user_to_follow.private_account else "accepted" # Defines The Status (Pending If The User's Account Is Private)

                # Creates The New Follow Relation Between 2 Users
                FollowRelation.objects.create(
                    from_user=logged_in_user,
                    to_user=user_to_follow,
                    status=status
                )

                message = _("Žiadosť o sledovanie bola odoslaná.") if status == "pending" else _("Sledovanie bolo úspešne pridané.")

                return JsonResponse({
                    "success": True, 
                    "message": message
                }, status=200)

            # Unfollow
            else:
                message = _("Žiadosť o sledovanie bola zrušená.") if follow_relation.status == "pending" else _("Sledovanie bolo úspešne odstránené.")

                follow_relation.delete() # Removes The Relation Between 2 Users

                return JsonResponse({
                    "success": True, 
                    "message": message
                }, status=200)

        return JsonResponse({
            "success": False, 
            "message": _("Sledovanie nie je možné zmeniť bez prihlásenia.")
        }, status=401)

    except Exception as e:
        captureError(f"An error occurred while changing the follow.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return JsonResponse({
            "success": False, 
            "message": _("Pri zmene sledovania došlo k chybe.")
        }, status=404)

@require_POST
def togglePostLike(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets Logged In User

            post_id = json.loads(request.body) # Gets The Post ID
            post = Post.objects.get(id=int(post_id)) # Gets The Post

            has_like = post.likes_from_users.filter(id=logged_in_user_id).exists() # Checks If The User Has Already Liked The Post

            # Like
            if not has_like:
                post.likes_from_users.add(logged_in_user) # Adds The User To Likes From Users In Post
                Post.objects.filter(id=int(post_id)).update(likes = F("likes") + 1) # Increases And Updates The Likes Counter

                return JsonResponse({
                    "success": True, 
                    "message": _("Označenie páči sa mi to bolo úspešne pridané.")
                }, status=200)

            # Cancel Like
            else:
                post.likes_from_users.remove(logged_in_user) # Removes The User From Likes From Users In Post
                Post.objects.filter(id=int(post_id)).update(likes = F("likes") - 1) # Decreases And Updates The Likes Counter
                
                return JsonResponse({
                    "success": True, 
                    "message": _("Označenie páči sa mi to bolo úspešne odstránené.")
                }, status=200)

        return JsonResponse({
            "success": False, 
            "message": _("Označenie páči sa mi to nie je možné zmeniť bez prihlásenia.")
        }, status=401)

    except Exception as e:
        captureError(f"An error occurred while changing a like.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return JsonResponse({
            "success": False, 
            "message": _("Pri zmene označenia páči sa mi to došlo k chybe.")
        }, status=500)

@require_POST
def reportPost(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            report_post_data = json.loads(request.body) # Gets The Report Post Data
            post_id = report_post_data["post_id"] # Gets The Post ID
            reason = report_post_data["reason"] # Gets The Reason
            post = Post.objects.get(id=post_id) # Gets The Post
            has_report = post.reports_from_users.filter(id=logged_in_user_id).exists() # Checks If The User Has Already Reported The Post

            # Stores The Reported Comment
            PostReport.objects.update_or_create(
                post_id=post_id,
                user_id=logged_in_user_id,
                defaults={"reason": reason} # Reason Can Be Updated
            )

            # Report
            if not has_report:
                post.reports += 1 # Increases The Reports Counter

                if post.reports >= 5:
                    if post.likes > 0:
                        report_percentage = (post.reports / post.likes) * 100 # Gets The Percentage Of The Post Reports Amount By Likes On The Post

                    else:
                        report_percentage = 100

                    if report_percentage > 10:
                        post.status = "hidden" # Hides The Post If Has More Than 10% Of Reports

                post.save() # Saves The Updated Post

            return JsonResponse({
                "success": True, 
                "message": _("Nahlásenie bolo úspešne odoslané.")
            }, status=200)

        return JsonResponse({
            "success": False, 
            "message": _("Nahlásenie nie je možné odoslať bez prihlásenia.")
        }, status=401)

    except Exception as e:
        captureError(f"An error occurred while submitting the report.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return JsonResponse({
            "success": False, 
            "message": _("Pri odosielaní nahlásenia došlo k chybe.")
        }, status=500)

@require_POST
def editPostSettings(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            edit_post_settings_data = json.loads(request.body) # Gets The Edit Post Settings Data
            post_id = edit_post_settings_data["post_id"] # Gets The Post ID From The Edit Post Settings Data
            setting = edit_post_settings_data["setting"] # Gets The Setting From The Edit Post Settings Data
            action = edit_post_settings_data["action"] # Gets The Action From The Edit Post Settings Data
            post = Post.objects.filter(id=post_id, user_id=logged_in_user_id).first() # Gets The Post

            if post:
                setattr(post, setting, action) # Updates The Given Column's Value
                post.save() # Saves The Edited Post

                return JsonResponse({
                    "success": True, 
                    "message": _("Príspevok bol úspešne upravený.")
                }, status=200)

            return JsonResponse({
                "success": False, 
                "message": _("Príspevok sa nepodarilo upraviť.")
            }, status=400)

        return JsonResponse({
            "success": False, 
            "message": _("Príspevok nie je možné upraviť bez prihlásenia.")
        }, status=401)

    except Exception as e:
        captureError(f"An error occurred while editing the post.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return JsonResponse({
            "success": False, 
            "message": _("Pri úprave príspevku došlo k chybe.")
        }, status=500)

@require_POST
def deletePost(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets Logged In User
            post_id = json.loads(request.body) # Gets The Post ID
            post = Post.objects.prefetch_related("media").get(id=post_id) if logged_in_user.role == "developer" or logged_in_user.role == "admin" else Post.objects.prefetch_related("media").get(id=post_id, user_id=logged_in_user_id) # Gets The Post

            if post:
                unfinished_media = post.media.filter(is_processed=False)

                for one_media in unfinished_media:
                    # Stops The Celery Task For Compression Of Media Of The Post
                    if hasattr(one_media, "celery_task_id") and one_media.celery_task_id:
                        current_app.control.revoke(one_media.celery_task_id, terminate=True)

                    # Video
                    if one_media.is_video:
                        video_temp_name = f"compressed_{one_media.id}.mp4"
                        video_temp_path = os.path.join(settings.MEDIA_ROOT, "temp", video_temp_name)

                        # Removes Temporary Video File From Disk
                        if os.path.exists(video_temp_path):
                            try:
                                os.remove(video_temp_path)
                            except OSError:
                                pass

                        thumb_temp_name = f"thumb_{one_media.id}.jpg"
                        thumb_temp_path = os.path.join(settings.MEDIA_ROOT, "temp", thumb_temp_name)

                        # Removes Temporary Thumbnail Image File From Disk
                        if os.path.exists(thumb_temp_path):
                            try:
                                os.remove(thumb_temp_path)
                            except OSError:
                                pass

                post.delete() # Deletes The Post

                return JsonResponse({
                    "success": True, 
                    "message": _("Príspevok bol úspešne odstránený.")
                }, status=200)

            return JsonResponse({
                "success": False, 
                "message": _("Príspevok sa nepodarilo odstrániť.")
            }, status=400)

        return JsonResponse({
            "success": False, 
            "message": _("Príspevok nie je možné odstrániť bez prihlásenia.")
        }, status=401)

    except Exception as e:
        captureError(f"An error occurred while deleting the post.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return JsonResponse({
            "success": False, 
            "message": _("Pri odstraňovaní príspevku došlo k chybe.")
        }, status=500)

@require_POST
def togglePostSave(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets Logged In User

            post_id = json.loads(request.body) # Gets The Post ID
            post = Post.objects.get(id=int(post_id)) # Gets The Post

            has_save = logged_in_user.saved_posts.filter(id=post_id).exists() # Checks If The User Has Already Saved The Post

            # Save
            if not has_save:
                logged_in_user.saved_posts.add(post) # Adds The Post To The User's Saved Posts
                logged_in_user.save() # Saves The Logged In User

                return JsonResponse({
                    "success": True, 
                    "message": _("Príspevok bol úspešne uložený.")
                }, status=200)

            # Unsave
            else:
                logged_in_user.saved_posts.remove(post) # Removes The Post From The User's Saved Posts
                logged_in_user.save() # Saves The Logged In User
                
                return JsonResponse({
                    "success": True, 
                    "message": _("Príspevok bol odstránený zo zoznamu uložených.")
                }, status=200)

        return JsonResponse({
            "success": False, 
            "message": _("Príspevok nie je možné uložiť bez prihlásenia.")
        }, status=401)

    except Exception as e:
        captureError(f"An error occurred while changing a save.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return JsonResponse({
            "success": False, 
            "message": _("Pri zmene uloženia príspevku došlo k chybe.")
        }, status=500)

@require_POST
def reportPostComment(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            report_comment_data = json.loads(request.body) # Gets The Report Comment Data
            comment_id = report_comment_data["postforum_id"] # Gets The Post Forum ID
            reason = report_comment_data["reason"] # Gets The Reason
            comment = PostForum.objects.get(id=comment_id) # Gets The Comment
            has_report = comment.reports_from_users.filter(id=logged_in_user_id).exists() # Checks If The User Has Already Reported The Comment

            # Stores The Reported Comment
            PostForumReport.objects.update_or_create(
                postforum_id=comment_id,
                user_id=logged_in_user_id,
                defaults={"reason": reason} # Reason Can Be Updated
            )

            # Report
            if not has_report:
                comment.reports += 1 # Increases The Reports Counter

                if comment.reports >= 5:
                    post = Post.objects.get(id=comment.post_id) # Gets The Post

                    if post.likes > 0:
                        report_percentage = (comment.reports / post.likes) * 100 # Gets The Percentage Of The Comment Reports Amount By Likes On The Post

                    else:
                        report_percentage = 100

                    if report_percentage > 10:
                        comment.status = "hidden" # Hides The Comment If Has More Than 10% Of Reports

                comment.save() # Saves The Comment

            return JsonResponse({
                "success": True, 
                "message": _("Nahlásenie bolo úspešne odoslané.")
            }, status=200)

        return JsonResponse({
            "success": False, 
            "message": _("Nahlásenie nie je možné odoslať bez prihlásenia.")
        }, status=401)

    except Exception as e:
        captureError(f"An error occurred while submitting the report.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return JsonResponse({
            "success": False, 
            "message": _("Pri odosielaní nahlásenia došlo k chybe.")
        }, status=500)

@require_POST
def deletePostComment(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets Logged In User
            comment_id = json.loads(request.body) # Gets The Comment ID
            comment = PostForum.objects.get(id=comment_id) if logged_in_user.role == "developer" or logged_in_user.role == "admin" else PostForum.objects.get(id=comment_id, user_id=logged_in_user_id) # Gets The Comment

            if comment:
                comment.delete() # Deletes The Comment

                return JsonResponse({
                    "success": True, 
                    "message": _("Komentár bol úspešne odstránený.")
                }, status=200)

            return JsonResponse({
                "success": False, 
                "message": _("Komentár sa nepodarilo odstrániť.")
            }, status=400)

        return JsonResponse({
            "success": False, 
            "message": _("Komentár nie je možné odstrániť bez prihlásenia.")
        }, status=401)

    except Exception as e:
        captureError(f"An error occurred while deleting the comment from the post.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return JsonResponse({
            "success": False, 
            "message": _("Pri odstraňovaní komentáru došlo k chybe.")
        }, status=500)

@require_POST
def addComment(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            comment_data = json.loads(request.body) # Gets The Comment Data

            new_comment = PostForum(
                post_id = comment_data["post_id"],
                user_id = logged_in_user_id,
                comment = comment_data["comment"],
                parent_id = comment_data["parent_id"]
            )

            new_comment.save()

            logged_in_user = {
                "logged_in_user_id": logged_in_user_id
            }

            # Creates Valid Format Of Comment For JSON Response
            comment = {
                "id": new_comment.id,

                "user": {
                    "id": new_comment.user.id,
                    "username": new_comment.user.username,
                    "profile_picture_name": new_comment.user.profile_picture_name
                },

                "creation_time": new_comment.creation_time,
                "level": new_comment.level
            }

            return JsonResponse({
                "success": True, 
                "logged_in_user": logged_in_user, 
                "comment": comment, 
                "message": _("Komentár pre príspevok bol úspešne pridaný.")
            }, status=201)

        return JsonResponse({
            "success": False, 
            "message": _("Komentár nie je možné pridať bez prihlásenia.")
        }, status=401)

    except ValidationError as e:
        # Returns The Error Message From Models
        return JsonResponse({
            "success": False, 
            "message": str(e.message)
        }, status=400)

    except Exception as e:
        captureError(f"An error occurred while adding a comment.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return JsonResponse({
            "success": False, 
            "message": _("Pri pridávaní komentáru došlo k chybe.")
        }, status=500)

@require_POST
def togglePostCommentLike(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets Logged In User

            comment_id = json.loads(request.body) # Gets The Comment ID
            comment = PostForum.objects.get(id=int(comment_id)) # Gets The Comment

            has_like = comment.likes_from_users.filter(id=logged_in_user_id).exists() # Checks If The User Has Already Liked The Comment

            # Like
            if not has_like:
                comment.likes_from_users.add(logged_in_user) # Adds The User To Likes From Users In Comment
                comment.likes = F("likes") + 1 # Increases The Likes Counter
                comment.save() # Updates The Comment

                return JsonResponse({
                    "success": True, 
                    "message": _("Označenie páči sa mi to bolo úspešne pridané.")
                }, status=200)

            # Cancel Like
            else:
                comment.likes_from_users.remove(logged_in_user) # Removes The User To Likes From Users In Comment
                comment.likes = F("likes") - 1 # Decreases The Likes Counter
                comment.save() # Updates The Comment
                
                return JsonResponse({
                    "success": True, 
                    "message": _("Označenie páči sa mi to bolo úspešne odstránené.")
                }, status=200)

        return JsonResponse({
            "success": False, 
            "message": _("Označenie páči sa mi to nie je možné zmeniť bez prihlásenia.")
        }, status=401)

    except Exception as e:
        captureError(f"An error occurred while changing a like.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return JsonResponse({
            "success": False, 
            "message": _("Pri zmene označenia páči sa mi to došlo k chybe.")
        }, status=500)

def homepageView(request):
    logged_in_user_id = None # Default State When The User Isn't Logged In
    logged_in_user = None # Default State When The User Isn't Logged In

    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id") # Gets The Logged In User ID
        logged_in_user = Users.objects.select_related("subscription").get(id=logged_in_user_id) # Gets The Logged In User

    # Login Form
    if request.method == "POST" and request.POST.get("login_form_submit"):
        usage = get_usage(request, key="ip", rate="3/m", method="POST", increment=True, group="homepage_login")
        
        if usage and usage["should_limit"]:
            messages.add_message(request, messages.ERROR, _("Príliš veľa pokusov!\nSkúste to opäť za minútu."))
            captureError(f"Too many login attempts.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")
            return HttpResponseRedirect(reverse("homepage_url"))

        login_form = loginForm(request.POST) # Gets The Login Form

        if login_form.is_valid():
            identifier = login_form.cleaned_data["identifier"] # Gets The Identifier Value
            password = login_form.cleaned_data["password"] # Gets The Password Value

            try:
                user = Users.objects.get(
                    Q(username__iexact=identifier) |
                    Q(email_address__iexact=identifier)
                )

                if check_password(password, user.password):
                    request.session["logged_in_user_id"] = user.id

                    user.last_login = timezone.now() # Stores Last Login Time
                    user.account_status = "OK"
                    user.save()

                    sendMail(
                        user,
                        _("Prihlásenie do účtu"), # Subject
                        _("bolo vykonané prihlásenie do Vášho účtu. Touto správou by sme Vás chceli informovať, v prípade, ak ste sa v tomto čase neprihlasovali, Vaše údaje môžu byť ohrozené. Odporúčame Vám okamžite zmeniť heslo alebo nás kontaktovať. Záleží nám na bezpečnosti Vašich údajov.\n\n%(domain)s%(language)s/profil/%(username)s?password-reset=true\n\nAk ste sa prihlásili Vy, tento e-mail prosím ignorujte.\nTím Wesiq.") % {"domain": settings.DOMAIN_URL, "language": user.language, "username": user.username}, # Text Content
                        _('bolo vykonané prihlásenie do Vášho účtu. Touto správou by sme Vás chceli informovať, v prípade, ak ste sa v tomto čase neprihlasovali, Vaše údaje môžu byť ohrozené. Odporúčame Vám okamžite zmeniť heslo kliknutím na <a href="%(domain)s%(language)s/profil/%(username)s?password-reset=true" title="Obnoviť heslo" target="_blank">tento</a> odkaz alebo nás kontaktovať. Záleží nám na bezpečnosti Vašich údajov.') % {"domain": settings.DOMAIN_URL, "language": user.language, "username": user.username}, # HTML Content
                        _('Ak ste sa prihlásili Vy, tento e-mail prosím ignorujte.'), # End Of HTML Content
                        _("Zariadenie: %(os)s<br>Miesto: %(location)s<br>IP Adresa: %(client_ip)s" % {"os": request.user_agent.os.family, "location": getClientLocation(getClientIp(request)), "client_ip": getClientIp(request)})
                    )

                    messages.add_message(request, messages.SUCCESS, _("Úspešne prihlásený ako %(username)s") % {"username": user.username})
                    captureLogin(f"Successful Login to the Account\n\t- User ID: {user.id},\n\t- E-mail Address: {identifier},\n\t- IP Address: {getClientIp(request)}\n")

                    return HttpResponseRedirect(reverse("homepage_url"))

                # Wrong Password
                else: 
                    messages.add_message(request, messages.ERROR, _("Nesprávne prihlasovacie údaje"))
                    captureError(f"Incorrect login credentials (wrong password).\n\t- URL: {request.build_absolute_uri()}\n\t- Identifier: {identifier},\n\t- IP Address: {getClientIp(request)}\n")

            # Wrong Identifier
            except Users.DoesNotExist as e: 
                messages.add_message(request, messages.ERROR, _("Nesprávne prihlasovacie údaje"))
                captureError(f"Incorrect login credentials (unregistered username or e-mail address).\n\t- URL: {request.build_absolute_uri()}\n\t- Identifier: {identifier},\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

            # Error
            except Exception as e:
                messages.add_message(request, messages.ERROR, _("Pri prihlasovaní došlo k chybe"))
                captureError(f"An error occurred while logging in.\n\t- URL: {request.build_absolute_uri()}\n\t- Identifier: {identifier},\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        # Wrong Form
        else:
            messages.add_message(request, messages.ERROR, _("Nepodarilo sa spracovať požiadavku o prihlásenie"))
            captureError(f"Failed to process login request.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

    if request.GET.get("verification-code") and request.GET.get("id"):
        if Users.objects.filter(Q(id=request.GET.get("id")) & Q(verification_code=request.GET.get("verification-code"))).exclude(verification_code__isnull=True).exists():
            user = Users.objects.get(Q(id=request.GET.get("id")) & Q(verification_code=request.GET.get("verification-code")))
            
            request.session["logged_in_user_id"] = user.id # Sets User ID Session For New Registered User For Login or Switch Account

            user.verification_code = None
            user.account_status = "OK"
            user.last_login = timezone.now() # Stores Last Login Time
            user.save()

            sendMail(
                user,
                _("Úspešná registrácia"), # Subject
                _("máme pre Vás skvelú správu! Vaša e-mailová adresa bola úspešne overená a Váš účet je odteraz plne aktívny.\n\n%(domain)s%(language)s/profil/\n\nSme radi, že ste sa pridali k našej komunite. Teraz môžete naplno využívať všetky funkcie našich služieb.\nTím Wesiq.") % {"domain": settings.DOMAIN_URL, "language": user.language}, # Text Content
                _('máme pre Vás skvelú správu! Vaša e-mailová adresa bola úspešne overená a Váš účet je odteraz plne aktívny. Kliknite na <a href="%(domain)s%(language)s/profil/" title="Môj účet" target="_blank">tento</a> odkaz pre zobrazenie Vášho úštu.') % {"domain": settings.DOMAIN_URL, "language": user.language}, # HTML Content
                _('Sme radi, že ste sa pridali k našej komunite. Teraz môžete naplno využívať všetky funkcie našich služieb.') # End Of HTML Content
            )

            messages.add_message(request, messages.SUCCESS, _("Úspešne prihlásený ako\n%(first_name)s %(last_name)s") % {"first_name": user.first_name, "last_name": user.last_name})
            captureLogin(f"Successful Login to the Account\n\t- User ID: {user.id},\n\t- E-mail Address: {user.email_address},\n\t- IP Address: {getClientIp(request)}\n")

        return HttpResponseRedirect(reverse("homepage_url"))

    if request.GET.get("password-reset"):
        email_address = request.COOKIES.get("email_address")

        if Users.objects.filter(email_address=email_address).exists():
            user = Users.objects.get(email_address=email_address)

            code = generateCode() # Generates Random 6-Digit Code

            sendMail(
                user,
                _("Obnova hesla"), # Subject
                _("dostali sme žiadosť o obnovenie hesla k vášmu účtu. Ak ste to boli vy, prosím použite nasledujúci odkaz a zadajte nasledovný overovací kód.\n\n%(domain)s%(language)s/obnova-hesla?password-reset-code=%(code)s - %(code)s\n\nAk ste o obnovu hesla nežiadali, tento e-mail prosím ignorujte.\nTím Wesiq.") % {"domain": settings.DOMAIN_URL, "language": user.language, "code": code}, # Text Content
                _('dostali sme žiadosť o obnovenie hesla k vášmu účtu. Ak ste to boli vy, prosím použite <a href="%(domain)s%(language)s/obnova-hesla?password-reset-code=%(code)s" title="Obnoviť heslo" target="_blank">tento</a> odkaz a zadajte nasledovný overovací kód.') % {"domain": settings.DOMAIN_URL, "language": user.language, "code": code}, # HTML Content
                _('Ak ste o obnovu hesla nežiadali, tento e-mail prosím ignorujte.'), # End Of HTML Content
                code
            )

            # Saves Password Reset Code To Database
            user.password_reset_code = code
            user.save()

            messages.add_message(request, messages.SUCCESS, _("Overovací kód bol odoslaný na adresu\n%(email_address)s") % {"email_address": email_address})

            # Redirect After Sending Mail
            response = HttpResponseRedirect(reverse("password_reset_url"))
            # response["Location"] += f"?password-reset-code={code}" # Add Parameter With Code To URL
            return response

        else:
            return redirect(request.path)
    
    # Registration Form
    if request.method == "POST" and request.POST.get("registration_form_submit"):
        # Loads Data From reCaptcha In Registration Page
        recaptcha_response = request.POST.get("g-recaptcha-response")
        recaptcha_data = {
            "secret": settings.RECAPTCHA_SECRET_KEY,
            "response": recaptcha_response
        }

        # Loads reCaptcha API
        recaptcha_api = requests.post('https://www.google.com/recaptcha/api/siteverify', data=recaptcha_data).json()

        # Checks Validity Of reCaptcha Response
        if not recaptcha_api.get("success") or recaptcha_api.get("score", 0) < 0.1:
            messages.add_message(request, messages.ERROR, _("Overenie reCaptcha zlyhalo"))
            captureError(f"Verification by reCAPTCHA failed.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

        else:
            registration_form = registrationForm(request.POST) # Gets The Registration Form

            if registration_form.is_valid():
                try:
                    if Users.objects.filter(email_address=registration_form.cleaned_data["email_address"]).exists():
                        messages.add_message(request, messages.ERROR, _("Tento e-mail už je zaregistrovaný"))
                        captureError(f"This e-mail is already registered.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

                    elif registration_form.cleaned_data["password"] != registration_form.cleaned_data["password_check"]:
                        messages.add_message(request, messages.ERROR, _("Heslá sa nezhodujú"))

                    elif len(registration_form.cleaned_data["password"]) < 8:
                        messages.add_message(request, messages.ERROR, _("Heslo je príliš krátke"))

                    else:
                        username = "@" + registration_form.cleaned_data["username"].lstrip("@") # Formats The Username (Adds The At Sign At The Beginning)
                        phone_number = "".join(registration_form.cleaned_data["phone_number"].split()) # Gets Phone Number With No White Spaces
                        verification_code = generateCode() # Generates Random 6-Digit Code
                        friend_code = generateCode(letters=True) # Generates Random 6-Digit Code With Numbers And Letters

                        new_user = Users(
                            first_name = registration_form.cleaned_data["first_name"],
                            last_name = registration_form.cleaned_data["last_name"],
                            username = username,
                            email_address = registration_form.cleaned_data["email_address"],
                            phone_number = phone_number,
                            password = make_password(registration_form.cleaned_data["password"]),
                            language = request.POST.get("language"),
                            verification_code = verification_code,
                            friend_code = friend_code
                        )

                        new_user.save()

                        # Deletes Previous User ID Session If Was Logged In
                        if logged_in_user:
                            del request.session["logged_in_user_id"]

                        messages.add_message(request, messages.SUCCESS, _("Potvrdte vašu e-mailovú adresu\n%(email_address)s") % {"email_address": registration_form.cleaned_data["email_address"]})

                        sendMail(
                            new_user,
                            _("Overenie účtu"), # Subject
                            _("ďakujeme za Vašu registráciu. Pre dokončenie procesu registrácie a aktiváciu Vášho účtu je potrebné overiť Vašu e-mailovú adresu. Kliknutím na nižšie uvedený odkaz potvrdíte svoj e-mail a budete automaticky prihlásený do svojho nového účtu.\n\n%(domain)s%(language)s?verification-code=%(verification_code)s&id=%(id)s\n\nTento odkaz je platný nasledujúcich 24 hodín. Po uplynutí tohto času bude z bezpečnostných dôvodov potrebné registráciu zopakovať. Ak ste registráciu nevykonali Vy, tento e-mail prosím ignorujte.\nTím Wesiq.") % {"domain": settings.DOMAIN_URL, "language": request.POST.get("language"), "verification_code": verification_code, "id": new_user.id}, # Text Content
                            _('ďakujeme za Vašu registráciu. Pre dokončenie procesu registrácie a aktiváciu Vášho účtu je potrebné overiť Vašu e-mailovú adresu. Kliknutím na <a href="%(domain)s%(language)s?verification-code=%(verification_code)s&id=%(id)s" title="Dokončiť registráciu" target="_blank">tento</a> odkaz potvrdíte svoj e-mail a budete automaticky prihlásený do svojho nového účtu. Tento odkaz je platný nasledujúcich 24 hodín. Po uplynutí tohto času bude z bezpečnostných dôvodov potrebné registráciu zopakovať.') % {"domain": settings.DOMAIN_URL, "language": request.POST.get("language"), "verification_code": verification_code, "id": new_user.id}, # HTML Content
                            _("Ak ste registráciu nevykonali Vy, tento e-mail prosím ignorujte."), # End Of HTML Content
                        )

                        return HttpResponseRedirect(reverse("registration_url"))

                # Error
                except Exception as e:
                    messages.add_message(request, messages.ERROR, _("Pri registrácii došlo k chybe"))
                    captureError(f"An error occurred during registration.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

            # Wrong Form
            else:
                messages.add_message(request, messages.ERROR, _("Nepodarilo sa spracovať požiadavku o registráciu"))
                captureError(f"Failed to process registration request.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

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
        if not recaptcha_api.get("success") or recaptcha_api.get("score", 0) < 0.1:
            messages.add_message(request, messages.ERROR, _("Overenie reCaptcha zlyhalo"))
            captureError(f"Verification by reCAPTCHA failed.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

        else:
            contact_form = contactForm(request.POST, request.FILES) # Gets The Contact Form

            if contact_form.is_valid():
                try:
                    subject_text = _("Otázka")
                    
                    if contact_form.cleaned_data["subject"] == "question":
                        subject_text = _("Otázka")

                    elif contact_form.cleaned_data["subject"] == "account_issue":
                        subject_text = _("Problém s účtom")

                    elif contact_form.cleaned_data["subject"] == "bug":
                        subject_text = _("Nahlásenie chyby")

                    elif contact_form.cleaned_data["subject"] == "suggestion":
                        subject_text = _("Návrh na zlepšenie")

                    # Send Mail
                    subject = f"Wesiq - {subject_text}"
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

                            mail_message.send()

                            messages.add_message(request, messages.SUCCESS, _("Správa bola odoslaná"))

                        else:
                            messages.add_message(request, messages.ERROR, _("Príloha je príliš veľká"))
                            captureError(f"The attachment is too large.\n\t- URL: {request.build_absolute_uri()}\n\t- Attachment Size: {attachment_file.size},\n\t- User ID: {logged_in_user_id},\n\t- IP Address: {getClientIp(request)}\n")

                    else: # Sends Mail Without An Attachment
                        mail_message.send()

                        messages.add_message(request, messages.SUCCESS, _("Správa bola odoslaná"))

                # Error
                except Exception as e:
                    messages.add_message(request, messages.ERROR, _("Pri odosielaní správy došlo k chybe"))
                    captureError(f"An error occurred while sending the message.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")
            
            # Wrong Form
            else:
                messages.add_message(request, messages.ERROR, _("Správu sa nepodarilo odoslať"))
                captureError(f"The message could not be sent.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

        return HttpResponseRedirect(reverse("homepage_url"))
            
    # Get All Reviews From DB
    reviews = cache.get("cached_reviews") # Gets All Cached Reviews
    # reviews = Reviews.objects.all() # Queryset

    # Reviews Fallback (If Cache Is Clear)
    if reviews is None:
        reviews = list(Reviews.objects.filter(status="approved").order_by("-creation_time")) # Gets All Approved Reviews
        cache.set("cached_reviews", reviews, timeout=settings.CACHE_TTL) # Caches Reviews
        print("Getting Reviews Data From The DB.") # Test Print

    else:
        print("Getting Reviews Data From The Redis Cache.") # Test Print

    page_number = request.GET.get("reviews-page", 1) # Gets The Current Page Number
    paginator = Paginator(reviews, 2) if logged_in_user and logged_in_user.data_saving_mode else Paginator(reviews, 5) # Divides The Reviews By Maximum 5 Per Page (2 When The Logged In User Has Data Saving Mode Enabled)
    page_reviews = paginator.get_page(page_number) # Gets Only The Reviews For The Selected Page

    # Info About Reviews
    total_reviews = len(reviews) # Redis List
    # total_reviews = reviews.count() # Queryset
    found_reviews = total_reviews

    ratings = [one_review.rating for one_review in reviews]

    if ratings:
        avg_value = sum(ratings) / len(ratings)
    
    else:
        avg_value = 0

    avg_rating = {"rating__avg": avg_value} # Redis List
    # avg_rating = reviews.aggregate(Avg("rating")) # Queryset
    avg_rating_integer = math.floor(float(avg_rating["rating__avg"])) # For Example From Average Rating Of 4.25 It Returns 4
    avg_rating_rest = f"{float(avg_rating['rating__avg']) - avg_rating_integer:.2f}"[2:] # For Example From Average Rating Of 4.25 It Returns 25 And From 4.00 It Returns 00

    # Redis List
    reviews_amount_by_stars = {
        "5": len([one_review for one_review in reviews if one_review.rating == 5]), # Number Of Reviews With 5 Star Rating
        "4": len([one_review for one_review in reviews if one_review.rating == 4]), # Number Of Reviews With 4 Star Rating
        "3": len([one_review for one_review in reviews if one_review.rating == 3]), # Number Of Reviews With 3 Star Rating
        "2": len([one_review for one_review in reviews if one_review.rating == 2]), # Number Of Reviews With 2 Star Rating
        "1": len([one_review for one_review in reviews if one_review.rating == 1]), # Number Of Reviews With 1 Star Rating
    }

    # Queryset
    # reviews_amount_by_stars = {
    #     "5": len(reviews.filter(rating=5)), # Number Of Reviews With 5 Star Rating
    #     "4": len(reviews.filter(rating=4)), # Number Of Reviews With 4 Star Rating
    #     "3": len(reviews.filter(rating=3)), # Number Of Reviews With 3 Star Rating
    #     "2": len(reviews.filter(rating=2)), # Number Of Reviews With 2 Star Rating
    #     "1": len(reviews.filter(rating=1)), # Number Of Reviews With 1 Star Rating
    # }

    # Sorts Reviews By User Preferencies (The Latest Articles Are Set As Default)
    sort = request.GET.get("sort", "latest").lower()
    rating = request.GET.get("rating", "all")

    if sort == "latest":
        if rating == "all":
            # Redis List
            reviews = sorted(
                reviews, 
                key=lambda one_review: one_review.creation_time,
                reverse=True
            )

            # reviews = reviews.order_by("-creation_time") # Queryset

        else:
            # Redis List
            reviews = sorted(
                [one_review for one_review in reviews if one_review.rating == int(rating)], 
                key=lambda one_review: one_review.creation_time, 
                reverse=True
            )

            found_reviews = len(reviews) # Updates The Amount Of Found Reviews

            # reviews = reviews.filter(rating=int(rating)).order_by("-creation_time") # Queryset

    if sort == "oldest":
        if rating == "all":
            # Redis List
            reviews = sorted(
                reviews, 
                key=lambda one_review: one_review.creation_time
            )

            # reviews = reviews.order_by("creation_time") # Queryset

        else:
            # Redis List
            reviews = sorted(
                [one_review for one_review in reviews if one_review.rating == int(rating)], 
                key=lambda one_review: one_review.creation_time, 
            )

            found_reviews = len(reviews) # Updates The Amount Of Found Reviews

            # reviews = reviews.filter(rating=int(rating)).order_by("creation_time") # Queryset

    if sort == "best":
        if rating == "all":
            # Redis List
            reviews = sorted(
                reviews, 
                key=lambda one_review: one_review.rating,
                reverse=True
            )

            # reviews = reviews.order_by("-rating") # Queryset

        else:
            # Redis List
            reviews = sorted(
                [one_review for one_review in reviews if one_review.rating == int(rating)], 
                key=lambda one_review: one_review.rating, 
                reverse=True
            )

            found_reviews = len(reviews) # Updates The Amount Of Found Reviews

            # reviews = reviews.filter(rating=int(rating)).order_by("-rating") # Queryset

    if sort == "worst":
        if rating == "all":
            # Redis List
            reviews = sorted(
                reviews, 
                key=lambda one_review: one_review.rating
            )

            # reviews = reviews.order_by("rating") # Queryset

        else:
            # Redis List
            reviews = sorted(
                [one_review for one_review in reviews if one_review.rating == int(rating)], 
                key=lambda one_review: one_review.rating
            )

            found_reviews = len(reviews) # Updates The Amount Of Found Reviews

            # reviews = reviews.filter(rating=int(rating)).order_by("rating") # Queryset

    # Resets The Reviews Paginator
    paginator = Paginator(reviews, 2) if logged_in_user and logged_in_user.data_saving_mode else Paginator(reviews, 5) # Divides The Reviews By Maximum 5 Per Page (2 When The Logged In User Has Data Saving Mode Enabled)
    page_reviews = paginator.get_page(page_number) # Gets Only The Reviews For The Selected Page

    # Load Reviews
    if request.headers.get("X-Requested-Action") == "load-reviews":
        print(reviews[2].creation_time)
        reviews_html = render_to_string("partials/reviews.html", {"reviews": page_reviews.object_list, "role": logged_in_user.role}, request=request) # Generates HTML For Reviews
        
        return JsonResponse({
            "success": True,
            "has_next": page_reviews.has_next(),
            "reviews_html": reviews_html,
            "message": _("Recenzie boli úspešné nájdené.")
        }, status=200)

    # Report Review
    if request.headers.get("X-Requested-Action") == "report-review":
        return reportReview(request)

    # Delete Review
    if request.headers.get("X-Requested-Action") == "delete-review":
        return deleteReview(request)

    # Checks If User Is Logged In
    if logged_in_user:
        my_review = Reviews.objects.filter(user_id=logged_in_user_id).first() # Gets Logged In User's Review If Has Already Written Any
        pending_reviews = Reviews.objects.filter(status="pending") if logged_in_user.role == "developer" or logged_in_user.role == "admin" else None # Gets The Pending Reviews If The Logged In User Is Developer Or Admin

        if request.method == "POST":
            # Write Review Form
            if request.POST.get("write_review_form_submit"):
                # Loads Data From reCaptcha In Registration Page
                recaptcha_response = request.POST.get("g-recaptcha-response")
                recaptcha_data = {
                    "secret": settings.RECAPTCHA_SECRET_KEY,
                    "response": recaptcha_response
                }

                # Loads reCaptcha API
                recaptcha_api = requests.post('https://www.google.com/recaptcha/api/siteverify', data=recaptcha_data).json()

                # Checks Validity Of reCaptcha Response
                if not recaptcha_api.get("success") or recaptcha_api.get("score", 0) < 0.1:
                    messages.add_message(request, messages.ERROR, _("Overenie reCaptcha zlyhalo"))
                    captureError(f"Verification by reCAPTCHA failed.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

                    return HttpResponseRedirect(reverse("homepage_url"))
                
                else:
                    review_form = reviewForm(request.POST) # Gets The Review Form

                    if review_form.is_valid():
                        try:
                            # Checks If User Has Already Written A Review
                            if Reviews.objects.filter(user_id=logged_in_user_id).exists():
                                messages.add_message(request, messages.ERROR, _("Skúste upraviť aktuálne hodnotenie"))

                                return HttpResponseRedirect(reverse("edit_review_url"))

                            # Saves New Review To DB
                            else:
                                if int(review_form.cleaned_data["rating"]) == 0:
                                    messages.add_message(request, messages.ERROR, _("Ukážte nám vašu spokojnosť"))

                                else:
                                    new_review = Reviews(
                                        user_id = logged_in_user_id,
                                        rating = int(review_form.cleaned_data["rating"]),
                                        review = review_form.cleaned_data["review"],
                                    )

                                    new_review.save()

                                    messages.add_message(request, messages.SUCCESS, _("Ďakujeme za vaše hodnotenie"))

                        # Error
                        except Exception as e:
                            messages.add_message(request, messages.ERROR, _("Pri spracovaní hodnotenia došlo k chybe"))
                            captureError(f"An error occurred while processing the review.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")
                    
                    # Wrong Form
                    else:
                        messages.add_message(request, messages.ERROR, _("Hodnotenie sa nepodarilo uverejniť"))
                        captureError(f"Review could not be published.\n\t- URL: {request.build_absolute_uri()}\n\t- User ID: {logged_in_user_id},\n\t- IP Address: {getClientIp(request)}\n")

                return HttpResponseRedirect(reverse("homepage_url"))

            # Cancel Subscription Form
            if request.POST.get("cancel_subscription_submit"):
                subscription = getattr(logged_in_user, "subscription", None) # Gets The Current Subscription
                
                if subscription and subscription.stripe_subscription_id:
                    try:
                        # Cancels Subscription Billing At The End Of The Billing Period
                        stripe.Subscription.modify(
                            subscription.stripe_subscription_id,
                            cancel_at_period_end=True
                        )

                        # Updates The Subscription
                        subscription = Subscription.objects.filter(
                            stripe_subscription_id=subscription.stripe_subscription_id
                        ).update(
                            is_cancelled=True
                        )
                        
                        messages.add_message(request, messages.SUCCESS, _("Predplatné bude ukončené po skončení"))
                    
                    except Exception as e:
                        messages.add_message(request, messages.ERROR, _("Predplatné sa nepodarilo zrušiť"))
                        captureError(f"The subscription could not be cancelled.\n\t- URL: {request.build_absolute_uri()}\n\t- User ID: {logged_in_user_id},\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")
                else:
                    messages.add_message(request, messages.ERROR, _("Nenašlo sa žiadne aktívne predplatné"))

            # Approve Review
            if request.headers.get("X-Requested-Action") == "approve-review":
                try:
                    review_id = json.loads(request.body) # Gets The Review ID
                    review = Reviews.objects.get(id=review_id) # Gets The Review

                    if logged_in_user.role == "developer" or logged_in_user.role == "admin":
                        review.status = "approved" # Sets The Review Status As Approved
                        review.save() # Saves The Updated Review

                        return JsonResponse({
                            "success": True, 
                            "message": _("Recenzia bola úspešne schválená správcom.")
                        }, status=200)

                    return JsonResponse({
                        "success": False, 
                        "message": _("Recenziu môže schváliť len správca.")
                    }, status=401)

                except Exception as e:
                    captureError(f"An error occurred while approving the review.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                    return JsonResponse({
                        "success": False, 
                        "message": _("Pri pokuse o schválenie recenzie došlo k chybe.")
                    }, status=500)

            # Reject Review
            if request.headers.get("X-Requested-Action") == "reject-review":
                try:
                    review_id = json.loads(request.body) # Gets The Review ID
                    review = Reviews.objects.get(id=review_id) # Gets The Review

                    if logged_in_user.role == "developer" or logged_in_user.role == "admin":
                        review.status = "denied" # Sets The Review Status As Denied
                        review.rejection_time = timezone.now() # Updates The Rejection Time
                        review.save() # Saves The Updated Review

                        return JsonResponse({
                            "success": True, 
                            "message": _("Recenzia bola zamietnutá správcom.")
                        }, status=200)

                    return JsonResponse({
                        "success": False, 
                        "message": _("Recenziu môže zamietnuť len správca.")
                    }, status=401)

                except Exception as e:
                    captureError(f"An error occurred while rejecting the review.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                    return JsonResponse({
                        "success": False, 
                        "message": _("Pri pokuse o zamietnutie recenzie došlo k chybe.")
                    }, status=500)

        # Automatically Set Values Into Contact Form When User Is Logged In
        filled_contact_form = contactForm(initial={
            "first_name": logged_in_user.first_name,
            "last_name": logged_in_user.last_name,
            "email_address": logged_in_user.email_address,
        })

        subscription = None

        if hasattr(logged_in_user, "subscription") and logged_in_user.subscription:
            # Gets The Subscription Data If Are Available
            subscription = {
                "plan": logged_in_user.subscription.plan,
                "is_active": logged_in_user.subscription.is_active,
                "is_cancelled": logged_in_user.subscription.is_cancelled,
                "created_at": logged_in_user.subscription.created_at,
                "updated_at": logged_in_user.subscription.updated_at,
                "remaining_time": logged_in_user.subscription.remaining_time
            }

        # Renders Homepage With Filled Contact Form, User Data And Reviews
        return render(request, "app/homepage.html", {
            "logged_in_user": {
                "username": logged_in_user.username,
                "role": logged_in_user.role,
                "profile_picture_name": logged_in_user.profile_picture_name,
                "subscription": subscription
            },

            "login_form": loginForm,
            "registration_form": registrationForm,
            "contact_form": filled_contact_form,
            "review_form": reviewForm,
            "page_reviews": page_reviews,
            "pending_reviews": pending_reviews,
            "total_reviews": total_reviews,
            "found_reviews": found_reviews,
            "avg_rating": avg_rating,
            "avg_rating_integer": avg_rating_integer,
            "avg_rating_rest": avg_rating_rest,
            "reviews_amount_by_stars": reviews_amount_by_stars,
            "my_review": my_review,
            "publishable_key": settings.STRIPE_PUBLISHABLE_KEY
        })
    
    else:
        # Write Review Form
        if request.method == "POST" and request.POST.get("write_review_form_submit"):
            messages.add_message(request, messages.ERROR, _("Pred napísaním hodnotenia sa prihláste"))

            return HttpResponseRedirect(reverse("login_url"))

    # Renders Homepage With Reviews
    return render(request, "app/homepage.html", {
        "login_form": loginForm,
        "registration_form": registrationForm,
        "contact_form": contactForm,
        "review_form": reviewForm,
        "page_reviews": page_reviews,
        "total_reviews": total_reviews,
        "found_reviews": found_reviews,
        "avg_rating": avg_rating,
        "avg_rating_integer": avg_rating_integer,
        "avg_rating_rest": avg_rating_rest,
        "reviews_amount_by_stars": reviews_amount_by_stars,
        "publishable_key": settings.STRIPE_PUBLISHABLE_KEY
    })

@ratelimit(key="ip", rate="3/m", method="POST", block=False)
def loginView(request):
    was_limited = getattr(request, "limited", False)

    if request.method == "POST":
        if was_limited:
            messages.add_message(request, messages.ERROR, _("Príliš veľa pokusov!\nSkúste to opäť za minútu."))
            captureError(f"Too many login attempts.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")
            return HttpResponseRedirect(reverse("login_url"))

        login_form = loginForm(request.POST) # Gets The Login Form

        if login_form.is_valid():
            identifier = login_form.cleaned_data["identifier"] # Gets The Identifier Value
            password = login_form.cleaned_data["password"] # Gets The Password Value

            try:
                user = Users.objects.get(
                    Q(username__iexact=identifier) |
                    Q(email_address__iexact=identifier)
                )

                if check_password(password, user.password):
                    request.session["logged_in_user_id"] = user.id

                    user.last_login = timezone.now() # Stores Last Login Time
                    user.account_status = "OK"
                    user.save()

                    sendMail(
                        user,
                        _("Prihlásenie do účtu"), # Subject
                        _("bolo vykonané prihlásenie do Vášho účtu. Touto správou by sme Vás chceli informovať, v prípade, ak ste sa v tomto čase neprihlasovali, Vaše údaje môžu byť ohrozené. Odporúčame Vám okamžite zmeniť heslo alebo nás kontaktovať. Záleží nám na bezpečnosti Vašich údajov.\n\n%(domain)s%(language)s/profil/%(username)s?password-reset=true\n\nAk ste sa prihlásili Vy, tento e-mail prosím ignorujte.\nTím Wesiq.") % {"domain": settings.DOMAIN_URL, "language": user.language, "username": user.username}, # Text Content
                        _('bolo vykonané prihlásenie do Vášho účtu. Touto správou by sme Vás chceli informovať, v prípade, ak ste sa v tomto čase neprihlasovali, Vaše údaje môžu byť ohrozené. Odporúčame Vám okamžite zmeniť heslo kliknutím na <a href="%(domain)s%(language)s/profil/%(username)s?password-reset=true" title="Obnoviť heslo" target="_blank">tento</a> odkaz alebo nás kontaktovať. Záleží nám na bezpečnosti Vašich údajov.') % {"domain": settings.DOMAIN_URL, "language": user.language, "username": user.username}, # HTML Content
                        _('Ak ste sa prihlásili Vy, tento e-mail prosím ignorujte.'), # End Of HTML Content
                        _("Zariadenie: %(os)s<br>Miesto: %(location)s<br>IP Adresa: %(client_ip)s" % {"os": request.user_agent.os.family, "location": getClientLocation(getClientIp(request)), "client_ip": getClientIp(request)})
                    )

                    messages.add_message(request, messages.SUCCESS, _("Úspešne prihlásený ako %(username)s") % {"username": user.username})
                    captureLogin(f"Successful Login to the Account\n\t- User ID: {user.id},\n\t- E-mail Address: {identifier},\n\t- IP Address: {getClientIp(request)}\n")

                    return HttpResponseRedirect(reverse("homepage_url"))
                
                else: # Wrong Password
                    messages.add_message(request, messages.ERROR, _("Nesprávne prihlasovacie údaje"))
                    captureError(f"Incorrect login credentials (wrong password).\n\t- URL: {request.build_absolute_uri()}\n\t- Identifier: {identifier},\n\t- IP Address: {getClientIp(request)}\n")
            
            # Wrong Identifier
            except Users.DoesNotExist as e:
                messages.add_message(request, messages.ERROR, _("Nesprávne prihlasovacie údaje"))
                captureError(f"Incorrect login credentials (unregistered username or e-mail address).\n\t- URL: {request.build_absolute_uri()}\n\t- Identifier: {identifier},\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

            # Error
            except Exception as e:
                messages.add_message(request, messages.ERROR, _("Pri prihlasovaní došlo k chybe"))
                captureError(f"An error occurred while logging in.\n\t- URL: {request.build_absolute_uri()}\n\t- Identifier: {identifier},\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        # Wrong Form
        else:
            messages.add_message(request, messages.ERROR, _("Nepodarilo sa spracovať požiadavku o prihlásenie"))
            captureError(f"Failed to process login request.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

    if request.GET.get("password-reset"):
        email_address = request.COOKIES.get("email_address")
        
        if Users.objects.filter(email_address=email_address).exists():
            user = Users.objects.get(email_address=email_address)

            code = generateCode() # Generates Random 6-Digit Code

            sendMail(
                user,
                _("Obnova hesla"), # Subject
                _("dostali sme žiadosť o obnovenie hesla k vášmu účtu. Ak ste to boli vy, prosím použite nasledujúci odkaz a zadajte nasledovný overovací kód.\n\n%(domain)s%(language)s/obnova-hesla?password-reset-code=%(code)s - %(code)s\n\nAk ste o obnovu hesla nežiadali, tento e-mail prosím ignorujte.\nTím Wesiq.") % {"domain": settings.DOMAIN_URL, "language": user.language, "code": code}, # Text Content
                _('dostali sme žiadosť o obnovenie hesla k vášmu účtu. Ak ste to boli vy, prosím použite <a href="%(domain)s%(language)s/obnova-hesla?password-reset-code=%(code)s" title="Obnoviť heslo" target="_blank">tento</a> odkaz a zadajte nasledovný overovací kód.') % {"domain": settings.DOMAIN_URL, "language": user.language, "code": code}, # HTML Content
                _('Ak ste o obnovu hesla nežiadali, tento e-mail prosím ignorujte.'), # End Of HTML Content
                code
            )

            # Saves Password Reset Code To Database
            user.password_reset_code = code
            user.save()

            messages.add_message(request, messages.SUCCESS, _("Overovací kód bol odoslaný na adresu\n%(email_address)s") % {"email_address": email_address})

            # Redirect After Sending Mail
            response = HttpResponseRedirect(reverse("password_reset_url"))
            # response["Location"] += f"?password-reset-code={code}" # Add Parameter With Code To URL
            return response

        else:
            return redirect(request.path)

    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id") # Get Logged In User ID From Session
        logged_in_user = Users.objects.get(id=logged_in_user_id) # Get Logged In User From DB

        return render(request, "app/login.html", {
            "logged_in_user": {
                "username": logged_in_user.username,
                "profile_picture_name": logged_in_user.profile_picture_name
            },

            "login_form": loginForm
        })

    return render(request, "app/login.html", {
        "login_form": loginForm
    })

def passwordResetView(request):
    if request.COOKIES.get("email_address"):
        if request.method == "POST":
            password_reset_form = passwordResetForm(request.POST) # Gets The Password Reset Form
            password_reset_code = request.POST.get("password_reset_code") # Gets The Password Reset Code

            if password_reset_form.is_valid(): 
                new_password = password_reset_form.cleaned_data["new_password"]
                
                try:
                    user = Users.objects.get(email_address=request.COOKIES.get("email_address"))

                    if password_reset_code == user.password_reset_code:
                        if len(new_password) < 8:
                            messages.add_message(request, messages.ERROR, _("Heslo je príliš krátke"))

                        else:
                            # Saves New Password To Database And Deletes Password Reset Code From Database
                            user.password = make_password(new_password)
                            user.password_reset_code = None
                            user.save()

                            messages.add_message(request, messages.SUCCESS, _("Heslo bolo úspešne zmenené"))

                            # Redirect After Changing Password
                            response = HttpResponseRedirect(reverse("login_url"))
                            response.delete_cookie("email_address") # Deletes Cookie With Email Address
                            return response
                    
                    else:
                        messages.add_message(request, messages.ERROR, _("Overovací kód sa nezhoduje"))
                        captureError(f"Verification code does not match.\n\t- URL: {request.build_absolute_uri()}\n\t- User ID: {user.id},\n\t- IP Address: {getClientIp(request)}\n")

                # Error
                except Exception as e:
                    messages.add_message(request, messages.ERROR, _("Pri spracovaní žiadosti o zmenu hesla došlo k chybe"))
                    captureError(f"An error occurred while processing the password reset request.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")
            
            # Wrong Form
            else:
                messages.add_message(request, messages.ERROR, _("Overenie zlyhalo"))
                captureError(f"Verification failed.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

        if request.GET.get("password-reset"):
            email_address = request.COOKIES.get("email_address")
            
            if Users.objects.filter(email_address=email_address).exists():
                user = Users.objects.get(email_address=email_address)

                code = generateCode() # Generates Random 6-Digit Code

                sendMail(
                    user,
                    _("Obnova hesla"), # Subject
                    _("dostali sme žiadosť o obnovenie hesla k vášmu účtu. Ak ste to boli vy, prosím použite nasledujúci odkaz a zadajte nasledovný overovací kód.\n\n%(domain)s%(language)s/obnova-hesla?password-reset-code=%(code)s - %(code)s\n\nAk ste o obnovu hesla nežiadali, tento e-mail prosím ignorujte.\nTím Wesiq.") % {"domain": settings.DOMAIN_URL, "language": user.language, "code": code}, # Text Content
                    _('dostali sme žiadosť o obnovenie hesla k vášmu účtu. Ak ste to boli vy, prosím použite <a href="%(domain)s%(language)s/obnova-hesla?password-reset-code=%(code)s" title="Obnoviť heslo" target="_blank">tento</a> odkaz a zadajte nasledovný overovací kód.') % {"domain": settings.DOMAIN_URL, "language": user.language, "code": code}, # HTML Content
                    _('Ak ste o obnovu hesla nežiadali, tento e-mail prosím ignorujte.'), # End Of HTML Content
                    code
                )

                # Saves Password Reset Code To Database
                user.password_reset_code = code
                user.save()

                messages.add_message(request, messages.SUCCESS, _("Overovací kód bol odoslaný na adresu\n%(email_address)s") % {"email_address": email_address})

                # Redirect After Sending Mail
                response = HttpResponseRedirect(reverse("password_reset_url"))
                # response["Location"] += f"?password-reset-code={code}" # Add Parameter With Code To URL
                return response

            else:
                return redirect(request.path)

        # Gets Password Reset Code From URL Parameters If User Opened Attached Link In Mail
        if request.method == "GET" and request.GET.get("password-reset-code"):
            if "logged_in_user_id" in request.session:
                logged_in_user_id = request.session.get("logged_in_user_id") # Get Logged In User ID From Session
                logged_in_user = Users.objects.get(id=logged_in_user_id) # Get Logged In User From DB

                return render(request, "app/password_reset.html", {
                    "logged_in_user": {
                        "username": logged_in_user.username,
                        "profile_picture_name": logged_in_user.profile_picture_name
                    },

                    "password_reset_form": passwordResetForm,
                    "password_reset_code": request.GET.get("password-reset-code")
                })

            return render(request, "app/password_reset.html", {
                "password_reset_form": passwordResetForm,
                "password_reset_code": request.GET.get("password-reset-code"),
            })

    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id") # Get Logged In User ID From Session
        logged_in_user = Users.objects.get(id=logged_in_user_id) # Get Logged In User From DB

        return render(request, "app/password_reset.html", {
            "logged_in_user": {
                "username": logged_in_user.username,
                "profile_picture_name": logged_in_user.profile_picture_name
            },

            "password_reset_form": passwordResetForm
        })

    return render(request, "app/password_reset.html", {
        "password_reset_form": passwordResetForm,
    })

def logoutView(request):
    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id") # Get Logged In User ID From Session
        user = Users.objects.get(id=logged_in_user_id) # Get Logged In User From DB

        captureLogin(f"Logout From the Account\n\t- User ID: {user.id},\n\t- E-mail Address: {user.email_address},\n\t- IP Address: {getClientIp(request)}\n")
        logout(request)
        messages.add_message(request, messages.ERROR, _("Boli ste odhlásený"))

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
        if not recaptcha_api.get("success") or recaptcha_api.get("score", 0) < 0.1:
            messages.add_message(request, messages.ERROR, _("Overenie reCaptcha zlyhalo"))
            captureError(f"Verification by reCAPTCHA failed.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

            return HttpResponseRedirect(reverse("registration_url"))

        else:
            registration_form = registrationForm(request.POST) # Gets The Registration Form

            if registration_form.is_valid():
                try:
                    if Users.objects.filter(email_address=registration_form.cleaned_data["email_address"]).exists():
                        messages.add_message(request, messages.ERROR, _("Tento e-mail už je zaregistrovaný"))
                        captureError(f"This e-mail is already registered.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

                    elif registration_form.cleaned_data["password"] != registration_form.cleaned_data["password_check"]:
                        messages.add_message(request, messages.ERROR, _("Heslá sa nezhodujú"))

                    elif len(registration_form.cleaned_data["password"]) < 8:
                        messages.add_message(request, messages.ERROR, _("Heslo je príliš krátke"))

                    else:
                        verification_code = generateCode() # Generates Random 6-Digit Code
                        friend_code = generateCode(letters=True) # Generates Random 6-Digit Code With Numbers And Letters

                        phone_number = "".join(registration_form.cleaned_data["phone_number"].split()) # Gets Phone Number With No White Spaces

                        new_user = Users(
                            first_name = registration_form.cleaned_data["first_name"],
                            last_name = registration_form.cleaned_data["last_name"],
                            username = registration_form.cleaned_data["username"],
                            email_address = registration_form.cleaned_data["email_address"],
                            phone_number = phone_number,
                            password = make_password(registration_form.cleaned_data["password"]),
                            language = request.POST.get("language"),
                            verification_code = verification_code,
                            friend_code = friend_code
                        )

                        new_user.save()

                        # Deletes Previous User ID Session If Was Logged In
                        if "logged_in_user_id" in request.session:
                            del request.session["logged_in_user_id"]

                        messages.add_message(request, messages.SUCCESS, _("Potvrdte vašu e-mailovú adresu\n%(email_address)s") % {"email_address": registration_form.cleaned_data["email_address"]})

                        sendMail(
                            new_user,
                            _("Overenie účtu"), # Subject
                            _("ďakujeme za Vašu registráciu. Pre dokončenie procesu registrácie a aktiváciu Vášho účtu je potrebné overiť Vašu e-mailovú adresu. Kliknutím na nižšie uvedený odkaz potvrdíte svoj e-mail a budete automaticky prihlásený do svojho nového účtu.\n\n%(domain)s%(language)s?verification-code=%(verification_code)s&id=%(id)s\n\nTento odkaz je platný nasledujúcich 24 hodín. Po uplynutí tohto času bude z bezpečnostných dôvodov potrebné registráciu zopakovať. Ak ste registráciu nevykonali Vy, tento e-mail prosím ignorujte.\nTím Wesiq.") % {"domain": settings.DOMAIN_URL, "language": request.POST.get("language"), "verification_code": verification_code, "id": new_user.id}, # Text Content
                            _('ďakujeme za Vašu registráciu. Pre dokončenie procesu registrácie a aktiváciu Vášho účtu je potrebné overiť Vašu e-mailovú adresu. Kliknutím na <a href="%(domain)s%(language)s?verification-code=%(verification_code)s&id=%(id)s" title="Dokončiť registráciu" target="_blank">tento</a> odkaz potvrdíte svoj e-mail a budete automaticky prihlásený do svojho nového účtu. Tento odkaz je platný nasledujúcich 24 hodín. Po uplynutí tohto času bude z bezpečnostných dôvodov potrebné registráciu zopakovať.') % {"domain": settings.DOMAIN_URL, "language": request.POST.get("language"), "verification_code": verification_code, "id": new_user.id}, # HTML Content
                            _("Ak ste registráciu nevykonali Vy, tento e-mail prosím ignorujte."), # End Of HTML Content
                        )

                        return HttpResponseRedirect(reverse("registration_url"))

                # Error
                except Exception as e:
                    messages.add_message(request, messages.ERROR, _("Pri registrácii došlo k chybe"))
                    captureError(f"An error occurred during registration.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

            # Wrong Form
            else:
                messages.add_message(request, messages.ERROR, _("Nepodarilo sa spracovať požiadavku o registráciu"))
                captureError(f"Failed to process registration request.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

            return HttpResponseRedirect(reverse("registration_url"))

    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id") # Get Logged In User ID From Session
        logged_in_user = Users.objects.get(id=logged_in_user_id) # Get Logged In User From DB

        return render(request, "app/registration.html", {
            "logged_in_user": {
                "username": logged_in_user.username,
                "profile_picture_name": logged_in_user.profile_picture_name
            },

            "registration_form": registrationForm
        })

    return render(request, "app/registration.html", {
        "registration_form": registrationForm
    })
    
def editReviewView(request):
    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id")

        review = Reviews.objects.get(user_id=logged_in_user_id)

        if request.method == "POST":
            if review.last_edit == None or timezone.now() - review.last_edit >= timedelta(days=30):
                review_form = reviewForm(request.POST) # Gets The Review Form

                if review_form.is_valid():
                    try:
                        if review.rating != int(review_form.cleaned_data["rating"]):
                            review.rating = int(review_form.cleaned_data["rating"])
                            review.last_edit = timezone.now()

                        if review.review != review_form.cleaned_data["review"]:
                            review.review = review_form.cleaned_data["review"]
                            review.last_edit = timezone.now()

                        review.save() # Saves The Review
                        
                        messages.add_message(request, messages.SUCCESS, _("Zmeny boli uložené"))

                        return HttpResponseRedirect(reverse("homepage_url"))

                    # Error
                    except Exception as e:
                        messages.add_message(request, messages.ERROR, _("Pri úprave hodnotenia došlo k chybe"))
                        captureError(f"An error occurred while editing the review.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")
                
                # Wrong Form
                else:
                    messages.add_message(request, messages.ERROR, _("Zmeny sa nepodarilo vykonať"))
                    captureError(f"Changes could not be made while editing review.\n\t- URL: {request.build_absolute_uri()}\n\t- User ID: {logged_in_user_id},\n\t- IP Address: {getClientIp(request)}\n")

                return HttpResponseRedirect(reverse("edit_review_url"))
            
            else:
                messages.add_message(request, messages.ERROR, _("Ďalšie úpravy budú možné %(next_edit_time)s") % {"next_edit_time": (review.last_edit + timedelta(days=30)).strftime('%d.%m. %Y')})
        
        filled_review_form = reviewForm(initial={
            "rating": review.rating,
            "review": review.review
        })

        logged_in_user = Users.objects.get(id=logged_in_user_id) # Get Logged In User From DB

        return render(request, "app/edit_review.html", {
            "logged_in_user": {
                "username": logged_in_user.username,
                "profile_picture_name": logged_in_user.profile_picture_name
            },
            
            "review_form": filled_review_form,
            "review": review
        })
    
    return render(request, "app/edit_review.html")

def blogView(request):
    # Gets All Articles From DB
    articles = cache.get("cached_articles") # Gets All Cached Reviews
    # articles = Articles.objects.all() # Queryset

    # Articles Fallback (If Cache Is Clear)
    if articles is None:
        # Gets All Articles
        articles = list(
            Articles.objects.all().annotate(
                average_rating=Avg("articlerating__rating"),
            )
        )

        cache.set("cached_articles", articles, timeout=settings.CACHE_TTL) # Caches Articles

        print("Getting Articles Data From The DB.") # Test Print

    else:
        print("Getting Articles Data From The Redis Cache.") # Test Print

    no_articles = True # Default Value That Says That There Are No Articles In The Database

    # Sorts Articles By User Preferencies (The Latest Articles Are Set As Default)
    sort = request.GET.get("sort", "latest").lower()
    category = request.GET.get("category", "all").lower()

    if sort == "latest":
        if category == "all":
            # Redis List
            articles = sorted(
                articles, 
                key=lambda one_article: one_article.creation_time,
                reverse=True
            )

            # articles.order_by("-creation_time") # Queryset

        else:
            # Redis List
            filtered_articles = [
                one_article for one_article in articles 
                if category in one_article.categories
            ]

            articles = sorted(
                filtered_articles,
                key=lambda one_article: one_article.creation_time,
                reverse=True
            )

            # articles = articles.filter(categories__contains=[category]).order_by("-creation_time") # Queryset

    if sort == "popular":
        if category == "all":
            # Redis List
            articles = sorted(
                articles, 
                key=lambda one_article: one_article.visitors,
                reverse=True
            )

            # articles = articles.order_by("-visitors") # Queryset

        else:
            # Redis List
            filtered_articles = [
                one_article for one_article in articles 
                if category in one_article.categories
            ]

            articles = sorted(
                filtered_articles,
                key=lambda one_article: one_article.visitors,
                reverse=True
            )

            # articles = articles.filter(categories__contains=[category]).order_by("-visitors") # Queryset

    elif sort == "best":
        if category == "all":
            # Redis List
            articles = sorted(
                articles, 
                key=lambda one_article: one_article.rating,
                reverse=True
            )

            # articles = articles.order_by("-rating") # Queryset

        else:
            # Redis List
            filtered_articles = [
                one_article for one_article in articles 
                if category in one_article.categories
            ]

            articles = sorted(
                filtered_articles,
                key=lambda one_article: one_article.rating,
                reverse=True
            )

            # articles = articles.filter(categories__contains=[category]).order_by("-rating") # Queryset

    elif sort == "a-z":
        if category == "all":
            # Redis List
            articles = sorted(
                articles, 
                key=lambda one_article: one_article.title
            )

            # articles = articles.order_by("title") # Queryset
        
        else:
            # Redis List
            filtered_articles = [
                one_article for one_article in articles 
                if category in one_article.categories
            ]

            articles = sorted(
                filtered_articles,
                key=lambda one_article: one_article.title
            )

            # articles = articles.filter(categories__contains=[category]).order_by("title") # Queryset

    elif sort == "z-a":
        if category == "all":
            # Redis List
            articles = sorted(
                articles, 
                key=lambda one_article: one_article.title,
                reverse=True
            )

            # articles = articles.order_by("-title") # Queryset
        
        else:
            # Redis List
            filtered_articles = [
                one_article for one_article in articles 
                if category in one_article.categories
            ]

            articles = sorted(
                filtered_articles,
                key=lambda one_article: one_article.title,
                reverse=True
            )

            # articles = articles.filter(categories__contains=[category]).order_by("-title") # Queryset

    # Number Of All Articles
    num_articles = len(articles) # Redis List
    # num_articles = articles.count() # Queryset

    # Checks If There Are Any Articles In The Database
    # if(articles.exists()): # Queryset
    if articles is not None and len(articles) > 0:
        no_articles = False

    # Checks If User Is Logged In
    if "logged_in_user_id" in request.session:
        # Get Logged In User ID From Session
        logged_in_user_id = request.session.get("logged_in_user_id")

        # Get Logged In User From DB
        logged_in_user = Users.objects.get(id=logged_in_user_id)

        # Renders Blog Page With User Data And Articles
        return render(request, "app/blog.html", {
            "logged_in_user": {
                "username": logged_in_user.username,
                "profile_picture_name": logged_in_user.profile_picture_name
            },

            "articles": articles,
            "no_articles": no_articles,
            "num_articles": num_articles
        })

    # Renders Page With Articles Data
    return render(request, "app/blog.html", {
        "articles": articles,
        "num_articles": num_articles,
    })

def blogThemeView(request, theme):
    if request.method == "POST":
        # Add Article Rating
        if request.headers.get("X-Requested-Action") == "add-article-rating":
            try:
                if "logged_in_user_id" in request.session:
                    logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
                    article_rating_data = json.loads(request.body) # Gets The Article Rating Data
                    article_id = article_rating_data["article_id"] # Gets The Article ID
                    rating = article_rating_data["rating"] # Gets The Rating
                    comment = Articles.objects.get(id=article_id) # Gets The Article

                    # Stores The Added Article Rating
                    ArticleRating.objects.update_or_create(
                        article_id=article_id,
                        user_id=logged_in_user_id,
                        defaults={"rating": rating} # Rating Can Be Updated
                    )

                    return JsonResponse({
                        "success": True, 
                        "message": _("Hodnotenie bolo úspešne odoslané.")
                    }, status=200)

                return JsonResponse({
                    "success": False, 
                    "message": _("Hodnotenie nie je možné odoslať bez prihlásenia.")
                }, status=401)

            except Exception as e:
                captureError(f"An error occurred while adding the rating.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                return JsonResponse({
                    "success": False, 
                    "message": _("Pri pridávaní hodnotenia došlo k chybe.")
                }, status=500)

        # Report Article Comment
        if request.headers.get("X-Requested-Action") == "report-article-comment":
            try:
                if "logged_in_user_id" in request.session:
                    logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
                    report_comment_data = json.loads(request.body) # Gets The Report Comment Data
                    comment_id = report_comment_data["articleforum_id"] # Gets The Article Forum ID
                    reason = report_comment_data["reason"] # Gets The Reason
                    comment = ArticleForum.objects.get(id=comment_id) # Gets The Comment
                    has_report = comment.reports_from_users.filter(id=logged_in_user_id).exists() # Checks If The User Has Already Reported The Comment

                    # Stores The Reported Comment
                    ArticleForumReport.objects.update_or_create(
                        articleforum_id=comment_id,
                        user_id=logged_in_user_id,
                        defaults={"reason": reason} # Reason Can Be Updated
                    )

                    # Report
                    if not has_report:
                        comment.reports += 1 # Increases The Reports Counter

                        if comment.reports >= 5:
                            article = Articles.objects.get(id=comment.article_id) # Gets The Article

                            if article.likes > 0:
                                report_percentage = (comment.reports / article.likes) * 100 # Gets The Percentage Of The Comment Reports Amount By Likes On The Article

                            else:
                                report_percentage = 100

                            if report_percentage > 10:
                                comment.status = "hidden" # Hides The Comment If Has More Than 10% Of Reports

                        comment.save() # Saves The Comment

                    return JsonResponse({
                        "success": True, 
                        "message": _("Nahlásenie bolo úspešne odoslané.")
                    }, status=200)

                return JsonResponse({
                    "success": False, 
                    "message": _("Nahlásenie nie je možné odoslať bez prihlásenia.")
                }, status=401)

            except Exception as e:
                captureError(f"An error occurred while submitting the report.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                return JsonResponse({
                    "success": False, 
                    "message": _("Pri odosielaní nahlásenia došlo k chybe.")
                }, status=500)

        # Add Article Comment
        if request.headers.get("X-Requested-Action") == "add-article-comment":
            try:
                if "logged_in_user_id" in request.session:
                    logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
                    comment_data = json.loads(request.body) # Gets The Comment Data

                    new_comment = ArticleForum(
                        article_id = comment_data["article_id"],
                        user_id = logged_in_user_id,
                        comment = comment_data["comment"],
                        parent_id = comment_data["parent_id"]
                    )

                    new_comment.save()

                    logged_in_user = {
                        "logged_in_user_id": logged_in_user_id
                    }

                    # Creates Valid Format Of Comment For JSON Response
                    comment = {
                        "id": new_comment.id,

                        "user": {
                            "id": new_comment.user.id,
                            "username": new_comment.user.username,
                            "profile_picture_name": new_comment.user.profile_picture_name
                        },

                        "creation_time": new_comment.creation_time,
                        "level": new_comment.level
                    }

                    return JsonResponse({
                        "success": True, 
                        "logged_in_user": logged_in_user, 
                        "comment": comment, 
                        "message": _("Komentár pre článok bol úspešne pridaný.")
                    }, status=201)

                return JsonResponse({
                    "success": False, 
                    "message": _("Komentár nie je možné pridať bez prihlásenia.")
                }, status=401)

            except ValidationError as e:
                # Returns The Error Message From Models
                return JsonResponse({
                    "success": False, 
                    "message": str(e.message)
                }, status=400)

            except Exception as e:
                captureError(f"An error occurred while adding a comment.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                return JsonResponse({
                    "success": False, 
                    "message": _("Pri pridávaní komentáru došlo k chybe.")
                }, status=500)

        # Toggle Article Comment Like
        if request.headers.get("X-Requested-Action") == "toggle-article-comment-like":
            try:
                if "logged_in_user_id" in request.session:
                    logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
                    logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets Logged In User

                    comment_id = json.loads(request.body) # Gets The Comment ID
                    comment = ArticleForum.objects.get(id=int(comment_id)) # Gets The Comment

                    has_like = comment.likes_from_users.filter(id=logged_in_user_id).exists() # Checks If The User Has Already Liked The Comment

                    # Like
                    if not has_like:
                        comment.likes_from_users.add(logged_in_user) # Adds The User To Likes From Users In Comment
                        comment.likes = F("likes") + 1 # Increases The Likes Counter
                        comment.save() # Updates The Comment

                        return JsonResponse({
                            "success": True, 
                            "message": _("Označenie páči sa mi to bolo úspešne pridané.")
                        }, status=200)

                    # Cancel Like
                    else:
                        comment.likes_from_users.remove(logged_in_user) # Removes The User To Likes From Users In Comment
                        comment.likes = F("likes") - 1 # Decreases The Likes Counter
                        comment.save() # Updates The Comment
                        
                        return JsonResponse({
                            "success": True, 
                            "message": _("Označenie páči sa mi to bolo úspešne odstránené.")
                        }, status=200)

                return JsonResponse({
                    "success": False, 
                    "message": _("Označenie páči sa mi to nie je možné zmeniť bez prihlásenia.")
                }, status=401)

            except Exception as e:
                captureError(f"An error occurred while changing a like.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                return JsonResponse({
                    "success": False, 
                    "message": _("Pri zmene označenia páči sa mi to došlo k chybe.")
                }, status=500)

    logged_in_user_id = None # Default State When The User Isn't Logged In
    logged_in_user = None # Default State When The User Isn't Logged In

    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id") # Gets The Logged In User ID
        logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets The Logged In User

        if request.method == "POST":
            # Delete Article Comment
            if request.headers.get("X-Requested-Action") == "delete-article-comment":
                try:
                    if "logged_in_user_id" in request.session:
                        logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
                        logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets Logged In User
                        comment_id = json.loads(request.body) # Gets The Comment ID
                        comment = ArticleForum.objects.get(id=comment_id) if logged_in_user.role == "developer" or logged_in_user.role == "admin" else ArticleForum.objects.get(id=comment_id, user_id=logged_in_user_id) # Gets The Comment

                        if comment:
                            comment.delete() # Deletes The Comment

                            return JsonResponse({
                                "success": True, 
                                "message": _("Komentár bol úspešne odstránený.")
                            }, status=200)

                        return JsonResponse({
                            "success": False, 
                            "message": _("Komentár sa nepodarilo odstrániť.")
                        }, status=400)

                    return JsonResponse({
                        "success": False, 
                        "message": _("Komentár nie je možné odstrániť bez prihlásenia.")
                    }, status=401)

                except Exception as e:
                    captureError(f"An error occurred while deleting the comment from the post.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                    return JsonResponse({
                        "success": False, 
                        "message": _("Pri odstraňovaní komentáru došlo k chybe.")
                    }, status=500)

    not_found = True

    # Gets The Article By URL Address With All Related Data
    article = Articles.objects.filter(
        link=theme
    ).annotate(
        average_rating=Avg("articlerating__rating"),

        # Creates The Given Article Rating Column Of Logged In User
        given_rating=Subquery(
            ArticleRating.objects.filter(
                article_id=OuterRef("pk"),
                user_id=logged_in_user_id
            ).values("rating")[:1]
        )
    ).prefetch_related(
        Prefetch(
            "comments",
            queryset=ArticleForum.objects.exclude(
                status="hidden"
            ).annotate(
                # Creates The Has Like Column (True If The User Has Already Liked The Comment)
                has_like=Exists(
                    ArticleForum.likes_from_users.through.objects.filter(
                        articleforum_id=OuterRef("pk"),
                        users_id=logged_in_user_id
                    )
                )
            ).annotate(
                # Creates The Has Report Column (True If The User Has Already Reported The Comment)
                has_report=Exists(
                    ArticleForum.reports_from_users.through.objects.filter(
                        articleforum_id=OuterRef("pk"),
                        user_id=logged_in_user_id
                    )
                )
            ).select_related(
                "user"
            ).order_by(
                "-creation_time"
            ),
            to_attr="visible_comments"
        )
    ).first()

    if article != None:
        not_found = False

        # Splits Comments Into Parent And Child Comments
        comments_by_parent = defaultdict(list)
        
        for one_comment in article.visible_comments:
            comments_by_parent[one_comment.parent_id].append(one_comment)
        
        article.nested_comments = dict(comments_by_parent)
        article.root_comments = comments_by_parent[None]

    # Adds 1 Visitor to The Article's Unique Visitors
    if not request.COOKIES.get(article.link):
        article.visitors += 1
        article.save()

    if logged_in_user:
        response = render(request, "app/articles.html", {
            "logged_in_user": {
                "id": logged_in_user.id,
                "username": logged_in_user.username,
                "role": logged_in_user.role,
                "profile_picture_name": logged_in_user.profile_picture_name
            },

            "article": article,
            "write_comment_form": writeCommentForm,
            "not_found": not_found,
        })

    else:
        response = render(request, "app/articles.html", {
            "article": article,
            "write_comment_form": writeCommentForm,
            "not_found": not_found,
        })

    response.set_cookie(article.link, "visited", expires=timezone.now() + timedelta(days=365)) # Sets 1 Year Timed Cookie About Information That The User Has Already Visited The Article

    return response
    
def writeArticleView(request):
    logged_in_user_id = request.session.get("logged_in_user_id")

    if request.method == "POST":
        write_article_form = writeArticleForm(request.POST, request.FILES) # Gets The Write Article Form
        
        if write_article_form.is_valid():
            try:
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

            # Error
            except Exception as e:
                messages.add_message(request, messages.ERROR, _("Pri pridávaní článku došlo k chybe"))
                captureError(f"An error occurred while adding the article.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")
        
        # Wrong Form
        else:
            messages.add_message(request, messages.ERROR, _("Pridávanie článku zlyhalo"))
            captureError(f"Adding article failed.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

    return render(request, "app/write_article.html", {
        "write_article_form": writeArticleForm
    })

def trainingSessionView(request):
    # Gets Logged In User
    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
        logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets Logged In User

        activities = Activity.objects.filter(user_id=logged_in_user_id) # Gets All Logged In User's Activities
        latest_activity = activities.latest("end_time") if activities else "" # Gets The Latest Logged In User's Activity
        longest_activity = activities.order_by("-elapsed_time").first() # Gets The Longest Logged In User's Activity

        # Gets Last 7 Days Average Logged In User's Activity Time
        average_activity_elapsed_time = Activity.objects.filter(
            user_id=logged_in_user_id,
            end_time__gte=timezone.now() - timedelta(days=6)
        ).aggregate(avg=Avg("elapsed_time"))["avg"]

        average_activity_time = math.floor(average_activity_elapsed_time) if average_activity_elapsed_time is not None else 0

        average_activity_time_formatted = f"{(math.floor(average_activity_time / 3600)) % 60}h {(math.floor(average_activity_time / 60)) % 60}m" if activities else "" # Formats Average Activity Time
        activities_amount = Activity.objects.filter(Q(user_id=logged_in_user_id) & Q(end_time__gte=timezone.now() - timedelta(days=6))).count() # Counts Amount Of Last 7 Days Logged In User's Activities

        today = timezone.now().date() # Determines Today's Date
        seven_days_ago = today - timedelta(days=6) # Determines Seven Days Ago Date

        # Gets Activities From Today's Date To Previous 7th Day And Counts Activity Elapsed Times For Each Date
        weekly_activity = (
            Activity.objects
            .filter(
                Q(user_id=logged_in_user_id) & Q(end_time__date__gte=seven_days_ago) & Q(end_time__date__lte=today)
            )
            .annotate(day=TruncDate("end_time"))
            .values("day")
            .annotate(total_elapsed_time=Sum("elapsed_time"))
        )

        # Creates Dictionary From Weekly Activity
        weekly_activity_dictionary = {
            one_day["day"]: one_day["total_elapsed_time"]
            for one_day in weekly_activity
        }

        weekday_labels = ["PO", "UT", "ST", "ŠT", "PI", "SO", "NE"] # Weekday Labels For Each Day

        weekly_activity_result = [] # Gets Final Results Of Weekly Activity Days And Elapsed Time For Each Day (For Example: [{'day': 'ŠT', 'total_elapsed_time': 2872}, {'day': 'PI', 'total_elapsed_time': 1451}, {'day': 'SO', 'total_elapsed_time': 825}, {'day': 'NE', 'total_elapsed_time': 639}, {'day': 'PO', 'total_elapsed_time': 2104}, {'day': 'UT', 'total_elapsed_time': 2555}, {'day': 'ST', 'total_elapsed_time': 3000}])

        # Fills And Sorts Result From The Oldest Date To Today's Date 
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            label = weekday_labels[day.weekday()]

            weekly_activity_result.append({
                "day": label,
                "total_elapsed_time": weekly_activity_dictionary.get(day, 0)
            })

        day_index = ((datetime.today().weekday()) + 1) % 7 # Gets Current Day Index (Sunday - 0, Monday - 1, Tuesday - 2, Wednesday - 3, Thursday - 4, Friday - 5, Saturday - 6)

        # Gets Logged In User's Training Plans Sorted By Weekdays From Current Day
        training_plan = (
            TrainingPlan.objects
            .filter(user_id=logged_in_user_id)
            .annotate(
                sorted_days=ExpressionWrapper(
                    Mod(F("day") - Value(day_index) + Value(7), Value(7)),
                    output_field=IntegerField()
                )
            )
            .order_by("sorted_days")
        )

        todays_date = timezone.localdate() # Gets The Today's Date

        # Deletes The Older User's Official Tasks Than Today's Date
        UserDailyOfficialTasks.objects.filter(
            user=logged_in_user,
            created_at__date__lt=todays_date
        ).delete()

        # Gets The All Assigned User's Official Tasks For Today
        official_tasks = logged_in_user.daily_official_tasks.annotate(
            progress_percentage=F("userdailyofficialtasks__progress_percentage"),
            is_completed=F("userdailyofficialtasks__is_completed")
        )

        official_tasks_amount = official_tasks.count() # Gets The Amount Of All Assigned User's Official Tasks For Today

        # Gets Assigned User's Official Tasks For Today If The User Has Less Than 3 Of Them Already Assigned
        if official_tasks_amount < 3:
            needed_tasks = 3 - official_tasks_amount # Gets The Amount Of Still Needed Tasks
            existing_tasks_ids = official_tasks.values_list("id", flat=True) # Gets The Already Assigned User's Official Tasks For Today IDs
        
            # Gets The Random New User's Official Tasks For Today Which Aren't Already Assigned For The User
            random_new_tasks = OfficialTasks.objects.exclude(
                id__in=existing_tasks_ids
            ).order_by(
                "?"
            )[:needed_tasks]
            
            # Bulk Creation Of Multiple New User's Official Tasks For Today
            new_official_tasks = [
                UserDailyOfficialTasks(user=logged_in_user, task=one_task)
                for one_task in random_new_tasks
            ]

            UserDailyOfficialTasks.objects.bulk_create(new_official_tasks)

            # Updates The Official Tasks
            official_tasks = logged_in_user.daily_official_tasks.annotate(
                progress_percentage=F("userdailyofficialtasks__progress_percentage"),
                is_completed=F("userdailyofficialtasks__is_completed")
            )

        current_time = timezone.localtime(timezone.now())
        next_midnight = (current_time + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        official_tasks_remaining_time = next_midnight - current_time
        official_tasks_remaining_hours = official_tasks_remaining_time.seconds // 3600

        custom_tasks = CustomTasks.objects.filter(
            user_id=logged_in_user_id
        ).order_by(
            "order"
        )

        two_weeks_ago = timezone.now() - timedelta(days=14) # Gets The 2 Weeks Ago Time
        activity_history = Activity.objects.filter(end_time__gte=two_weeks_ago) # Gets The Activity History Items

        # XP Boost
        is_xp_boost_available = False # Stores The Value If The XP Boost Is Available
        one_day_ago = timezone.now() - timedelta(days=1) # Gets The 1 Day Ago Time
        yesterdays_activity = Activity.objects.filter(end_time__gte=one_day_ago).first() # Gets One Of The Yesterday's Activity

        # Checks If The User's XP Boost Expired Yesterday Or Earlier And If The User Recorded Any Activity Yesterday
        if logged_in_user.xp_boost_expiration_time < one_day_ago and yesterdays_activity:
            is_xp_boost_available = True

        if request.method == "POST":
            # Use XP Boost
            if request.headers.get("X-Requested-Action") == "use-xp-boost":
                try:
                    xp_boost_expiration_time = timezone.now() + timedelta(minutes=30) # Creates The New XP Boost Expiration Time

                    Users.objects.filter(id=logged_in_user_id).update(xp_boost_expiration_time=xp_boost_expiration_time) # Stores New XP Boost Expiration Time

                    return JsonResponse({
                        "success": True, 
                        "xp_boost_expiration_time": xp_boost_expiration_time, 
                        "message": _("Navýšenie XP bolo úspešne uplatnené.")
                    }, status=200)

                except Exception as e:
                    captureError(f"An error occurred while using the available XP boost.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                    return JsonResponse({
                        "success": False, 
                        "message": _("Pri uplatňovaní navýšenia XP došlo k chybe.")
                    }, status=500)

            # Complete Official Task
            if request.headers.get("X-Requested-Action") == "complete-official-task":
                try:
                    task_data = json.loads(request.body) # Gets The Completed Task Data
                    task = OfficialTasks.objects.get(data=task_data) # Gets The Completed Task

                    # Gets The Task From User's Daily Official Tasks
                    users_daily_official_task = UserDailyOfficialTasks.objects.filter(
                        user=logged_in_user, 
                        task=task
                    ).first()

                    # Marks The Task In The User's Daily Official Tasks As Completed If Isn't Already
                    if users_daily_official_task and not users_daily_official_task.is_completed:
                        if users_daily_official_task.task.data == "2_activities":
                            users_daily_official_task.progress_percentage += 50
                            users_daily_official_task.save()

                        else:
                            users_daily_official_task.progress_percentage = 100.00
                            users_daily_official_task.save()

                        if users_daily_official_task.progress_percentage == 100.00:
                            users_daily_official_task.is_completed=True # Marks The Task As Completed
                            users_daily_official_task.save() # Saves The Updated Task

                            # Increases And Updates The Amount Of User's Obtained XP
                            Users.objects.filter(
                                id=logged_in_user_id
                            ).update(
                                xp = F("xp") + task.xp
                            )

                            return JsonResponse({
                                "success": True, 
                                "progress_percentage": 100, 
                                "is_completed": True, 
                                "first_completion": True, 
                                "gained_xp": task.xp, 
                                "message": _("Úloha bola úspešne dokončená.")
                            }, status=200)

                        return JsonResponse({
                            "success": True, 
                            "progress_percentage": users_daily_official_task.progress_percentage, 
                            "is_completed": False, 
                            "first_completion": True, 
                            "gained_xp": task.xp, 
                            "message": _("Pokrok úlohy bol úspešne zaznamenaný.")
                        }, status=200)

                    else:
                        return JsonResponse({
                            "success": True, 
                            "progress_percentage": 100, 
                            "is_completed": True, 
                            "first_completion": False, 
                            "gained_xp": 0, 
                            "message": _("Úloha už bola dokončená.")
                        }, status=200)

                except Exception as e:
                    captureError(f"An error occurred while marking the official task as completed.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                    return JsonResponse({
                        "success": False, 
                        "message": _("Pri označovaní úlohy za dokončenú došlo k chybe.")
                    }, status=500)

            # Toggle Complete Custom Task
            if request.headers.get("X-Requested-Action") == "add-custom-task":
                try:
                    custom_task_title = json.loads(request.body) # Gets The Custom Task Title

                    # Creates The New Custom Task
                    new_custom_task = CustomTasks(
                        user_id = logged_in_user_id,
                        title = custom_task_title
                    )

                    new_custom_task.save() # Saves The New Custom Task

                    custom_task = {
                        "id": new_custom_task.id,
                        "title": new_custom_task.title,
                        "created_at": new_custom_task.created_at
                    }

                    return JsonResponse({
                        "success": True, 
                        "custom_task": custom_task, 
                        "message": _("Úloha bola úspešne pridaná.")
                    }, status=200)

                except Exception as e:
                    captureError(f"An error occurred while adding the new custom task.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                    return JsonResponse({
                        "success": False, 
                        "message": _("Pri pridávaní úlohy došlo k chybe.")
                    }, status=500)

            # Toggle Complete Custom Task
            if request.headers.get("X-Requested-Action") == "toggle-complete-custom-task":
                try:
                    task_id = json.loads(request.body) # Gets The Custom Task ID
                    task = CustomTasks.objects.get(id=task_id, user_id=logged_in_user_id) # Gets The User's Custom Task

                    task.is_completed = not task.is_completed # Inverts The Completion Status
                    task.save(update_fields=["is_completed"]) # Saves The Updated Task

                    return JsonResponse({
                        "success": True, 
                        "message": _("Stav úlohy bol úspešne zmenený.")
                    }, status=200)

                except Exception as e:
                    captureError(f"An error occurred while changing the completion of the custom task.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                    return JsonResponse({
                        "success": False, 
                        "message": _("Pri zmene stavu úlohy došlo k chybe.")
                    }, status=500)

            # Delete Custom Task
            if request.headers.get("X-Requested-Action") == "delete-custom-task":
                try:
                    task_id = json.loads(request.body) # Gets The Custom Task Data
                    task = CustomTasks.objects.get(id=task_id, user_id=logged_in_user_id) # Gets The User's Custom Task

                    task.delete() # Deletes The User's Custom Task

                    return JsonResponse({
                        "success": True, 
                        "message": _("Úloha bola úspešne odstránená.")
                    }, status=200)

                except Exception as e:
                    captureError(f"An error occurred while deleting the custom task.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                    return JsonResponse({
                        "success": False, 
                        "message": _("Pri odstraňovaní úlohy došlo k chybe.")
                    }, status=500)

            # Delete Completed Custom Tasks
            if request.headers.get("X-Requested-Action") == "delete-completed-custom-tasks":
                try:
                    completed_custom_tasks_ids = json.loads(request.body) # Gets The Completed Custom Tasks IDs

                    CustomTasks.objects.filter(
                        id__in=completed_custom_tasks_ids,
                        user_id=logged_in_user_id
                    ).delete()

                    return JsonResponse({
                        "success": True, 
                        "message": _("Úlohy boli úspešne odstránené.")
                    }, status=200)

                except Exception as e:
                    captureError(f"An error occurred while deleting the completed custom tasks.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                    return JsonResponse({
                        "success": False, 
                        "message": _("Pri odstraňovaní úloh došlo k chybe.")
                    }, status=500)

            # Change Custom Tasks Order
            if request.headers.get("X-Requested-Action") == "change-custom-tasks-order":
                try:
                    tasks_ids = json.loads(request.body) # Gets The Completed Custom Tasks IDs

                    # Updates The Order Of All The Logged In User's Custom Tasks
                    for index, task_id in enumerate(tasks_ids):
                        CustomTasks.objects.filter(
                            id=task_id, 
                            user_id=logged_in_user_id
                        ).update(order=index)

                    return JsonResponse({
                        "success": True, 
                        "message": _("Poradie úloh bolo úspešne zmenené.")
                    }, status=200)

                except Exception as e:
                    captureError(f"An error occurred while changing the order of custom tasks.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                    return JsonResponse({
                        "success": False, 
                        "message": _("Pri pokuse o zmenu poradia úloh došlo k chybe.")
                    }, status=500)

            # New Activity
            if request.headers.get("X-Requested-Action") == "new-activity":
                try:
                    new_activity_data = json.loads(request.body) # Gets Training Plan Data From Fetched JS POST
                    gained_xp = new_activity_data["gained_xp"] # Gets Gained XP From POST Data

                    Users.objects.filter(id=logged_in_user_id).update(xp = F("xp") + gained_xp) # Increases And Updates The User's Gained XP
                    Users.objects.filter(id=logged_in_user_id).update(total_activities = F("total_activities") + 1) # Increases And Updates The User's Total Activities Amount

                    yesterday = today - timedelta(days=1) # Determines Yesterday's Date

                    # Gets The User's Last Activity Streak Increase Date
                    last_activity_streak_increase_date = (
                        logged_in_user.last_activity_streak_increase_time.date() if logged_in_user.last_activity_streak_increase_time else None
                    )

                    # Checks If The Activity Streak Hasn't Been Already Increased Today Or If It Has Never Increased Before
                    if last_activity_streak_increase_date is None or last_activity_streak_increase_date < today:
                        # Increases The Activity Streak
                        if last_activity_streak_increase_date == yesterday or logged_in_user.activity_streak == 0:
                            Users.objects.filter(id=logged_in_user_id).update(
                                activity_streak=F("activity_streak") + 1,
                                last_activity_streak_increase_time=today
                            )

                            # Increases The Max Activity Streak
                            if logged_in_user.activity_streak > logged_in_user.max_activity_streak:
                                Users.objects.filter(id=logged_in_user_id).update(
                                    max_activity_streak=F("activity_streak")
                                )

                    # Creates The New Activity
                    new_activity = Activity(
                        user_id = logged_in_user_id,
                        elapsed_time = int(new_activity_data["elapsed_time"]),
                        gained_xp = int(gained_xp),
                        type = new_activity_data["type"],
                        training_plan_day = new_activity_data["day"],
                        training_plan_summary = new_activity_data["training_plan_summary"]
                    )

                    new_activity.save() # Saves The New Activity

                    # No Day Off Week Badge Completion
                    if not logged_in_user.badges.filter(data="no_day_off_week").exists():
                        seven_days_ago = today - timedelta(days=6) # Determines Seven Days Ago Date

                        # Gets The Number Of Consecutive Days With Some Recorded Activity
                        unique_seven_days_of_activity = Activity.objects.filter(
                            user=logged_in_user,
                            end_time__date__range=[seven_days_ago, today]
                        ).values(
                            "end_time__date"
                        ).distinct().count()

                        if unique_seven_days_of_activity == 7:
                            # Creates The New Badge
                            new_badge = SpecialBadges(
                                user_id = logged_in_user_id,
                                title = "No Day Off Week",
                                data = "no_day_off_week"
                            )

                            new_badge.save() # Saves The New Badge

                    # X-Mas Activity Badge Completion
                    if not logged_in_user.badges.filter(data="xmas_activity").exists():
                        has_xmas_activity = Activity.objects.filter(
                            user=logged_in_user,
                            end_time__month=12,
                            end_time__day=24
                        ).exists()

                        if has_xmas_activity:
                            # Creates The New Badge
                            new_badge = SpecialBadges(
                                user_id = logged_in_user_id,
                                title = "X-Mas Activity",
                                data = "xmas_activity"
                            )

                            new_badge.save() # Saves The New Badge

                    # New Year, New Goals Badge Completion
                    if not logged_in_user.badges.filter(data="new_year_new_goals").exists():
                        has_new_year_new_goals = Activity.objects.filter(
                            user=logged_in_user,
                            end_time__month=1,
                            end_time__day=1
                        ).exists()

                        if has_new_year_new_goals:
                            # Creates The New Badge
                            new_badge = SpecialBadges(
                                user_id = logged_in_user_id,
                                title = "New Year, New Goals",
                                data = "new_year_new_goals"
                            )

                            new_badge.save() # Saves The New Badge

                    return JsonResponse({
                        "success": True, 
                        "message": _("Aktivita bola úspešne zaznamenaná.")
                    }, status=201)

                except Exception as e:
                    captureError(f"An error occurred while recording the activity.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                    return JsonResponse({
                        "success": False, 
                        "message": _("Pri zaznamenávaní aktivity došlo k chybe.")
                    }, status=404)

        return render(request, "app/training_session.html", {
            "logged_in_user": {
                "username": logged_in_user.username,
                "profile_picture_name": logged_in_user.profile_picture_name,
                "xp_boost_expiration_time": logged_in_user.xp_boost_expiration_time.isoformat()
            },

            "latest_activity": latest_activity,
            "longest_activity": longest_activity,
            "average_activity_time": average_activity_time,
            "average_activity_time_formatted": average_activity_time_formatted,
            "activities_amount": activities_amount,
            "training_plan": training_plan,
            "weekly_activity": json.dumps(weekly_activity_result), # Export As A Valid JSON Format
            "official_tasks": official_tasks,
            "official_tasks_remaining_hours": official_tasks_remaining_hours,
            "custom_tasks": custom_tasks,
            "activity_history": activity_history,
            "is_xp_boost_available": is_xp_boost_available
        })

    return render(request, "app/training_session.html")

def manageTrainingPlansView(request):
    exercises = cache.get("cached_exercises") # Gets All Cached Exercises
    # exercises = Exercises.objects.all() # Queryset

    # Exercises Fallback (If Cache Is Clear)
    if exercises is None:
        # Gets All Exercises
        exercises = list(
            Exercises.objects.all()
            .order_by("exercise")
            # .values("exercise", "unit", "categories", "requires_weight")
        )

        cache.set("cached_exercises", exercises, timeout=settings.CACHE_TTL) # Caches Exercises

        print("Getting Exercises Data From The DB.") # Test Print

    else:
        print("Getting Exercises Data From The Redis Cache.") # Test Print

    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session

        logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets Logged In User

        day_index = ((datetime.today().weekday()) + 1) % 7 # Gets Current Day Index (Sunday - 0, Monday - 1, Tuesday - 2, Wednesday - 3, Thursday - 4, Friday - 5, Saturday - 6)

        # Gets Logged In User's Training Plans Sorted By Weekdays From Current Day
        training_plan = (
            TrainingPlan.objects
            .filter(user_id=logged_in_user_id)
            .annotate(
                sorted_days=ExpressionWrapper(
                    Mod(F("day") - Value(day_index) + Value(7), Value(7)),
                    output_field=IntegerField()
                )
            )
            .order_by("sorted_days")
        )

        if request.method == "POST":
            try:
                training_plan_data = json.loads(request.body) # Gets Training Plan Data From Fetched JS POST
                
                # Gets Each Object From The Training Plan Data
                for one_object in training_plan_data:
                    # New Training Plan
                    if one_object["action"] == "new_training_plan":
                        new_training_plan = TrainingPlan(
                            user_id = logged_in_user_id,
                            training_plan_key = one_object["training_plan_key"],
                            day = one_object["day"],
                            type = one_object["type"],
                            exercise = one_object["exercise"],
                            periods = one_object["periods"],
                            unit = one_object["unit"],
                            order = one_object["order"],
                        )

                        new_training_plan.save() # Saves New Training Plan

                    # Edited Training Plan
                    elif one_object["action"] == "edited_training_plan":
                        previous_training_plan_key = one_object["previous_training_plan_key"] # Gets The Previous Training Plan Key

                        if previous_training_plan_key:
                            training_plan.filter(training_plan_key=previous_training_plan_key).delete()

                        edited_training_plan = TrainingPlan(
                            user_id = logged_in_user_id,
                            training_plan_key = one_object["training_plan_key"],
                            day = one_object["day"],
                            type = one_object["type"],
                            exercise = one_object["exercise"],
                            periods = one_object["periods"],
                            unit = one_object["unit"],
                            order = one_object["order"],
                        )

                        edited_training_plan.save() # Saves Edited Training Plan

                    elif one_object["action"] == "delete_training_plan":
                        training_plan.filter(training_plan_key=one_object["training_plan_key"]).delete() # Deletes Exercises With Similar Training Plan Key

                return JsonResponse({
                    "success": True, 
                    "message": _("Zmeny v tréningovom pláne boli úspešne vykonané.")
                }, status=201) # Returns Success Response

            except Exception as e:
                captureError(f"An error occurred while making changes to the training plan.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                return JsonResponse({
                    "success": False, 
                    "message": _("Pri vykonávaní zmien v tréningovom pláne došlo k chybe.")
                }, status=404)
        
        return render(request, "app/manage_training_plans.html", {
            "logged_in_user": {
                "username": logged_in_user.username,
                "profile_picture_name": logged_in_user.profile_picture_name
            },

            "exercises": exercises,
            "training_plan": training_plan,
        })

    return render(request, "app/manage_training_plans.html", {
        "exercises": exercises,
    })

def communityView(request):
    # Load First Users
    if request.headers.get("X-Requested-Action") == "load-first-users":
        logged_in_user_id = None # Default State When The User Isn't Logged In
        logged_in_user = None # Default State When The User Isn't Logged In

        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets The Logged In User ID
            logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets The Logged In User

        try:
            searched_users_history = json.loads(request.body) # Gets The Searched Users History

            loaded_users_from_history = Users.objects.filter(
                username__in=searched_users_history,
                account_status="OK"
            ).annotate(
                # Creates The Has Follow Column (True If The Logged In User Is Following The User)
                has_follow=Exists(
                    FollowRelation.objects.filter(
                        from_user=logged_in_user_id,
                        to_user=OuterRef("pk"),
                        status="accepted"
                    )
                ) if logged_in_user else Value(False, output_field=BooleanField()),

                # Creates The Has Pending Follow Request Column (True If The Logged In User Has Pending Follow Request)
                has_pending_follow_request=Exists(
                    FollowRelation.objects.filter(
                        from_user=logged_in_user_id,
                        to_user=OuterRef("pk"),
                        status="pending"
                    )
                ) if logged_in_user else Value(False, output_field=BooleanField())
            ).prefetch_related(
                # Gets All Followers With All Related Data
                Prefetch(
                    "follower_relations",
                    queryset=FollowRelation.objects.filter(status="accepted").select_related("from_user"),
                    to_attr="accepted_followers"
                ),
                
                # Gets All Following Users With All Related Data
                Prefetch(
                    "following_relations",
                    queryset=FollowRelation.objects.filter(status="accepted").select_related("to_user"),
                    to_attr="accepted_following"
                )
            )

            loaded_users_from_history_list = list(loaded_users_from_history) # Converts The Loaded Users From History To List
            loaded_users_from_history_list.sort(key=lambda user:searched_users_history.index(user.username)) # Sorts The Loaded Users From History List By The Original Order In The History

            missing_users_amount = 3 - len(loaded_users_from_history_list) # Gets The Amount Of Missing Users To The Maximum Of 3
            missing_users_list = []

            if missing_users_amount > 0:
                loaded_users_from_history_ids = [u.id for u in loaded_users_from_history_list] # Gets The IDs Of Users In History

                # Gets The Missing Users With OK Account Status, Excludes Logged In User And Orders Them From Newest
                missing_users = Users.objects.filter(
                    account_status="OK"
                ).annotate(
                    # Creates The Has Follow Column (True If The Logged In User Is Following The User)
                    has_follow=Exists(
                        FollowRelation.objects.filter(
                            from_user=logged_in_user_id,
                            to_user=OuterRef("pk"),
                            status="accepted"
                        )
                    ) if logged_in_user else Value(False, output_field=BooleanField()),

                    # Creates The Has Pending Follow Request Column (True If The Logged In User Has Pending Follow Request)
                    has_pending_follow_request=Exists(
                        FollowRelation.objects.filter(
                            from_user=logged_in_user_id,
                            to_user=OuterRef("pk"),
                            status="pending"
                        )
                    ) if logged_in_user else Value(False, output_field=BooleanField())
                ).prefetch_related(
                    # Gets All Followers With All Related Data
                    Prefetch(
                        "follower_relations",
                        queryset=FollowRelation.objects.filter(status="accepted").select_related("from_user"),
                        to_attr="accepted_followers"
                    ),
                    
                    # Gets All Following Users With All Related Data
                    Prefetch(
                        "following_relations",
                        queryset=FollowRelation.objects.filter(status="accepted").select_related("to_user"),
                        to_attr="accepted_following"
                    )
                ).exclude(
                    id__in=loaded_users_from_history_ids # Prevents Getting The Users Who Were Already Loaded From The History
                ).order_by(
                    "-creation_time"
                )

                if logged_in_user:
                    # Removes The Logged In User From Missing Users
                    missing_users = missing_users.exclude(
                        id=logged_in_user_id
                    )

                missing_users = missing_users[:missing_users_amount]
                
                missing_users_list = list(missing_users) # Converts The Missing Users To List

            users = loaded_users_from_history_list + missing_users_list # Connects Loaded Users From History And Missing Users Into The One List

            loaded_users = []

            for one_user in users:
                loaded_users.append({
                    "id": one_user.id,
                    "first_name": one_user.first_name,
                    "last_name": one_user.last_name,
                    "username": one_user.username,
                    "profile_picture_name": one_user.profile_picture_name,
                    "friend_code": one_user.friend_code,
                    "private_account": one_user.private_account,
                    "followers": len(one_user.accepted_followers),
                    "has_follow": one_user.has_follow,
                    "has_pending_follow_request": one_user.has_pending_follow_request
                })

            if logged_in_user:
                return JsonResponse({
                    "success": True, 
                    "logged_in_user_id": logged_in_user_id, 
                    "users": loaded_users, 
                    "message": _("Užívatelia boli úspešne načítaný.")
                }, status=200)

            return JsonResponse({
                "success": True, 
                "users": loaded_users, 
                "message": _("Užívatelia boli úspešne načítaný.")
            }, status=200)

        except Exception as e:
            captureError(f"An error occurred while loading the users.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

            return JsonResponse({
                "success": False, 
                "message": _("Pri načítavaní užívateľov došlo k chybe.")
            }, status=500)

    # Search Users
    if request.headers.get("X-Requested-Action") == "search-users":
        logged_in_user_id = None # Default State When The User Isn't Logged In
        logged_in_user = None # Default State When The User Isn't Logged In

        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets The Logged In User ID
            logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets The Logged In User

        try:
            searched_text = json.loads(request.body) # Gets The Searched Text
            
            # Filters Users By Searched Text (Case-Insensitive)
            users = Users.objects.filter(
                Q(account_status="OK") & (
                    Q(first_name__icontains=searched_text) | 
                    Q(last_name__icontains=searched_text) | 
                    Q(username__icontains=searched_text) | 
                    Q(friend_code__contains=searched_text)
                )
            ).annotate(
                # Creates Is Followed Column (True If The User Is Following The User)
                is_followed=Case(
                    When(id__in=logged_in_user.following.values_list("id", flat=True), then=True),
                    default=False,
                    output_field=BooleanField()
                ) if logged_in_user else Value(False, output_field=BooleanField()),

                # Creates The Has Follow Column (True If The Logged In User Is Following The User)
                has_follow=Exists(
                    FollowRelation.objects.filter(
                        from_user=logged_in_user_id,
                        to_user=OuterRef("pk"),
                        status="accepted"
                    )
                ) if logged_in_user else Value(False, output_field=BooleanField()),

                # Creates The Has Pending Follow Request Column (True If The Logged In User Has Pending Follow Request)
                has_pending_follow_request=Exists(
                    FollowRelation.objects.filter(
                        from_user=logged_in_user_id,
                        to_user=OuterRef("pk"),
                        status="pending"
                    )
                ) if logged_in_user else Value(False, output_field=BooleanField())
            ).prefetch_related(
                # Gets All Followers With All Related Data
                Prefetch(
                    "follower_relations",
                    queryset=FollowRelation.objects.filter(status="accepted").select_related("from_user"),
                    to_attr="accepted_followers"
                ),
                
                # Gets All Following Users With All Related Data
                Prefetch(
                    "following_relations",
                    queryset=FollowRelation.objects.filter(status="accepted").select_related("to_user"),
                    to_attr="accepted_following"
                )
            ).order_by(
                "-is_followed",
                "-creation_time"
            )

            if logged_in_user:
                # Removes The Logged In User From Users
                users = users.exclude(
                    id=logged_in_user_id
                )
            
            # Creates Valid Format Of Users For JSON Response
            users = [
                {
                    "id": one_user.id, 
                    "first_name": one_user.first_name, 
                    "last_name": one_user.last_name, 
                    "username": one_user.username,
                    "profile_picture_name": one_user.profile_picture_name, 
                    "friend_code": one_user.friend_code,
                    "private_account": one_user.private_account,
                    "followers": len(one_user.accepted_followers),
                    "has_follow": one_user.has_follow,
                    "has_pending_follow_request": one_user.has_pending_follow_request
                }

                for one_user in users
            ]

            if logged_in_user:
                return JsonResponse({
                    "success": True, 
                    "logged_in_user_id": logged_in_user_id, 
                    "users": users, 
                    "message": _("Užívatelia boli úspešné nájdený.")
                }, status=200)

            return JsonResponse({
                "success": True, 
                "users": users, 
                "message": _("Užívatelia boli úspešné nájdený.")
            }, status=200)

        except Exception as e:
            captureError(f"An error occurred while searching for users.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

            return JsonResponse({
                "success": False, 
                "message": _("Pri hľadaní užívateľov došlo k chybe.")
            }, status=404)

    if request.method == "POST":
        # Toggle Post Like
        if request.headers.get("X-Requested-Action") == "toggle-post-like":
            return togglePostLike(request)

        # Report Post
        if request.headers.get("X-Requested-Action") == "report-post":
            return reportPost(request)

        # Toggle Post Save
        if request.headers.get("X-Requested-Action") == "toggle-post-save":
            return togglePostSave(request)

        # Report Comment
        if request.headers.get("X-Requested-Action") == "report-post-comment":
            return reportPostComment(request)

        # Add Comment
        if request.headers.get("X-Requested-Action") == "add-comment":
            return addComment(request)

        # Toggle Post Comment Like
        if request.headers.get("X-Requested-Action") == "toggle-post-comment-like":
            return togglePostCommentLike(request)

    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
        logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets Logged In User

        # Gets The User's Currently Processed Post With All Related Data
        processing_posts = Post.objects.filter(
            user__id=logged_in_user_id,
            media__is_processed=False
        ).select_related(
            "user"
        ).prefetch_related(
            # Gets All Followers With All Related Data
            Prefetch(
                "user__follower_relations",
                queryset=FollowRelation.objects.filter(status="accepted").select_related("from_user"),
                to_attr="accepted_followers"
            ),
            
            # Gets All Following Users With All Related Data
            Prefetch(
                "user__following_relations",
                queryset=FollowRelation.objects.filter(status="accepted").select_related("to_user"),
                to_attr="accepted_following"
            ),

            "tagged_users",

            Prefetch(
                "media",
                queryset=PostMedia.objects.order_by("order")
            )
        ).order_by(
            "-created_at"
        ).distinct()

        # Gets The Tagged Users From Each Processing Post In JSON Format
        for one_post in processing_posts:
            one_post.tagged_users_json = json.dumps(
                list(one_post.tagged_users.values_list("username", flat=True))
            )

        if request.method == "POST":
            # Upload Post Form
            if request.POST.get("upload_post_form_submit"):
                # Loads Data From reCaptcha In Upload Post Form
                recaptcha_response = request.POST.get("g-recaptcha-response")
                recaptcha_data = {
                    "secret": settings.RECAPTCHA_SECRET_KEY,
                    "response": recaptcha_response
                }

                # Loads reCaptcha API
                recaptcha_api = requests.post(
                    "https://www.google.com/recaptcha/api/siteverify",
                    data=recaptcha_data,
                    headers={"Connection": "close"},
                    timeout=10
                ).json()

                # Checks Validity Of reCaptcha Response
                if not recaptcha_api.get("success") or recaptcha_api.get("score", 0) < 0.1:
                    messages.add_message(request, messages.ERROR, _("Overenie reCaptcha zlyhalo"))
                    captureError(f"Verification by reCAPTCHA failed.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

                else:
                    upload_post_form = uploadPostForm(request.POST) # Gets The Upload Post Form
                    files = request.FILES.getlist("select_posts") # Gets Files From the POST

                    thumbnail_files = request.FILES.getlist("select_thumbnail") # Gets Thumbnail Files From the POST
                    thumbnail_files_dict = {one_file.name: one_file for one_file in thumbnail_files} # Converts The Thumbnail Files To The Dictionary Format

                    # Saves Only if The Form is Valid And Includes at Least One File
                    if upload_post_form.is_valid() and files:
                        media_data = json.loads(request.POST.get("media_data", "[]")) # Gets The Media Data

                        # Converts The Media Data To The Dictionary Format (For Example: {"photo1.jpg": {"order": 0, "is_muted": False}, "photo2.jpg": {"order": 1, "is_muted": False}})
                        media_data_dict = {
                            one_item["filename"]: {
                                "order": int(one_item["order"]), 
                                "is_muted": bool(one_item["is_muted"]),
                                "thumbnail_filename": str(one_item["thumbnail_filename"])
                            }

                            for one_item in media_data if one_item["filename"]
                        }

                        try:
                            # Gets The Coordinates Data
                            coordinates_data = {
                                "latitude": request.POST.get("latitude") or None,
                                "longitude": request.POST.get("longitude") or None
                            }
                            
                            # Gets The Coordinates If They Are Available
                            if coordinates_data["latitude"] and coordinates_data["longitude"]:
                                coordinates = Point(float(coordinates_data["longitude"]), float(coordinates_data["latitude"])) # Converts Coordinates Format With GeoDjango

                            else:
                                coordinates = None

                            new_post = upload_post_form.save(commit=False)
                            new_post.user_id = logged_in_user_id
                            new_post.description = request.POST.get("description")

                            # new_post.tagged_users = [str(one_id) for one_id in tagged_users_ids]
                            new_post.added_hashtags = json.loads(request.POST.get("added_hashtags"))

                            if coordinates:
                                new_post.coordinates = coordinates

                            new_post.save()

                            tagged_users_data = json.loads(request.POST.get("tagged_users")) # For Example: ["@user1","@user2","@user3"]

                            # Gets List Of IDs Of Tagged Users
                            tagged_users_ids = list(
                                Users.objects.filter(username__in=tagged_users_data)
                                .values_list("id", flat=True)
                            )

                            tagged_users = Users.objects.filter(id__in=tagged_users_ids)

                            new_post.tagged_users.set(tagged_users)

                            MAX_IMAGE_SIZE = 10 * 1000 * 1000 # 10MB
                            MAX_VIDEO_SIZE = 1000 * 1000 * 500 # 500MB
                            MAX_VIDEO_DURATION = 60 * 20 # 20 Minutes
                            MIN_VIDEO_DURATION = 1 # 1 Second

                            compress_tasks = [] # Stores All Compress Tasks

                            for one_file in files:
                                try:
                                    file_head = one_file.read(2048) # Reads Head Of File And Validates The Real Format
                                    one_file.seek(0)
                                    mime_type = magic.from_buffer(file_head, mime=True)
                                    is_video = mime_type.startswith("video/")
                                    
                                    # Catches An Unsupported File
                                    if not (mime_type.startswith("image/") or is_video):
                                        return JsonResponse({
                                            "success": False, 
                                            "message": _("Súbor nemá podporovaný formát:\n%(file)s") % {"file": one_file.name}
                                        }, status=400)

                                    max_file_size = MAX_VIDEO_SIZE if is_video else MAX_IMAGE_SIZE

                                    # Catches Too Large File
                                    if one_file.size > max_file_size:
                                        return JsonResponse({
                                            "success": False, 
                                            "message": _("Súbor je príliš veľký:\n%(file)s") % {"file": one_file.name}
                                        }, status=400)

                                    # Catches A Too Long Video
                                    if is_video:
                                        # Creates A Temporary File For The moviepy Library
                                        temporary_path = f"temp_{one_file.name}"

                                        with open(temporary_path, 'wb+') as destination:
                                            for one_chunk in one_file.chunks():
                                                destination.write(one_chunk)
                                        
                                        try:
                                            video = VideoFileClip(temporary_path)
                                            duration = video.duration
                                            video.close()
                                            os.remove(temporary_path) # Deletes The Temporary File

                                            if duration > MAX_VIDEO_DURATION:
                                                return JsonResponse({
                                                    "success": False, 
                                                    "message": _("Video je príliš dlhé:\n%(file)s") % {"file": one_file.name}
                                                }, status=400)

                                            elif duration < MIN_VIDEO_DURATION:
                                                return JsonResponse({
                                                    "success": False, 
                                                    "message": _("Video je príliš krátke:\n%(file)s") % {"file": one_file.name}
                                                }, status=400)

                                        except Exception:
                                            if os.path.exists(temporary_path): 
                                                os.remove(temporary_path)

                                            return JsonResponse({
                                                "success": False, 
                                                "message": _("Pri spracovávaní videa došlo k chybe:\n%(file)s") % {"file": one_file.name}
                                            }, status=400)

                                    file_settings = media_data_dict.get(one_file.name, {"order": 0, "is_muted": False, "thumbnail_filename": ""})
                                    order = file_settings["order"] # Gets The Order Of The Current File
                                    is_muted = file_settings["is_muted"] # Gets The Value Of If The Current File Is Muted
                                    thumbnail_filename = file_settings["thumbnail_filename"] # Gets The Video Thumbnail's Filename
                                    thumbnail_file = thumbnail_files_dict.get(thumbnail_filename) # Gets The Thumbnail File
                                    
                                    # Saves The New Post Media
                                    new_post_media = PostMedia.objects.create(
                                        post=new_post,
                                        file=one_file,
                                        is_video=is_video,
                                        original_filename=one_file.name,
                                        original_size=one_file.size,
                                        order=order,
                                        is_muted=is_muted if is_video else False
                                    )

                                    # Video
                                    if is_video:
                                        custom_thumbnail_path = None # Stores The Custom Thumbnail Path

                                        if thumbnail_file:
                                            thumb_temp_path = f"temp/thumb_{new_post_media.id}"
                                            custom_thumbnail_path = default_storage.save(thumb_temp_path, ContentFile(thumbnail_file.read())) # Gets The Custom Thumbnail Path

                                        compress_video_task = compressVideo.delay(
                                            post_media_id=new_post_media.id, 
                                            custom_thumbnail_path=custom_thumbnail_path
                                        )

                                        compress_tasks.append({
                                            "task_id": compress_video_task.id,
                                            "post_media_id": new_post_media.id,
                                            "post_id": new_post_media.post.id
                                        })
                                    
                                    # Image
                                    elif not is_video:
                                        compress_image_task = compressImage.delay(new_post_media.id)

                                        compress_tasks.append({
                                            "task_id": compress_image_task.id,
                                            "post_media_id": new_post_media.id,
                                            "post_id": new_post_media.post.id
                                        })

                                except Exception:
                                    # new_post.delete()
                                    messages.add_message(request, messages.ERROR, _("Chyba pri spracovaní súboru:\n%(file)s") % {"file": one_file.name})
                                    return redirect("community_url")

                            return JsonResponse({
                                "success": True,
                                "compress_tasks": compress_tasks
                            }, status=200)

                        # Error
                        except Exception as e:
                            messages.add_message(request, messages.ERROR, _("Pri pridávaní príspevku došlo k chybe"))
                            captureError(f"An error occurred while adding the post.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")
                    
                    # Wrong Form
                    else:
                        messages.add_message(request, messages.ERROR, _("Pridávanie príspevku zlyhalo"))
                        captureError(f"Uploading the post failed.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

            # Mark Post As Seen
            if request.headers.get("X-Requested-Action") == "mark-post-as-seen":
                return markPostAsSeen(request)

            # Toggle Follow
            if request.headers.get("X-Requested-Action") == "toggle-follow":
                return toggleFollow(request)

            # Edit Post Settings
            if request.headers.get("X-Requested-Action") == "edit-post-settings":
                return editPostSettings(request)

            # Delete Post
            if request.headers.get("X-Requested-Action") == "delete-post":
                return deletePost(request)

            # Delete Comment
            if request.headers.get("X-Requested-Action") == "delete-post-comment":
                return deletePostComment(request)

            # Tag User
            if request.headers.get("X-Requested-Action") == "tag-user":
                try:
                    searched_tag = json.loads(request.body) # Gets The Searched Tag
                    
                    # Gets All Relevant Users By Searched Tag
                    users_for_tag = Users.objects.filter(
                        account_status="OK", 
                        username__contains=searched_tag
                    ).exclude(id=logged_in_user_id).order_by("-creation_time") # Filters Users By Searched Tag (Case-Sensitive)

                    # Creates Valid Format Of Users For Tag For JSON Response
                    users_for_tag = [
                        {
                            "id": one_user.id,
                            "first_name": one_user.first_name,
                            "last_name": one_user.last_name,
                            "username": one_user.username,
                            "profile_picture_name": one_user.profile_picture_name,
                        }

                        for one_user in users_for_tag
                    ]

                    return JsonResponse({
                        "success": True, 
                        "users": users_for_tag, 
                        "message": "Užívatelia pre označenie boli úspešne nájdený."
                    }, status=200)

                except Exception as e:
                    captureError(f"An error occurred while searching for users for the tag.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                    return JsonResponse({
                        "success": False, 
                        "message": _("Pri hľadaní užívateľov pre označenie došlo k chybe.")
                    }, status=404)

        return render(request, "app/community.html", {
            "logged_in_user": {
                "id": logged_in_user.id,
                "username": logged_in_user.username,
                "profile_picture_name": logged_in_user.profile_picture_name,
                "private_account": logged_in_user.private_account,
                "data_saving_mode": logged_in_user.data_saving_mode
            },

            "upload_post_form": uploadPostForm,
            "processing_posts": processing_posts
        })

    return render(request, "app/community.html", {
        "upload_post_form": uploadPostForm
    })

def loadPostsView(request):
    logged_in_user_id = None # Default State When The User Isn't Logged In
    logged_in_user = None # Default State When The User Isn't Logged In

    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id") # Gets The Logged In User ID
        logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets The Logged In User

    page_number = request.GET.get("page", 1) # Gets The Current Page Number
    searched_text = request.GET.get("searched_text", "") # Gets The Searched Text

    # Gets The Posts With All Related Data
    thirty_days_ago = timezone.now() - timedelta(days=30)

    posts_query = Post.objects.select_related(
        "user"
    ).prefetch_related(
        # Gets All Followers With All Related Data
        Prefetch(
            "user__follower_relations",
            queryset=FollowRelation.objects.filter(status="accepted").select_related("from_user"),
            to_attr="accepted_followers"
        ),
        
        # Gets All Following Users With All Related Data
        Prefetch(
            "user__following_relations",
            queryset=FollowRelation.objects.filter(status="accepted").select_related("to_user"),
            to_attr="accepted_following"
        ),

        "tagged_users", 

        Prefetch(
            "media",
            queryset=PostMedia.objects.annotate(
                unique_video_views=Count("video_views", distinct=True) # Gets The Unique Viewers Amount
            ).annotate(
                # Calculates The Average Watch Time Per 1 Viewer
                average_watch_time_per_viewer=Case(
                    When(unique_video_views=0, then=Value(0.0)),
                    default=Cast(F("total_watch_time"), FloatField()) / Cast(F("unique_video_views"), FloatField()),
                    output_field=FloatField()
                )
            ).order_by("order")
        )
    ).exclude(
        media__is_processed=False
    ).annotate(
        views=Count("seen_by_instances", distinct=True),

        # Creates Is Seen Column (True If The Logged In User Has Already Viewed The Post)
        is_seen=Exists(
            SeenPost.objects.filter(post=OuterRef("pk"), user=logged_in_user)
        ) if logged_in_user else Value(False, output_field=BooleanField()),

        # Creates Is Followed Column (True If The User Is Following The Author Of The Post)
        is_followed=Case(
            When(user_id__in=logged_in_user.following.values_list("id", flat=True), then=True),
            default=False,
            output_field=BooleanField()
        ) if logged_in_user else Value(False, output_field=BooleanField()),

        comments_amount=Count("comments", filter=~Q(comments__status="hidden"), distinct=True)
    ).exclude(
        # Excludes Already Viewed Posts Which Were Viewed 30 Days Ago
        Exists(
            SeenPost.objects.filter(
                post=OuterRef("pk"), 
                user=logged_in_user, 
                viewed_at__lt=thirty_days_ago
            )
        )
    ).order_by(
        "is_seen",
        "-is_followed",
        "-latest_interaction"
    ).distinct()

    if logged_in_user:
        # Gets All Logged In User's Accepted Following Users IDs
        accepted_following_ids = FollowRelation.objects.filter(
            from_user_id=logged_in_user_id, 
            status="accepted"
        ).values("to_user_id")

        posts_query = posts_query.exclude(
            # Hides Posts Which Aren't For Public And The Post Doesn't Belong To Logged In User And The Logged In User Doesn't Follow The Post's Author
            (
                Q(public_visibility=False) & 
                ~Q(user_id=logged_in_user_id) & 
                ~Q(user_id__in=accepted_following_ids)
            ) |

            # Hides Posts From Authors Which Accounts Are Private And The Post Doesn't Belong To Logged In User And The Logged In User Doesn't Follow The Post's Author
            (
                Q(user__private_account=True) & 
                ~Q(user_id=logged_in_user_id) & 
                ~Q(user_id__in=accepted_following_ids)
            )
        )

    else:
        posts_query = posts_query.exclude(
            # Hides All Posts Which Aren't For Public Or From Authors Which Accounts Are Private When The Viewer Isn't Logged In
            Q(public_visibility=False) | Q(user__private_account=True)
        )

    # Filters Posts By Searched Text
    if searched_text:
        posts_query = posts_query.filter(
            (Q(user__first_name__icontains=searched_text) | 
            Q(user__last_name__icontains=searched_text) | 
            Q(user__username__icontains=searched_text) | 
            Q(description__icontains=searched_text) | 
            Q(tagged_users__username__icontains=searched_text) |
            Q(added_hashtags__icontains=searched_text) | 
            Q(location__icontains=searched_text) | 
            Q(tagged_users__first_name__icontains=searched_text) |
            Q(tagged_users__last_name__icontains=searched_text)) &
            Q(media__isnull=False)
        ).select_related(
            "user"
        ).prefetch_related(
            "tagged_users",
            "media",
        ).exclude(
            tagged_users__account_status="suspended",
            media__is_processed=False
        ).order_by(
            "-created_at"
        ).distinct()

    paginator = Paginator(posts_query, 5) if logged_in_user and logged_in_user.data_saving_mode else Paginator(posts_query, 10) # Divides The Posts By Maximum 10 Per Page (3 When The Logged In User Has Data Saving Mode Enabled)

    try:
        page_posts = paginator.page(page_number) # Gets Only The Posts For The Selected Page

    except Exception as e:
        captureError(f"An error occurred while searching for posts.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return JsonResponse({
            "success": False, 
            "has_next": False, 
            "message": _("Pri hľadaní príspevkov došlo k chybe.")
        }, status=404)

    # Creates Valid Format Of Posts For JSON Response
    posts = [
        {
            "user": {
                "id": one_post.user.id,
                "first_name": one_post.user.first_name,
                "last_name": one_post.user.last_name,
                "username": one_post.user.username,
                "profile_picture_name": one_post.user.profile_picture_name,
                "following": [one_relation.from_user_id for one_relation in one_post.user.accepted_following],
                "followers": [one_relation.from_user_id for one_relation in one_post.user.accepted_followers],
                "private_account": one_post.user.private_account
            },

            "id": one_post.id,

            "description": (
                one_post.description
                if one_post.description
                else None
            ),

            "tagged_users": list(one_post.tagged_users.values("id", "first_name", "last_name", "username")),
            "added_hashtags": list(one_post.added_hashtags),

            "location": (
                one_post.location.replace(",", "<span></span>")
                if one_post.coordinates
                else one_post.location if one_post.location else None
            ),

            "coordinates": (
                {
                    "latitude": str(one_post.coordinates.y).replace(",", "."),
                    "longitude": str(one_post.coordinates.x).replace(",", ".")
                }

                if one_post.coordinates and one_post.coordinates.x is not None and one_post.coordinates.y is not None
                else None
            ),

            "public_visibility": one_post.public_visibility,
            "allow_comments": one_post.allow_comments,
            "hide_likes": one_post.hide_likes,
            "likes": one_post.likes,
            "likes_from_users": list(one_post.likes_from_users.values_list("id", flat=True)),
            "created_at": one_post.created_at.isoformat(),

            "media": [
                {
                    "id": one_media.id,
                    "file": one_media.file.name if one_media.file else None,
                    "thumbnail": one_media.thumbnail.name if one_media.thumbnail else None,
                    "is_video": one_media.is_video,
                    "is_muted": one_media.is_muted,
                    "average_watch_time": one_media.average_watch_time_per_viewer if one_media.is_video and logged_in_user_id == one_post.user.id else None,
                    "video_views": one_media.unique_video_views if one_media.is_video and logged_in_user_id == one_post.user.id else None,
                    "sprite_sheet": one_media.sprite_sheet.name if one_media.sprite_sheet else None,
                    "vtt_file": one_media.vtt_file.name if one_media.vtt_file else None
                }

                for one_media in one_post.media.all()
            ],

            "views": one_post.views,
            "comments_amount": one_post.comments_amount
        }

        for one_post in page_posts
    ]

    if logged_in_user:
        logged_in_user = {
            "id": logged_in_user_id, 
            "role": logged_in_user.role,
            "profile_picture_name": logged_in_user.profile_picture_name,
            "saved_posts": list(logged_in_user.saved_posts.values_list("id", flat=True))
        }

        return JsonResponse({
            "success": True, 
            "has_next": page_posts.has_next(), 
            "logged_in_user": logged_in_user, 
            "posts": posts, 
            "message": _("Príspevky boli úspešné nájdené.")
        }, status=200)

    return JsonResponse({
        "success": True, 
        "has_next": page_posts.has_next(), 
        "posts": posts, 
        "message": _("Príspevky boli úspešné nájdené.")
    }, status=200)

def loadPostCommentsView(request, post_id):
    logged_in_user_id = None # Default State When The User Isn't Logged In
    logged_in_user = None # Default State When The User Isn't Logged In

    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id") # Gets The Logged In User ID
        logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets The Logged In User

    page_number = request.GET.get("page", 1) # Gets The Current Page Number

    try:
        # Gets The Post Root Comments With All Related Data
        post_root_comments_query = PostForum.objects.filter(
            post_id=post_id,
            parent__isnull=True
        ).exclude(
            status="hidden"
        ).select_related(
            "user"
        ).prefetch_related(
            "likes_from_users",
            "reports_from_users"
        ).order_by(
            "creation_time"
        )

        paginator = Paginator(post_root_comments_query, 3) if logged_in_user and logged_in_user.data_saving_mode else Paginator(post_root_comments_query, 10) # Divides The Root Comments By Maximum 10 Per Page (3 When The Logged In User Has Data Saving Mode Enabled)
        page_post_root_comments = paginator.page(page_number) # Gets Only The Root Comments For The Selected Page

        post_root_comments_ids = [comment.id for comment in page_post_root_comments] # Gets All Post Root Comments IDs
        
        # Gets The Post Replies Comments With All Related Data
        post_replies_comments_query = PostForum.objects.filter(
            Q(parent_id__in=post_root_comments_ids) | # Level 2 (Reply On Root Comment)
            Q(parent__parent_id__in=post_root_comments_ids) | # Level 3 (Reply On Level 2)
            Q(parent__parent__parent_id__in=post_root_comments_ids) | # Level 4 (Reply On Level 3)
            Q(parent__parent__parent__parent_id__in=post_root_comments_ids), # Level 5 (Reply On Level 4)
            post_id=post_id
        ).exclude(
            status="hidden"
        ).select_related(
            "user"
        ).prefetch_related(
            "likes_from_users",
            "reports_from_users"
        )

        # Combines The Post Root Comments And Replies
        combined_post_comments = sorted(
            chain(page_post_root_comments, post_replies_comments_query),
            key=lambda x: x.creation_time
        )

    except Exception as e:
        captureError(f"An error occurred while searching for comments.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return JsonResponse({
            "success": False, 
            "has_next": False, 
            "message": _("Pri hľadaní komentárov došlo k chybe.")
        }, status=404)

    # Creates Valid Format Of Post Comments For JSON Response
    post_comments = [
        {
            "id": one_comment.id,

            "user": {
                "id": one_comment.user.id,
                "first_name": one_comment.user.first_name,
                "last_name": one_comment.user.last_name,
                "username": one_comment.user.username,
                "profile_picture_name": one_comment.user.profile_picture_name
            },

            "comment": one_comment.comment,
            "likes": one_comment.likes,
            "likes_from_users": list(one_comment.likes_from_users.values_list("id", flat=True)),
            "creation_time": one_comment.creation_time.isoformat(),
            "parent_id": one_comment.parent_id,
            "reports_from_users": list(one_comment.reports_from_users.values_list("id", flat=True)),
            "level": one_comment.level
        }

        for one_comment in combined_post_comments
    ]

    return JsonResponse({
        "success": True, 
        "has_next": page_post_root_comments.has_next(), 
        "visible_comments": post_comments, 
        "message": _("Komentáre boli úspešné nájdené.")
    }, status=200)

def streamVideo(request, user_id, media_id, filename):
    # Manual Addition For HLS Types If The OS Doesn't Know Them
    mimetypes.add_type("application/x-mpegURL", ".m3u8")
    mimetypes.add_type("video/MP2T", ".ts")

    # Gets The Save Video File Path (Path Traversal Protection) From Traveling Between Paths
    safe_filename = os.path.basename(filename)
    path = os.path.join(settings.MEDIA_ROOT, "posts", str(user_id), "videos", str(media_id), safe_filename)

    if not os.path.exists(path):
        raise Http404(f"File {safe_filename} was not found.")

    # Checks If The File Is index.m3u8 Or .ts Video File Segment
    content_type, _ = mimetypes.guess_type(path)

    if not content_type:
        content_type = "application/octet-stream"

    video_response = FileResponse(open(path, "rb"), content_type=content_type)
    video_response["Accept-Ranges"] = "bytes"

    return video_response

def getCompressionStatus(request, task_id):
    print(task_id)

    result = AsyncResult(task_id)
    
    upload_progress_response = {
        "task_id": task_id,
        "state": result.state, # PENDING, PROGRESS, SUCCESS, FAILURE
        "progress": 0
    }

    if result.state == "PROGRESS":
        upload_progress_response["progress"] = result.info.get("percentage", 0)
    
    elif result.state == "SUCCESS":
        upload_progress_response["progress"] = 100
    
    elif result.state == "FAILURE":
        upload_progress_response["progress"] = 0

    return JsonResponse(upload_progress_response)

def postView(request, post_id):
    logged_in_user_id = None # Default State When The User Isn't Logged In
    logged_in_user = None # Default State When The User Isn't Logged In

    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id") # Gets The Logged In User ID
        logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets The Logged In User

        if request.method == "POST":
            # Mark Post As Seen
            if request.headers.get("X-Requested-Action") == "mark-post-as-seen":
                return markPostAsSeen(request)

            # Toggle Follow
            if request.headers.get("X-Requested-Action") == "toggle-follow":
                return toggleFollow(request)

            # Edit Post Settings
            if request.headers.get("X-Requested-Action") == "edit-post-settings":
                return editPostSettings(request)

            # Delete Post
            if request.headers.get("X-Requested-Action") == "delete-post":
                return deletePost(request)

            # Delete Comment
            if request.headers.get("X-Requested-Action") == "delete-post-comment":
                return deletePostComment(request)

    if request.method == "POST":
        # Toggle Post Like
        if request.headers.get("X-Requested-Action") == "toggle-post-like":
            return togglePostLike(request)

        # Report Post
        if request.headers.get("X-Requested-Action") == "report-post":
            return reportPost(request)

        # Toggle Post Save
        if request.headers.get("X-Requested-Action") == "toggle-post-save":
            return togglePostSave(request)

        # Report Comment
        if request.headers.get("X-Requested-Action") == "report-post-comment":
            return reportPostComment(request)

        # Add Comment
        if request.headers.get("X-Requested-Action") == "add-comment":
            return addComment(request)

        # Toggle Post Comment Like
        if request.headers.get("X-Requested-Action") == "toggle-post-comment-like":
            return togglePostCommentLike(request)

    # Gets The Post With All Related Data
    post = Post.objects.filter(
        id=post_id
    ).annotate(
        views=Count("seen_by_instances", distinct=True),

        # Creates The Has Like Column (True If The User Has Already Liked The Post)
        has_like=Exists(
            Post.likes_from_users.through.objects.filter(
                post_id=OuterRef("pk"),
                users_id=logged_in_user_id
            )
        ),

        # Creates The Has Save Column (True If The User Has Already Saved The Post)
        has_save=Exists(
            Users.objects.filter(
                id=logged_in_user_id, 
                saved_posts=OuterRef("pk")
            )
        )
    ).prefetch_related(
        "tagged_users", 
        "likes_from_users",

        Prefetch(
            "user",
            queryset=Users.objects.annotate(
                # Creates The Has Follow Column (True If The Logged In User Is Following The User)
                has_follow=Exists(
                    FollowRelation.objects.filter(
                        from_user=logged_in_user_id,
                        to_user=OuterRef("pk"),
                        status="accepted"
                    )
                ) if logged_in_user else Value(False, output_field=BooleanField()),

                # Creates The Has Pending Follow Request Column (True If The Logged In User Has Pending Follow Request)
                has_pending_follow_request=Exists(
                    FollowRelation.objects.filter(
                        from_user=logged_in_user_id,
                        to_user=OuterRef("pk"),
                        status="pending"
                    )
                ) if logged_in_user else Value(False, output_field=BooleanField())
            ).prefetch_related(
                # Gets All Followers With All Related Data
                Prefetch(
                    "follower_relations",
                    queryset=FollowRelation.objects.filter(status="accepted").select_related("from_user"),
                    to_attr="accepted_followers"
                ),
                
                # Gets All Following Users With All Related Data
                Prefetch(
                    "following_relations",
                    queryset=FollowRelation.objects.filter(status="accepted").select_related("to_user"),
                    to_attr="accepted_following"
                )
            )
        ),
        
        Prefetch(
            "media",
            queryset=PostMedia.objects.annotate(
                unique_video_views=Count("video_views", distinct=True) # Gets The Unique Viewers Amount
            ).annotate(
                # Calculates The Average Watch Time Per 1 Viewer
                average_watch_time_per_viewer=Case(
                    When(unique_video_views=0, then=Value(0.0)),
                    default=Cast(F("total_watch_time"), FloatField()) / Cast(F("unique_video_views"), FloatField()),
                    output_field=FloatField()
                )
            ).order_by("order")
        ),

        Prefetch(
            "comments",
            queryset=PostForum.objects.exclude(
                status="hidden"
            ).annotate(
                # Creates The Has Like Column (True If The User Has Already Liked The Comment)
                has_like=Exists(
                    PostForum.likes_from_users.through.objects.filter(
                        postforum_id=OuterRef("pk"),
                        users_id=logged_in_user_id
                    )
                ),

                # Creates The Has Report Column (True If The User Has Already Reported The Comment)
                has_report=Exists(
                    PostForum.reports_from_users.through.objects.filter(
                        postforum_id=OuterRef("pk"),
                        user_id=logged_in_user_id
                    )
                ),

                # Creates The Is Liked By Author Column (True If The Comment Obtained Like From The Author Of The Post)
                is_liked_by_author=Exists(
                    PostForum.likes_from_users.through.objects.filter(
                        postforum_id=OuterRef("pk"),
                        users_id=OuterRef("post__user_id")
                    )
                )
            ).select_related(
                "user"
            ).order_by(
                "-creation_time"
            ),
            to_attr="visible_comments"
        )
    ).first()

    if post != None:
        # Splits Comments Into Parent And Child Comments
        comments_by_parent = defaultdict(list)
        
        for one_comment in post.visible_comments:
            comments_by_parent[one_comment.parent_id].append(one_comment)
        
        post.nested_comments = dict(comments_by_parent)
        post.root_comments = comments_by_parent[None]

        # Gets The Tagged Users From The Post In JSON Format
        post.tagged_users_json = json.dumps(
            list(post.tagged_users.values_list("username", flat=True))
        )

        if post.coordinates:
            post.location = post.location.replace(",", "<span></span>")
            post.latitude = str(post.coordinates.y).replace(",", ".")
            post.longitude = str(post.coordinates.x).replace(",", ".")

        if logged_in_user:
            return render(request, "app/post.html", {
                "logged_in_user": {
                    "id": logged_in_user.id,
                    "username": logged_in_user.username,
                    "role": logged_in_user.role,
                    "profile_picture_name": logged_in_user.profile_picture_name,
                    "data_saving_mode": logged_in_user.data_saving_mode
                },

                "post": post
            })

        else:
            return render(request, "app/post.html", {
                "post": post
            })

    if logged_in_user:
        return render(request, "app/post.html", {
            "logged_in_user": {
                "username": logged_in_user.username,
                "profile_picture_name": logged_in_user.profile_picture_name
            }
        })

    return render(request, "app/post.html")

def profileView(request, username):
    logged_in_user_id = None # Default State When The User Isn't Logged In
    logged_in_user = None # Default State When The User Isn't Logged In

    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id") # Gets The Logged In User ID
        logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets The Logged In User

    is_found = False # Stores The Information If The User Was Found

    if request.method == "POST":
        # Toggle Follow
        if request.headers.get("X-Requested-Action") == "toggle-follow":
            return toggleFollow(request)

    # Checks If The Profile With Searched Username Exists
    if Users.objects.filter(username=username).exists():
        is_found = True # Stores The Information That The User Was Found

        # Gets The User By Username
        user = Users.objects.filter(
            username=username
        ).annotate(
            # Creates The Has Follow Column (True If The Logged In User Is Following The User)
            has_follow=Exists(
                FollowRelation.objects.filter(
                    from_user=logged_in_user_id,
                    to_user=OuterRef("pk"),
                    status="accepted"
                )
            ) if logged_in_user else Value(False, output_field=BooleanField()),

            # Creates The Has Pending Follow Request Column (True If The Logged In User Has Pending Follow Request)
            has_pending_follow_request=Exists(
                FollowRelation.objects.filter(
                    from_user=logged_in_user_id,
                    to_user=OuterRef("pk"),
                    status="pending"
                )
            ) if logged_in_user else Value(False, output_field=BooleanField())
        ).first()

        # Gets All Followers With All Related Data
        followers = FollowRelation.objects.filter(
            to_user=user, 
            status="accepted"
        ).select_related("from_user")

        # Gets All Following Users With All Related Data
        following = FollowRelation.objects.filter(
            from_user=user, 
            status="accepted"
        ).select_related("to_user")

        today = timezone.now().date() # Determines Today's Date

        # Creates The Has Already Increased Activity Streak Column (True If The User Already Has)
        if user.last_activity_streak_increase_time:
            user.has_already_increased_activity_streak = user.last_activity_streak_increase_time.date() == today

        else:
            user.has_already_increased_activity_streak = False

        # Gets All User's Posts With All Related Data
        posts = Post.objects.filter(
            user_id=user.id
        ).prefetch_related(
            Prefetch(
                "user",
                queryset=Users.objects.annotate(
                    # Creates The Has Follow Column (True If The Logged In User Is Following The User)
                    has_follow=Exists(
                        FollowRelation.objects.filter(
                            from_user=logged_in_user_id,
                            to_user=OuterRef("pk"),
                            status="accepted"
                        )
                    ) if logged_in_user else Value(False, output_field=BooleanField())
                )
            ),

            Prefetch(
                "media",
                queryset=PostMedia.objects.order_by("order")
            )
        ).exclude(
            media__is_processed=False
        ).order_by(
            "-created_at"
        ).distinct()

        # If The User Is Logged In
        if logged_in_user_id:
            logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets The Logged In User

            # If Searched Profile Belongs To The Logged In User
            if logged_in_user == user:
                saved_posts = logged_in_user.saved_posts.all().select_related(
                    "user"
                ).prefetch_related(
                    "media"
                ).order_by(
                    "-created_at"
                ).distinct()

                if request.method == "POST":
                    # If Logged In User Has Private Account
                    if logged_in_user.private_account:
                        # Approve Follow Request
                        if request.headers.get("X-Requested-Action") == "approve-follow-request":
                            try:
                                follow_request_id = json.loads(request.body) # Gets The Follow Request ID

                                # Gets The Follow Request
                                follow_request = FollowRelation.objects.filter(
                                    id=follow_request_id,
                                    to_user=logged_in_user, 
                                    status="pending"
                                ).first()

                                follow_request.status = "accepted" # Accepts The Follow Request

                                follow_request.save() # Saves The Updated Follow Request

                                return JsonResponse({
                                    "success": True, 
                                    "message": _("Žiadosť o sledovanie bola úspešne potvrdená.")
                                }, status=200)

                            except Exception as e:
                                captureError(f"An error occurred while accepting the follow request.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                                return JsonResponse({
                                    "success": False, 
                                    "message": _("Pri potvrdení žiadosti o sledovanie došlo k chybe.")
                                }, status=500)

                        # Reject Follow Request
                        if request.headers.get("X-Requested-Action") == "reject-follow-request":
                            try:
                                follow_request_id = json.loads(request.body) # Gets The Follow Request ID

                                # Gets The Follow Request
                                follow_request = FollowRelation.objects.filter(
                                    id=follow_request_id,
                                    to_user=logged_in_user, 
                                    status="pending"
                                ).first()

                                follow_request.delete() # Removes The Follow Request

                                return JsonResponse({
                                    "success": True, 
                                    "message": _("Žiadosť o sledovanie bola zamietnutá.")
                                }, status=200)

                            except Exception as e:
                                captureError(f"An error occurred while rejecting the follow request.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                                return JsonResponse({
                                    "success": False, 
                                    "message": _("Pri zamietnutí žiadosti o sledovanie došlo k chybe.")
                                }, status=500)

                    # Edit Account Form
                    if request.POST.get("edit_account_form_submit"):
                        edit_account_form = editAccountForm(request.POST, request.FILES) # Gets The Edit Account Form

                        if edit_account_form.is_valid():
                            delete_account = edit_account_form.cleaned_data["delete_account"]

                            try:
                                if delete_account:
                                    sendMail(
                                        logged_in_user,
                                        _("Odstránenie účtu"), # Subject
                                        _("dostali sme žiadosť o odstránenie vášho účtu. V prípade chyby máte 30 dní možnosť prihlásiť sa.\n\n%(domain)s%(language)s/prihlasenie/\n\nV opačnom prípade bude váš účet neodvratne odstránený.\nTím Wesiq.") % {"domain": settings.DOMAIN_URL, "language": logged_in_user.language}, # Text Content
                                        _('dostali sme žiadosť o odstránenie vášho účtu. V prípade chyby máte 30 dní možnosť <a href="%(domain)s%(language)s/prihlasenie/" title="Prihlásiť sa" target="_blank">prihlásiť sa</a>. V opačnom prípade bude váš účet neodvratne odstránený.') % {"domain": settings.DOMAIN_URL, "language": logged_in_user.language}, # HTML Content
                                        _("Tento e-mail prosím ignorujte, slúži len pre Vaše informovanie."), # End Of HTML Content
                                    )

                                    logged_in_user.account_status = "suspended" # Changes Account Status
                                    logged_in_user.save()

                                    messages.add_message(request, messages.ERROR, _("Účet %(first_name)s %(last_name)s bol odstránený") % {"first_name": logged_in_user.first_name, "last_name": logged_in_user.last_name})
                                    captureLogin(f"{logged_in_user.first_name} {logged_in_user.last_name}'s account status has been changed to suspended.\n\t- URL: {request.build_absolute_uri()}\n\t- User ID: {logged_in_user_id},\n\t- IP Address: {getClientIp(request)}\n")

                                    del request.session["logged_in_user_id"] # Deletes Previous User ID Session If Was Logged In

                                    return HttpResponseRedirect(reverse("homepage_url"))

                                if logged_in_user.last_edit == None or timezone.now() - logged_in_user.last_edit >= timedelta(days=7):
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

                                    delete_profile_picture = edit_account_form.cleaned_data["delete_profile_picture"] # Gets The Delete Profile Picture Hidden Checkbox Value

                                    if delete_profile_picture:
                                        current_profile_picture_name = logged_in_user.profile_picture_name
                                        path = os.path.join(settings.MEDIA_ROOT, f"images/{str(logged_in_user_id)}")
                                        os.remove(f"{path}/{current_profile_picture_name}")

                                        logged_in_user.profile_picture_name = ""

                                        logged_in_user.last_edit = timezone.now()

                                    data_saving_mode = edit_account_form.cleaned_data["data_saving_mode"] # Gets The Data Saving Mode Hidden Checkbox Value
                                    private_account = edit_account_form.cleaned_data["private_account"] # Gets The Private Account Hidden Checkbox Value

                                    if logged_in_user.data_saving_mode != data_saving_mode:
                                        logged_in_user.data_saving_mode = data_saving_mode

                                    if logged_in_user.private_account != private_account:
                                        was_private = logged_in_user.private_account # Checks If The Account Was Private Before Change

                                        logged_in_user.private_account = private_account # Switch The Account To Private Or Public

                                        # If The Account Was Private And Now Is Public
                                        if was_private and not private_account:
                                            # Updates All Follow Requests From Pending To Accepted
                                            FollowRelation.objects.filter(
                                                to_user=logged_in_user,
                                                status="pending"
                                            ).update(status="accepted")

                                    if logged_in_user.bio != edit_account_form.cleaned_data["bio"] and edit_account_form.cleaned_data["bio"] != "":
                                        logged_in_user.bio = edit_account_form.cleaned_data["bio"]
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

                                    logged_in_user.save() # Updates The Logged In User

                                    bio_links_json = request.POST.get("bio_links") # Gets The User's Bio Links In JSON Format

                                    try:
                                        bio_links_list = json.loads(bio_links_json) if bio_links_json else [] # Converts The Bio Links To The Python List Format

                                        with transaction.atomic():
                                            BioLinks.objects.filter(user=logged_in_user).delete() # Deletes All Previous User's Bio Links

                                            new_bio_links = [] # Stores The New Bio Links
                                            
                                            # Removes White Spaces From Every URL
                                            for one_url in bio_links_list:
                                                one_url = one_url.strip()
                                                if not one_url:
                                                    continue

                                                new_bio_links.append(
                                                    BioLinks(
                                                        user=logged_in_user,
                                                        url=one_url
                                                    )
                                                )

                                            # Bulk Creation Of Multiple User's Bio Links
                                            if new_bio_links:
                                                BioLinks.objects.bulk_create(new_bio_links)

                                    # Invalid Bio Links JSON Format
                                    except json.JSONDecodeError:
                                        messages.add_message(request, messages.ERROR, _("Pri spracovávaní vlastných odkazov došlo k chybe"))
                                        captureError(f"An error occurred while loading bio links from the JSON format.\n\t- URL: {request.build_absolute_uri()}\n\t- User ID: {logged_in_user_id},\n\t- IP Address: {getClientIp(request)}\n")

                                    messages.add_message(request, messages.SUCCESS, _("Zmeny boli uložené"))

                                    return HttpResponseRedirect(reverse("homepage_url"))

                                else:
                                    messages.add_message(request, messages.ERROR, _("Ďalšie úpravy budú možné %(next_edit_time)s") % {"next_edit_time": (logged_in_user.last_edit + timedelta(days=30)).strftime('%d.%m. %Y')})

                            # Error
                            except Exception as e:
                                messages.add_message(request, messages.ERROR, _("Pri vykonávaní zmien v účte došlo k chybe"))
                                captureError(f"An error occurred while making changes to your account.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")
                        
                        # Wrong Form
                        else:
                            messages.add_message(request, messages.ERROR, _("Zmeny sa nepodarilo vykonať"))
                            captureError(f"Changes could not be made while editing account.\n\t- URL: {request.build_absolute_uri()}\n\t- User ID: {logged_in_user_id},\n\t- IP Address: {getClientIp(request)}\n")

                        return HttpResponseRedirect(reverse("profile_url", kwargs={"username": user.username}))

                    # Remove Follower
                    if request.headers.get("X-Requested-Action") == "remove-follower":
                        try:
                            removed_follower_id = json.loads(request.body) # Gets The Removed Follower ID
                            removed_follower = Users.objects.get(id=removed_follower_id) # Gets The Removed Follower

                            # Removes The Follower
                            FollowRelation.objects.filter(
                                from_user=removed_follower,
                                to_user=logged_in_user
                            ).delete()

                            return JsonResponse({
                                "success": True, 
                                "message": _("Sledovateľ bol odstránený.")
                            }, status=200)

                        except Exception as e:
                            captureError(f"An error occurred while removing the follower.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                            return JsonResponse({
                                "success": False, 
                                "message": _("Pri odstraňovaní sledovateľa došlo k chybe.")
                            }, status=404)
                
                if request.GET.get("password-reset"):
                    code = generateCode() # Generates Random 6-Digit Code

                    sendMail(
                        logged_in_user,
                        _("Obnova hesla"), # Subject
                        _("dostali sme žiadosť o obnovenie hesla k vášmu účtu. Ak ste to boli vy, prosím použite nasledujúci odkaz a zadajte nasledovný overovací kód.\n\n%(domain)s%(language)s/obnova-hesla?password-reset-code=%(code)s - %(code)s\n\nAk ste o obnovu hesla nežiadali, tento e-mail prosím ignorujte.\nTím Wesiq.") % {"domain": settings.DOMAIN_URL, "language": logged_in_user.language, "code": code}, # Text Content
                        _('dostali sme žiadosť o obnovenie hesla k vášmu účtu. Ak ste to boli vy, prosím použite <a href="%(domain)s%(language)s/obnova-hesla?password-reset-code=%(code)s" title="Obnoviť heslo" target="_blank">tento</a> odkaz a zadajte nasledovný overovací kód.') % {"domain": settings.DOMAIN_URL, "language": logged_in_user.language, "code": code}, # HTML Content
                        _('Ak ste o obnovu hesla nežiadali, tento e-mail prosím ignorujte.'), # End Of HTML Content
                        code
                    )

                    # Saves Password Reset Code To Database
                    logged_in_user.password_reset_code = code
                    logged_in_user.save()

                    messages.add_message(request, messages.SUCCESS, _("Overovací kód bol odoslaný na adresu\n%(email_address)s") % {"email_address": logged_in_user.email_address})

                    # Redirect After Sending Mail
                    response = HttpResponseRedirect(reverse("password_reset_url"))
                    # response["Location"] += f"?password-reset-code={code}" # Add Parameter With Code To URL
                    return response

                if logged_in_user.private_account:
                    # Gets All Follow Requests With All Related Data
                    follow_requests = FollowRelation.objects.filter(
                        to_user=logged_in_user, 
                        status="pending"
                    ).select_related("from_user")

                filled_edit_account_form = editAccountForm(initial={
                    "bio": logged_in_user.bio,
                    "first_name": logged_in_user.first_name,
                    "last_name": logged_in_user.last_name,
                    "email_address": logged_in_user.email_address,
                    "phone_number": logged_in_user.phone_number,
                    "data_saving_mode": logged_in_user.data_saving_mode,
                    "private_account": logged_in_user.private_account
                })

                return render(request, "app/profile.html", {
                    "is_found": is_found,

                    "logged_in_user": {
                        "id": logged_in_user.id,
                        "username": logged_in_user.username,
                        "email_address": logged_in_user.email_address,
                        "profile_picture_name": logged_in_user.profile_picture_name,
                        "friend_code": logged_in_user.friend_code,
                        "bio_links": logged_in_user.bio_links,
                        "private_account": logged_in_user.private_account,
                        "follow_requests": follow_requests if logged_in_user.private_account else None
                    },

                    "user": user,
                    "followers": followers,
                    "following": following,
                    "edit_account_form": filled_edit_account_form,
                    "bio_links_form": bioLinksForm,
                    "posts": posts,
                    "saved_posts": saved_posts
                })

            else:
                # Gets The Unread Messages Amount
                unread_messages_amount = Chat.objects.filter(
                    sender=user,
                    receiver=logged_in_user,
                    is_read=False
                ).count()

                if request.method == "POST":
                    # Report User
                    if request.headers.get("X-Requested-Action") == "report-user":
                        try:
                            report_user_data = json.loads(request.body) # Gets The Report User Data
                            reported_user_id = report_user_data["reported_user_id"] # Gets The Reported User ID
                            reason = report_user_data["reason"] # Gets The Reason
                            reported_user = Users.objects.get(id=reported_user_id) # Gets The Reported User
                            has_report = reported_user.reports_received.filter(reporting_user_id=logged_in_user_id).exists() # Checks If The Logged In User Has Already Reported The User

                            # Stores The Reported Comment
                            UsersReport.objects.update_or_create(
                                reported_user_id=reported_user_id,
                                reporting_user_id=logged_in_user_id,
                                defaults={"reason": reason} # Reason Can Be Updated
                            )

                            if not has_report:
                                reported_user.reports += 1 # Increases The Reports Counter

                                if reported_user.reports >= 5:
                                    followers_amount = reported_user.followers.count() # Gets The Amount Of Followers Of The Reported User

                                    if followers_amount > 0:
                                        report_percentage = (reported_user.reports / followers_amount) * 100

                                    else:
                                        report_percentage = 100 

                                    if report_percentage > 10:
                                        reported_user.account_status = "suspended" # Suspends The User If Has More Than 10% Of Reports
                                        reported_user.suspension_time = timezone.now() # Updates The Suspension Time

                                        sendMail(
                                            reported_user,
                                            _("Odstavenie účtu"), # Subject
                                            _("oznamujeme vám, že Váš účet bol odstavený na základe vysokého počtu obdržaných nahlásení. V prípade chyby máte 7 dní možnosť odvolať sa cez kontaktný formulár.\n\n%(domain)s%(language)s/\n\nV opačnom prípade bude váš účet neodvratne odstránený.\nTím Wesiq.") % {"domain": settings.DOMAIN_URL, "language": reported_user.language}, # Text Content
                                            _('oznamujeme vám, že Váš účet bol odstavený na základe vysokého počtu obdržaných nahlásení. V prípade chyby máte 7 dní možnosť odvolať sa cez <a href="%(domain)s%(language)s/" title="Odvolať sa" target="_blank">kontaktný formulár</a>. V opačnom prípade bude váš účet neodvratne odstránený.') % {"domain": settings.DOMAIN_URL, "language": reported_user.language}, # HTML Content
                                            _("Tento e-mail prosím ignorujte, slúži len pre Vaše informovanie."), # End Of HTML Content
                                        )

                                reported_user.save() # Saves The Updated User

                            return JsonResponse({
                                "success": True, 
                                "message": _("Nahlásenie bolo úspešne odoslané.")
                            }, status=200)

                        except Exception as e:
                            captureError(f"An error occurred while submitting the report.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

                            return JsonResponse({
                                "success": False, 
                                "message": _("Pri odosielaní nahlásenia došlo k chybe.")
                            }, status=500)

                    # Suspend User
                    if request.headers.get("X-Requested-Action") == "suspend-user":
                        try:
                            if logged_in_user.role == "developer" or logged_in_user.role == "admin":
                                user_id = json.loads(request.body) # Gets The Suspended User ID
                                user = Users.objects.get(id=user_id) # Gets The User

                                user.account_status = "suspended" # Changes Account Status
                                user.suspension_time = timezone.now() # Updates The Suspension Time
                                user.save() # Saves The Updated User

                                sendMail(
                                    user,
                                    _("Odstavenie účtu"), # Subject
                                    _("oznamujeme vám, že Váš účet bol odstavený na základe manuálnej kontroli. V prípade chyby máte 7 dní možnosť odvolať sa cez kontaktný formulár.\n\n%(domain)s%(language)s/\n\nV opačnom prípade bude váš účet neodvratne odstránený.\nTím Wesiq.") % {"domain": settings.DOMAIN_URL, "language": user.language}, # Text Content
                                    _('oznamujeme vám, že Váš účet bol odstavený na základe manuálnej kontroli. V prípade chyby máte 7 dní možnosť odvolať sa cez <a href="%(domain)s%(language)s/" title="Odvolať sa" target="_blank">kontaktný formulár</a>. V opačnom prípade bude váš účet neodvratne odstránený.') % {"domain": settings.DOMAIN_URL, "language": user.language}, # HTML Content
                                    _("Tento e-mail prosím ignorujte, slúži len pre Vaše informovanie."), # End Of HTML Content
                                )

                                return JsonResponse({
                                    "success": True, 
                                    "message": _("Užívateľ bol obmedzený.")
                                }, status=200)

                            return JsonResponse({
                                "success": False, 
                                "message": _("Užívateľa môže obmedziť len správca.")
                            }, status=400)

                        except Exception as e:
                            captureError(f"An error occurred while suspending the user.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")
                            
                            return JsonResponse({
                                "success": False, 
                                "message": _("Pri pokuse o obmedzenie užívateľa došlo k chybe.")
                            }, status=500)

                return render(request, "app/profile.html", {
                    "is_found": is_found,

                    "logged_in_user": {
                        "username": logged_in_user.username,
                        "role": logged_in_user.role,
                        "profile_picture_name": logged_in_user.profile_picture_name
                    },

                    "user": user,
                    "followers": followers,
                    "following": following,
                    "unread_messages_amount": unread_messages_amount,
                    "posts": posts
                })
        
        return render(request, "app/profile.html", {
            "is_found": is_found,
            "user": user,
            "followers": followers,
            "following": following,
            "posts": posts
        })

    if logged_in_user:
        return render(request, "app/profile.html", {
            "is_found": is_found,

            "logged_in_user": {
                "username": logged_in_user.username,
                "profile_picture_name": logged_in_user.profile_picture_name
            }
        })

    return render(request, "app/profile.html", {
        "is_found": is_found
    })

def chatView(request, username):
    logged_in_user_id = None # Default State When The User Isn't Logged In
    logged_in_user = None # Default State When The User Isn't Logged In

    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id") # Gets The Logged In User ID
        logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets The Logged In User (Sender)

        # Checks If The Profile With Searched Username Exists
        if Users.objects.filter(username=username).exists():
            receiver = Users.objects.filter(username=username).first() # Gets The User By Username (Receiver)

            # Gets All Sender's And Receiver's Chats
            chats = Chat.objects.filter(
                Q(sender=logged_in_user) & Q(receiver=receiver) | 
                Q(sender=receiver)
            ).annotate(
                # Creates The Is Sender Column (True If The Logged In User Is The Sender)
                is_sender=Case(
                    When(sender=logged_in_user, then=True),
                    default=False,
                    output_field=BooleanField()
                )
            ).prefetch_related(
                "message_reactions__user"
            ).order_by(
                "-created_at"
            )

            return render(request, "app/chat.html", {
                "logged_in_user": {
                    "id": logged_in_user.id,
                    "username": logged_in_user.username,
                    "profile_picture_name": logged_in_user.profile_picture_name
                },

                "receiver": receiver,
                "chats": chats
            })

        raise Http404("Užívateľ sa nenašiel.")

    raise Http404("Nie si prihlásený.")

@require_POST
def updateVideoWatchTime(request):
    logged_in_user_id = None # Default State When The User Isn't Logged In
    logged_in_user = None # Default State When The User Isn't Logged In

    if "logged_in_user_id" in request.session:
        logged_in_user_id = request.session.get("logged_in_user_id") # Gets The Logged In User ID
        logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets The Logged In User

        post_media_id = request.POST.get("post_media_id") # Gets The Post Media ID
        watch_time = request.POST.get("watch_time") # Gets The Watch Time

        if not post_media_id or not watch_time:
            return JsonResponse({
                "success": False, 
                "message": _("Nepodarilo sa získať potrebné dáta pre zaznamenanie času pozerania videa.")
            }, status=400)

        try:
            # Gets The Video Author's ID
            author_id = PostMedia.objects.filter(id=post_media_id).values_list(
                "post__user_id", flat=True
            ).first()

            # If The Video Doesn't Belong To The Logged In User
            if(author_id != logged_in_user_id):
                # Updates The Total Watch Time Of The Video
                PostMedia.objects.filter(id=post_media_id).update(
                    total_watch_time=Coalesce(F("total_watch_time"), Value(0.0)) + float(watch_time) # If The Watch Time Is Null, Replaces Null With 0.0
                )

                # Adds The User's First Video View
                VideoView.objects.get_or_create(
                    post_media_id=post_media_id,
                    user=logged_in_user
                )

                return JsonResponse({
                    "success": True, 
                    "message": _("Celkový čas pozerania videa bol úspešne zaznamenaný.")
                }, status=200)

            else:
                return JsonResponse({
                    "success": True, 
                    "message": _("Celkový čas pozerania videa nie je možné navýšiť vlastnému príspevku.")
                }, status=200)

        except Exception as e:
            captureError(f"An error occurred while recording the video watch time.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

            return JsonResponse({
                "success": False, 
                "message": _("Pri zaznamenávaní času pozerania videa došlo k chybe.")
            }, status=500)

    return JsonResponse({
        "success": False, 
        "message": _("Celkový čas pozerania nie je možné zaznamenať bez prihlásenia.")
    }, status=401)