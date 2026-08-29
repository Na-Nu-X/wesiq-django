from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from django.db.models import F, Exists, OuterRef, Value, BooleanField, Prefetch
from django.utils.translation import gettext as _
from django.utils import translation
from app.models import Users, FollowRelation, SpecialBadges, UserDailyOfficialTasks, UsersReport, Activity, Reviews, ReviewReport, Articles, ArticleRating, ArticleForum, ArticleForumReport, TrainingPlan, Exercises, OfficialTasks, CustomTasks, Transactions, Subscription, Post, PostReport, PostMedia, SeenPost, VideoView, PostForum, PostForumReport, BioLinks, Chat, MessageReaction, ContactMessage
from ..tasks import compressImage, compressVideo
from .serializers import UserSerializer
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
from django.db.models import Exists, OuterRef, Case, When, BooleanField, Count, Subquery, FloatField
from django.core.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from django_ratelimit.decorators import ratelimit
from django_ratelimit.core import get_usage
from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta, datetime
from django.db.models.functions import TruncDate, Mod, Cast, Coalesce
from django.core.paginator import Paginator 
import json
from celery import current_app
import os
from itertools import chain
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from moviepy import VideoFileClip
import magic
from django.contrib.gis.geos import Point
from django.db import transaction
import tempfile
from celery.result import AsyncResult
import string, random
from django.core.mail import EmailMultiAlternatives
import math
from django.db.models import Sum, Avg
from django.db.models import F, IntegerField, ExpressionWrapper, Value
import random, requests, os, secrets, mimetypes
from pathlib import Path
from django.core.files.storage import FileSystemStorage
from django.core.cache import cache
from django.http import FileResponse
from collections import defaultdict

# Function For Capture The Error
def captureError(message):
    with open(f"{settings.LOGS_DIR}/error.log", mode="a", encoding="utf-8") as file:
        # timezone.LocalTimezone
        file.write(f"[{timezone.now().strftime("%d.%m. %Y %X %Z")}] - {message}\n")

# Function For Capture The Login
def captureLogin(message):
    with open(f"{settings.LOGS_DIR}/login.log", mode="a", encoding="utf-8") as file:
        # timezone.LocalTimezone
        file.write(f"[{timezone.now().strftime("%d.%m. %Y %X %Z")}] - {message}\n")

# Function For Get The Client IP
def getClientIp(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()

    else:
        ip = request.META.get('REMOTE_ADDR')

    return ip

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

# Function For Send The Mail
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

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate="3/m", method="POST", block=False)
def login(request):
    try:
        identifier = request.data.get("identifier", "") # Gets The Identifier
        password = request.data.get("password", "") # Gets The Password

        was_limited = getattr(request, "limited", False)

        if was_limited:
            captureError(f"Too many login attempts.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

            return Response({
                "success": False, 
                "message": str(_("Príliš veľa pokusov!\nSkúste to opäť za minútu."))
            }, status=200)

        try:
            user = Users.objects.get(
                Q(username__iexact=identifier) |
                Q(email_address__iexact=identifier)
            )

            if check_password(password, user.password):
                user.last_login = timezone.now() # Stores Last Login Time
                user.account_status = "OK"
                user.save()

                refresh = RefreshToken.for_user(user)

                captureLogin(f"Successful Login to the Account\n\t- User ID: {user.id},\n\t- E-mail Address: {identifier},\n\t- IP Address: {getClientIp(request)}\n")

                return Response({
                    "success": True, 
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "message": str(_("Úspešne prihlásený ako %(username)s") % {"username": user.username})
                }, status=200)
            
            else: # Wrong Password
                captureError(f"Incorrect login credentials (wrong password).\n\t- URL: {request.build_absolute_uri()}\n\t- Identifier: {identifier},\n\t- IP Address: {getClientIp(request)}\n")

                return Response({
                    "success": False, 
                    "message": str(_("Nesprávne prihlasovacie údaje"))
                }, status=200)
        
        # Wrong Identifier
        except Users.DoesNotExist as e:
            captureError(f"Incorrect login credentials (unregistered username or e-mail address).\n\t- URL: {request.build_absolute_uri()}\n\t- Identifier: {identifier},\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

            return Response({
                "success": False, 
                "message": str(_("Nesprávne prihlasovacie údaje"))
            }, status=200)

        # Error
        except Exception as e:
            captureError(f"An error occurred while logging in.\n\t- URL: {request.build_absolute_uri()}\n\t- Identifier: {identifier},\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

            return Response({
                "success": False, 
                "message": str(_("Pri prihlasovaní došlo k chybe"))
            }, status=200)
    
    except Exception as e:
        captureError(f"An error occurred while logging in.\n\t- URL: {request.build_absolute_uri()}\n\t- Identifier: {identifier},\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri prihlasovaní došlo k chybe"))
        }, status=200)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def register(request):
    try:
        first_name = request.data.get("first_name") # Gets The First Name
        last_name = request.data.get("last_name") # Gets The Last Name
        username = request.data.get("username") # Gets The Username
        email_address = request.data.get("email_address") # Gets The E-mail Address
        phone_number = request.data.get("phone_number") # Gets The Phone Number
        password = request.data.get("password") # Gets The Password
        password_check = request.data.get("password_check") # Gets The Password Check
        language = request.data.get("language") # Gets The Language

        # E-mail Address Already In Use
        if Users.objects.filter(email_address=email_address).exists():
            captureError(f"This e-mail is already registered.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

            return Response({
                "success": False, 
                "message": str(_("Tento e-mail už je zaregistrovaný"))
            }, status=400)

        # Username Already In Use
        elif Users.objects.filter(username=username).exists():
            return Response({
                "success": False, 
                "message": str(_("Toto používateľské meno je už obsadené"))
            }, status=400)

        elif password != password_check:
            return Response({
                "success": False, 
                "message": str(_("Heslá sa nezhodujú"))
            }, status=400)

        elif len(password) < 8:
            return Response({
                "success": False, 
                "message": str(_("Heslo je príliš krátke"))
            }, status=400)

        else:
            verification_code = generateCode() # Generates Random 6-Digit Code

            clean_phone_number = "".join(phone_number.split()) # Gets Phone Number With No White Spaces

            new_user = Users(
                first_name = first_name,
                last_name = last_name,
                username = username,
                email_address = email_address,
                phone_number = clean_phone_number,
                password = make_password(password),
                language = language,
                verification_code = verification_code,
                is_registered_with_app = True
            )

            new_user.save()

            # Deletes Previous User ID Session If Was Logged In
            if "logged_in_user_id" in request.session:
                del request.session["logged_in_user_id"]

            sendMail(
                new_user,
                _("Overenie účtu"), # Subject
                _("ďakujeme za Vašu registráciu. Pre dokončenie procesu registrácie a aktiváciu Vášho účtu je potrebné overiť Vašu e-mailovú adresu. Kliknutím na nižšie uvedený odkaz potvrdíte svoj e-mail a budete automaticky prihlásený do svojho nového účtu.\n\n%(domain)s%(language)s?verification-code=%(verification_code)s&id=%(id)s\n\nTento odkaz je platný nasledujúcich 24 hodín. Po uplynutí tohto času bude z bezpečnostných dôvodov potrebné registráciu zopakovať. Ak ste registráciu nevykonali Vy, tento e-mail prosím ignorujte.\nTím Wesiq.") % {"domain": settings.DOMAIN_URL, "language": language, "verification_code": verification_code, "id": new_user.id}, # Text Content
                _('ďakujeme za Vašu registráciu. Pre dokončenie procesu registrácie a aktiváciu Vášho účtu je potrebné overiť Vašu e-mailovú adresu. Kliknutím na <a href="%(domain)s%(language)s?verification-code=%(verification_code)s&id=%(id)s" title="Dokončiť registráciu" target="_blank">tento</a> odkaz potvrdíte svoj e-mail a budete automaticky prihlásený do svojho nového účtu. Tento odkaz je platný nasledujúcich 24 hodín. Po uplynutí tohto času bude z bezpečnostných dôvodov potrebné registráciu zopakovať.') % {"domain": settings.DOMAIN_URL, "language": language, "verification_code": verification_code, "id": new_user.id}, # HTML Content
                _("Ak ste registráciu nevykonali Vy, tento e-mail prosím ignorujte."), # End Of HTML Content
            )

            return Response({
                "success": True, 
                "message": str(_("Potvrdte vašu e-mailovú adresu\n%(email_address)s") % {"email_address": email_address})
            }, status=200)

    # Error
    except Exception as e:
        captureError(f"An error occurred during registration.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri registrácii došlo k chybe"))
        }, status=500)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_logged_in_user(request):
    logged_in_user = request.user # Gets The Logged In User
    logged_in_user_id = logged_in_user.id # Gets The Logged In User ID

    logged_in_user_object = Users.objects.filter(
        id=logged_in_user_id
    ).select_related(
        "subscription"
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
    ).first()

    follow_requests = None # Stores The Follow Requests

    if logged_in_user_object.private_account:
        # Gets All Follow Requests With All Related Data
        follow_requests = FollowRelation.objects.filter(
            to_user=logged_in_user, 
            status="pending"
        ).select_related("from_user")

    if not logged_in_user_object:
        return Response({
            "success": False, 
            "message": str(_("Používateľ sa nenašiel."))
        }, status=404)

    subscription = None # Stores The Subscription Data

    if hasattr(logged_in_user_object, "subscription") and logged_in_user_object.subscription:
        subscription = {
            "is_active": logged_in_user_object.subscription.is_active
        }

    # Creates Valid Format Of Users For JSON Response
    logged_in_user_data = {
        "id": logged_in_user_object.id,
        "first_name": logged_in_user_object.first_name,
        "last_name": logged_in_user_object.last_name,
        "username": logged_in_user_object.username,
        "role": logged_in_user_object.role,
        "profile_picture_name": logged_in_user_object.profile_picture_name,
        "friend_code": logged_in_user_object.friend_code,
        "saved_posts": list(logged_in_user_object.saved_posts.values_list("id", flat=True)),
        "private_account": logged_in_user_object.private_account,
        "follow_requests": follow_requests if logged_in_user.private_account else None,
        "followers_amount": len(logged_in_user_object.accepted_followers),
        "subscription": subscription,
        "data_saving_mode": logged_in_user_object.data_saving_mode
    }

    return Response({
        "success": True, 
        "logged_in_user": logged_in_user_data,
        "message": str(_("Prihlásený užívateľ bol úspešne nájdený."))
    }, status=200)

# Community Page

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def load_first_users(request):
    try:
        if request.user.is_authenticated:
            logged_in_user = request.user # Gets The Logged In User
            logged_in_user_id = request.user.id # Gets The Logged In User ID

        else:
            logged_in_user_id = None # Default State When The User Isn't Logged In
            logged_in_user = None # Default State When The User Isn't Logged In

        searched_users_history = request.data if isinstance(request.data, list) else [] # Gets The Searched Users History

        loaded_users_from_history = Users.objects.filter(
            username__in=searched_users_history,
            account_status="OK"
        ).select_related(
            "subscription"
        ).annotate(
            # Creates The Has Follow Column (True If The Logged In User Is Following The User)
            has_follow=Exists(
                FollowRelation.objects.filter(
                    from_user=logged_in_user,
                    to_user=OuterRef("pk"),
                    status="accepted"
                )
            ) if logged_in_user else Value(False, output_field=BooleanField()),

            # Creates The Has Pending Follow Request Column (True If The Logged In User Has Pending Follow Request)
            has_pending_follow_request=Exists(
                FollowRelation.objects.filter(
                    from_user=logged_in_user,
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
        loaded_users_from_history_list.sort(key=lambda user: searched_users_history.index(user.username) if user.username in searched_users_history else 0) # Sorts The Loaded Users From History List By The Original Order In The History

        missing_users_amount = 3 - len(loaded_users_from_history_list) # Gets The Amount Of Missing Users To The Maximum Of 3
        missing_users_list = []

        if missing_users_amount > 0:
            loaded_users_from_history_ids = [u.id for u in loaded_users_from_history_list] # Gets The IDs Of Users In History

            # Gets The Missing Users With OK Account Status, Excludes Logged In User And Orders Them From Newest
            missing_users = Users.objects.filter(
                account_status="OK"
            ).select_related(
                "subscription"
            ).annotate(
                # Creates The Has Follow Column (True If The Logged In User Is Following The User)
                has_follow=Exists(
                    FollowRelation.objects.filter(
                        from_user=logged_in_user,
                        to_user=OuterRef("pk"),
                        status="accepted"
                    )
                ) if logged_in_user else Value(False, output_field=BooleanField()),

                # Creates The Has Pending Follow Request Column (True If The Logged In User Has Pending Follow Request)
                has_pending_follow_request=Exists(
                    FollowRelation.objects.filter(
                        from_user=logged_in_user,
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
            subscription = None

            if hasattr(one_user, "subscription") and one_user.subscription:
                subscription = {
                    "is_active": one_user.subscription.is_active
                }

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
                "has_pending_follow_request": one_user.has_pending_follow_request,
                "subscription": subscription
            })

        return Response({
            "success": True, 
            "users": loaded_users, 
            "message": str(_("Užívatelia boli úspešne načítaný."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while loading the users.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri načítavaní užívateľov došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def search_users(request):
    try:
        if request.user.is_authenticated:
            logged_in_user = request.user # Gets The Logged In User
            logged_in_user_id = request.user.id # Gets The Logged In User ID

        else:
            logged_in_user_id = None # Default State When The User Isn't Logged In
            logged_in_user = None # Default State When The User Isn't Logged In

        searched_text = request.data.get("searched_text", "") # Gets The Searched Text
        
        # Filters Users By Searched Text (Case-Insensitive)
        users = Users.objects.filter(
            Q(account_status="OK") & (
                Q(first_name__icontains=searched_text) | 
                Q(last_name__icontains=searched_text) | 
                Q(username__icontains=searched_text) | 
                Q(friend_code__contains=searched_text)
            )
        ).select_related(
            "subscription"
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
                "has_pending_follow_request": one_user.has_pending_follow_request,

                "subscription": {
                    "is_active": one_user.subscription.is_active
                } if hasattr(one_user, "subscription") and one_user.subscription else None
            }

            for one_user in users
        ]

        return Response({
            "success": True, 
            "users": users, 
            "message": str(_("Užívatelia boli úspešné nájdený."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while searching for users.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri hľadaní užívateľov došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def toggle_post_like(request):
    try:
        logged_in_user = request.user # Gets The Logged In User
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        post_id = request.data.get("post_id") # Gets The Post ID

        if not post_id or not str(post_id).isdigit():
            return Response({
                "success": False, 
                "message": str(_("Príspevok sa nenašiel."))
            }, status=400)

        post = get_object_or_404(Post, id=int(post_id)) # Gets The Post
        has_like = post.likes_from_users.filter(id=logged_in_user_id).exists() # Checks If The User Has Already Liked The Post

        # Like
        if not has_like:
            post.likes_from_users.add(logged_in_user) # Adds The User To Likes From Users In Post
            Post.objects.filter(id=int(post_id)).update(likes = F("likes") + 1) # Increases And Updates The Likes Counter
            post.refresh_from_db(fields=["likes"]) # Reloads The Post

            return Response({
                "success": True, 
                "message": str(_("Označenie páči sa mi to bolo úspešne pridané."))
            }, status=200)

        # Cancel Like
        else:
            post.likes_from_users.remove(logged_in_user) # Removes The User From Likes From Users In Post
            Post.objects.filter(id=int(post_id)).update(likes = F("likes") - 1) # Decreases And Updates The Likes Counter
            post.refresh_from_db(fields=["likes"]) # Reloads The Post

            return Response({
                "success": True, 
                "message": str(_("Označenie páči sa mi to bolo úspešne odstránené."))
            }, status=200)

    except Exception as e:
        captureError(f"An error occurred while changing a like.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri zmene označenia páči sa mi to došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def report_post(request):
    try:
        logged_in_user = request.user # Gets The Logged In User
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        post_id = request.data.get("post_id") # Gets The Post ID
        reason = request.data.get("reason") # Gets The Reason

        if not post_id or not reason:
            return Response({
                "success": False, 
                "message": str(_("Chýbajúce dáta pre nahlásenie."))
            }, status=400)

        post = get_object_or_404(Post, id=int(post_id)) # Gets The Post
        has_report = PostReport.objects.filter(post_id=post.id, user_id=logged_in_user.id).exists() # Checks If The User Has Already Reported The Post

        # Stores The Reported Comment
        PostReport.objects.update_or_create(
            post_id=post_id,
            user_id=logged_in_user_id,
            defaults={"reason": reason} # Reason Can Be Updated
        )

        # Report
        if not has_report:
            Post.objects.filter(id=post.id).update(reports=F("reports") + 1) # Increases The Reports Counter
            post.refresh_from_db() # Reloads The Post

            if post.reports >= 5:
                report_percentage = (post.reports / post.likes * 100) if post.likes > 0 else 100 # Gets The Percentage Of The Post Reports Amount By Likes On The Post

                if report_percentage > 10:
                    post.status = "hidden" # Hides The Post If Has More Than 10% Of Reports
                    post.save(update_fields=["status"]) # Saves The Updated Post

        return Response({
            "success": True, 
            "message": str(_("Nahlásenie bolo úspešne odoslané."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while submitting the report.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri odosielaní nahlásenia došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def toggle_post_save(request):
    try:
        logged_in_user = request.user # Gets The Logged In User

        post_id = request.data.get("post_id") # Gets The Post ID

        if not post_id or not str(post_id).isdigit():
            return Response({
                "success": False, 
                "message": str(_("Príspevok sa nenašiel."))
            }, status=400)

        post = get_object_or_404(Post, id=int(post_id)) # Gets The Post

        has_save = logged_in_user.saved_posts.filter(id=post_id).exists() # Checks If The User Has Already Saved The Post

        # Save
        if not has_save:
            logged_in_user.saved_posts.add(post) # Adds The Post To The User's Saved Posts

            return Response({
                "success": True, 
                "message": str(_("Príspevok bol úspešne uložený."))
            }, status=200)

        # Unsave
        else:
            logged_in_user.saved_posts.remove(post) # Removes The Post From The User's Saved Posts

            return Response({
                "success": True, 
                "message": str(_("Príspevok bol odstránený zo zoznamu uložených."))
            }, status=200)

    except Exception as e:
        captureError(f"An error occurred while changing a save.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri zmene uloženia príspevku došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def report_post_comment(request):
    try:
        logged_in_user = request.user # Gets The Logged In User
        logged_in_user_id = request.user.id # Gets The Logged In User ID
        
        comment_id = request.data.get("comment_id") # Gets The Post Forum ID
        reason = request.data.get("reason") # Gets The Reason

        if not comment_id or not reason:
            return Response({
                "success": False, 
                "message": str(_("Chýbajúce dáta pre nahlásenie."))
            }, status=400)

        comment = get_object_or_404(PostForum, id=int(comment_id)) # Gets The Comment
        has_report = PostForumReport.objects.filter(postforum_id=comment.id, user_id=logged_in_user.id).exists() # Checks If The User Has Already Reported The Comment

        # Stores The Reported Comment
        PostForumReport.objects.update_or_create(
            postforum_id=comment_id,
            user_id=logged_in_user_id,
            defaults={"reason": reason} # Reason Can Be Updated
        )

        # Report
        if not has_report:
            PostForum.objects.filter(id=comment.id).update(reports=F("reports") + 1) # Increases The Reports Counter
            comment.refresh_from_db() # Reloads The Comment

            if comment.reports >= 5:
                post = get_object_or_404(Post, id=comment.post_id) # Gets The Post

                report_percentage = (comment.reports / comment.likes * 100) if post.likes > 0 else 100 # Gets The Percentage Of The Comment Reports Amount By Likes On The Post

                if report_percentage > 10:
                    comment.status = "hidden" # Hides The Comment If Has More Than 10% Of Reports
                    comment.save(update_fields=["status"]) # Saves The Comment

        return Response({
            "success": True, 
            "message": str(_("Nahlásenie bolo úspešne odoslané."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while submitting the report.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri odosielaní nahlásenia došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def add_comment(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        post_id = request.data.get("post_id") # Gets The Post ID
        comment = request.data.get("comment") # Gets The Comment
        parent_id = request.data.get("parent_id") # Gets The Parent ID

        new_comment = PostForum(
            post_id = post_id,
            user_id = logged_in_user_id,
            comment = comment,
            parent_id = parent_id
        )

        new_comment.save() # Saves The New Comment

        # Creates Valid Format Of Comment For JSON Response
        comment = {
            "id": new_comment.id,

            "user": {
                "id": new_comment.user.id,
                "username": new_comment.user.username,
                "profile_picture_name": new_comment.user.profile_picture_name,

                "subscription": {
                    "is_active": new_comment.user.subscription.is_active
                } if hasattr(new_comment.user, "subscription") and new_comment.user.subscription else None
            },

            "creation_time": new_comment.creation_time,
            "level": new_comment.level
        }

        return Response({
            "success": True, 
            "comment": comment, 
            "message": str(_("Komentár pre príspevok bol úspešne pridaný."))
        }, status=201)

    except ValidationError as e:
        # Returns The Error Message From Models
        return Response({
            "success": False, 
            "message": str(e.message)
        }, status=400)

    except Exception as e:
        captureError(f"An error occurred while adding a comment.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri pridávaní komentáru došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def toggle_post_comment_like(request):
    try:
        logged_in_user = request.user # Gets The Logged In User
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        comment_id = request.data.get("comment_id", "") # Gets The Comment ID
        comment = PostForum.objects.get(id=int(comment_id)) # Gets The Comment

        has_like = comment.likes_from_users.filter(id=logged_in_user_id).exists() # Checks If The User Has Already Liked The Comment

        # Like
        if not has_like:
            comment.likes_from_users.add(logged_in_user) # Adds The User To Likes From Users In Comment
            comment.likes = F("likes") + 1 # Increases The Likes Counter
            comment.save() # Updates The Comment

            return Response({
                "success": True, 
                "message": str(_("Označenie páči sa mi to bolo úspešne pridané."))
            }, status=200)

        # Cancel Like
        else:
            comment.likes_from_users.remove(logged_in_user) # Removes The User To Likes From Users In Comment
            comment.likes = F("likes") - 1 # Decreases The Likes Counter
            comment.save() # Updates The Comment

            return Response({
                "success": True, 
                "message": str(_("Označenie páči sa mi to bolo úspešne odstránené."))
            }, status=200)

    except Exception as e:
        captureError(f"An error occurred while changing a like.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri zmene označenia páči sa mi to došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_processing_posts(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

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

    except Exception as e:
        captureError(f"An error occurred while loading the processing posts.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri načítaní spracovávaných príspevkov došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_unread_chats(request):
    try:
        logged_in_user = request.user # Gets The Logged In User

        # Gets The Unread Chats
        unread_chats = Chat.objects.filter(
            receiver=logged_in_user,
            is_read=False
        ).select_related("sender")

        unread_messages_amount = unread_chats.count() # Gets The Unread Messages Amount

        return Response({
            "success": True, 
            "message": str(_("Boli nájdené neprečítané správy.")),
            "unread_chats": unread_chats,
            "unread_messages_amount": unread_messages_amount
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while loading the unread messages.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri načítaní nových správ došlo k chybe."))
        }, status=500)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def get_posts(request):
    try:
        if request.user.is_authenticated:
            logged_in_user = request.user # Gets The Logged In User
            logged_in_user_id = request.user.id # Gets The Logged In User ID

        else:
            logged_in_user_id = None # Default State When The User Isn't Logged In
            logged_in_user = None # Default State When The User Isn't Logged In

        page_number = request.GET.get("page", 1) # Gets The Current Page Number
        searched_text = request.GET.get("searched_text", "") # Gets The Searched Text

        # Gets The Posts With All Related Data
        thirty_days_ago = timezone.now() - timedelta(days=30)

        posts = Post.objects.select_related(
            "user__subscription"
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

            comments_amount=Count("comments", filter=~Q(comments__status="hidden"), distinct=True),

            # Creates The Has Follow Column (True If The Logged In User Is Following The User)
            has_follow=Exists(
                FollowRelation.objects.filter(
                    from_user=logged_in_user_id,
                    to_user_id=OuterRef("user_id"),
                    status="accepted"
                )
            ) if logged_in_user else Value(False, output_field=BooleanField()),
            
            # Creates The Has Pending Follow Request Column (True If The Logged In User Has Pending Follow Request)
            has_pending_follow_request=Exists(
                FollowRelation.objects.filter(
                    from_user=logged_in_user_id,
                    to_user_id=OuterRef("user_id"),
                    status="pending"
                )
            ) if logged_in_user else Value(False, output_field=BooleanField())
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

            posts = posts.exclude(
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
            posts = posts.exclude(
                # Hides All Posts Which Aren't For Public Or From Authors Which Accounts Are Private When The Viewer Isn't Logged In
                Q(public_visibility=False) | Q(user__private_account=True)
            )

        # Filters Posts By Searched Text
        if searched_text:
            posts = posts.filter(
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

        paginator = Paginator(posts, 5) if logged_in_user and logged_in_user.data_saving_mode else Paginator(posts, 10) # Divides The Posts By Maximum 10 Per Page (3 When The Logged In User Has Data Saving Mode Enabled)

        try:
            page_posts = paginator.page(page_number) # Gets Only The Posts For The Selected Page

        except Exception as e:
            captureError(f"An error occurred while searching for posts.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

            return Response({
                "success": False, 
                "has_next": False, 
                "message": str(_("Pri hľadaní príspevkov došlo k chybe."))
            }, status=404)

        # Creates Valid Format Of Posts For JSON Response
        posts_data = [
            {
                "user": {
                    "id": one_post.user.id,
                    "first_name": one_post.user.first_name,
                    "last_name": one_post.user.last_name,
                    "username": one_post.user.username,
                    "profile_picture_name": one_post.user.profile_picture_name,
                    "following": [one_relation.from_user_id for one_relation in one_post.user.accepted_following],
                    "followers": [one_relation.from_user_id for one_relation in one_post.user.accepted_followers],
                    "private_account": one_post.user.private_account,

                    "subscription": {
                        "is_active": one_post.user.subscription.is_active
                    } if hasattr(one_post.user, "subscription") and one_post.user.subscription else None,

                    "has_follow": one_post.has_follow,
                    "has_pending_follow_request": one_post.has_pending_follow_request
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

        return Response({
            "success": True, 
            "has_next": page_posts.has_next(), 
            "posts": posts_data, 
            "message": str(_("Príspevky boli úspešné nájdené."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while loading the posts.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri načítaní príspevkov došlo k chybe."))
        }, status=500)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def get_post_comments(request):
    try:
        if request.user.is_authenticated:
            logged_in_user = request.user # Gets The Logged In User

        else:
            logged_in_user = None # Default State When The User Isn't Logged In

        page_number = request.GET.get("page", 1) # Gets The Current Page Number
        post_id = request.GET.get("post_id") # Gets The Post ID

        # Gets The Post Root Comments With All Related Data
        post_root_comments = PostForum.objects.filter(
            post_id=post_id,
            parent__isnull=True
        ).exclude(
            status="hidden"
        ).select_related(
            "user__subscription"
        ).prefetch_related(
            "likes_from_users",
            "reports_from_users"
        ).order_by(
            "creation_time"
        )

        paginator = Paginator(post_root_comments, 3) if logged_in_user and logged_in_user.data_saving_mode else Paginator(post_root_comments, 10) # Divides The Root Comments By Maximum 10 Per Page (3 When The Logged In User Has Data Saving Mode Enabled)
        page_post_root_comments = paginator.page(page_number) # Gets Only The Root Comments For The Selected Page

        post_root_comments_ids = [comment.id for comment in page_post_root_comments] # Gets All Post Root Comments IDs
        
        # Gets The Post Replies Comments With All Related Data
        post_replies_comments = PostForum.objects.filter(
            Q(parent_id__in=post_root_comments_ids) | # Level 2 (Reply On Root Comment)
            Q(parent__parent_id__in=post_root_comments_ids) | # Level 3 (Reply On Level 2)
            Q(parent__parent__parent_id__in=post_root_comments_ids) | # Level 4 (Reply On Level 3)
            Q(parent__parent__parent__parent_id__in=post_root_comments_ids), # Level 5 (Reply On Level 4)
            post_id=post_id
        ).exclude(
            status="hidden"
        ).select_related(
            "user__subscription"
        ).prefetch_related(
            "likes_from_users",
            "reports_from_users"
        )

        # Combines The Post Root Comments And Replies
        combined_post_comments = sorted(
            chain(page_post_root_comments, post_replies_comments),
            key=lambda x: x.creation_time
        )

        # Creates Valid Format Of Post Comments For JSON Response
        post_comments_data = [
            {
                "id": one_comment.id,

                "user": {
                    "id": one_comment.user.id,
                    "first_name": one_comment.user.first_name,
                    "last_name": one_comment.user.last_name,
                    "username": one_comment.user.username,
                    "profile_picture_name": one_comment.user.profile_picture_name,

                    "subscription": {
                        "is_active": one_comment.user.subscription.is_active
                    } if hasattr(one_comment.user, "subscription") and one_comment.user.subscription else None
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

        return Response({
            "success": True, 
            "has_next": page_post_root_comments.has_next(), 
            "visible_comments": post_comments_data, 
            "message": str(_("Komentáre boli úspešné nájdené."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while searching for comments.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "has_next": False, 
            "message": str(_("Pri hľadaní komentárov došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def mark_post_as_seen(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID
        post_id = request.data.get("post_id") # Gets The Post ID

        # Marks The Post As Seen If Exists And Isn't Already Seen By The User
        SeenPost.objects.get_or_create(
            user_id=logged_in_user_id,
            post_id=post_id
        )

        return Response({
            "success": True, 
            "message": str(_('Príspevok bol úspešne označený za "už videný".'))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while marking the post as seen.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_('Pri označovaní príspevku za "už videný" došlo k chybe.'))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def toggle_follow(request):
    try:
        logged_in_user = request.user # Gets The Logged In User

        user_to_follow_id = request.data.get("user_to_follow_id") # Gets The User To Follow ID
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

            message = str(_("Žiadosť o sledovanie bola odoslaná.")) if status == "pending" else str(_("Sledovanie bolo úspešne pridané."))

            return Response({
                "success": True, 
                "message": message
            }, status=200)

        # Unfollow
        else:
            message = _("Žiadosť o sledovanie bola zrušená.") if follow_relation.status == "pending" else _("Sledovanie bolo úspešne odstránené.")

            follow_relation.delete() # Removes The Relation Between 2 Users

            return Response({
                "success": True, 
                "message": message
            }, status=200)

    except Exception as e:
        captureError(f"An error occurred while changing the follow.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri zmene sledovania došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def edit_post_settings(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID
        post_id = request.data.get("post_id") # Gets The Post ID
        setting = request.data.get("setting") # Gets The Setting
        action = request.data.get("action") # Gets The Action
        post = Post.objects.filter(id=post_id, user_id=logged_in_user_id).first() # Gets The Post

        if post:
            setattr(post, setting, action) # Updates The Given Column's Value
            post.save() # Saves The Edited Post

            return Response({
                "success": True, 
                "message": str(_("Príspevok bol úspešne upravený."))
            }, status=200)

        return Response({
            "success": False, 
            "message": str(_("Príspevok sa nepodarilo upraviť."))
        }, status=400)

    except Exception as e:
        captureError(f"An error occurred while editing the post.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri úprave príspevku došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_post(request):
    try:
        logged_in_user = request.user # Gets The Logged In User
        logged_in_user_id = request.user.id # Gets The Logged In User ID
        post_id = request.data.get("post_id") # Gets The Post ID
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

            return Response({
                "success": True, 
                "message": str(_("Príspevok bol úspešne odstránený."))
            }, status=200)

        return Response({
            "success": False, 
            "message": str(_("Príspevok sa nepodarilo odstrániť."))
        }, status=400)

    except Exception as e:
        captureError(f"An error occurred while deleting the post.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri odstraňovaní príspevku došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_post_comment(request):
    try:
        logged_in_user = request.user # Gets The Logged In User
        logged_in_user_id = request.user.id # Gets The Logged In User ID
        comment_id = request.data.get("comment_id") # Gets The Comment ID
        comment = PostForum.objects.get(id=comment_id) if logged_in_user.role == "developer" or logged_in_user.role == "admin" else PostForum.objects.get(id=comment_id, user_id=logged_in_user_id) # Gets The Comment

        if comment:
            comment.delete() # Deletes The Comment

            return Response({
                "success": True, 
                "message": str(_("Komentár bol úspešne odstránený."))
            }, status=200)

        return Response({
            "success": False, 
            "message": str(_("Komentár sa nepodarilo odstrániť."))
        }, status=400)

    except Exception as e:
        captureError(f"An error occurred while deleting the comment from the post.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri odstraňovaní komentáru došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def tag_user(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID
        searched_tag = request.data.get("searched_tag") # Gets The Searched Tag
        
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

        return Response({
            "success": True, 
            "users": users_for_tag, 
            "message": str(_("Užívatelia pre označenie boli úspešne nájdený."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while searching for users for the tag.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "users": users_for_tag, 
            "message": str(_("Pri hľadaní užívateľov pre označenie došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def upload_post(request):
    try:
        logged_in_user = request.user # Gets The Logged In User
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        subscription = None

        if hasattr(logged_in_user, "subscription") and logged_in_user.subscription and logged_in_user.subscription.is_active:
            # Gets The Subscription Data If Are Available
            subscription = {
                "plan": logged_in_user.subscription.plan,
                "is_active": logged_in_user.subscription.is_active
            }

        description = request.data.get("description") # Gets The Description
        location = request.data.get("location") # Gets The Location
        latitude = request.data.get("latitude", None) # Gets The Latitude
        longitude = request.data.get("longitude", None) # Gets The Longitude
        public_visibility = request.data.get("public_visibility") # Gets The Information If The Public Visibility Is Enabled
        allow_comments = request.data.get("allow_comments") # Gets The Information If The Comments Are Allowed
        hide_likes = request.data.get("hide_likes") # Gets The Information If The Likes Are Hidden

        files = request.FILES.getlist("select_posts") # Gets Files From the POST

        thumbnail_files = request.FILES.getlist("select_thumbnail") # Gets Thumbnail Files From the POST
        thumbnail_files_dict = {one_file.name: one_file for one_file in thumbnail_files} # Converts The Thumbnail Files To The Dictionary Format

        # Saves Only if The Form is Valid And Includes at Least One File
        if files:
            media_data = json.loads(request.data.get("media_data", "[]")) # Gets The Media Data

            # Converts The Media Data To The Dictionary Format (For Example: {"photo1.jpg": {"order": 0, "is_muted": False}, "photo2.jpg": {"order": 1, "is_muted": False}})
            media_data_dict = {
                one_item["filename"]: {
                    "order": int(one_item["order"]), 
                    "is_muted": bool(one_item["is_muted"]),
                    "thumbnail_filename": str(one_item["thumbnail_filename"])
                }

                for one_item in media_data if one_item["filename"]
            }

            # Gets The Coordinates Data
            coordinates_data = {
                "latitude": latitude,
                "longitude": longitude
            }
            
            # Gets The Coordinates If They Are Available
            if coordinates_data["latitude"] and coordinates_data["longitude"]:
                coordinates = Point(float(coordinates_data["longitude"]), float(coordinates_data["latitude"])) # Converts Coordinates Format With GeoDjango

            else:
                coordinates = None

            try:
                with transaction.atomic():
                    # Saves The New Post Media
                    new_post = Post.objects.create(
                        user_id=logged_in_user_id,
                        description=description,
                        location=location,
                        public_visibility=public_visibility,
                        allow_comments=allow_comments,
                        hide_likes=hide_likes
                    )

                    # new_post.tagged_users = [str(one_id) for one_id in tagged_users_ids]
                    new_post.added_hashtags = json.loads(request.data.get("added_hashtags", "[]"))

                    if coordinates:
                        new_post.coordinates = coordinates

                    new_post.save()

                    tagged_users_data = json.loads(request.data.get("tagged_users", "[]")) # For Example: ["@user1","@user2","@user3"]

                    # Gets List Of IDs Of Tagged Users
                    tagged_users_ids = list(
                        Users.objects.filter(username__in=tagged_users_data)
                        .values_list("id", flat=True)
                    )

                    tagged_users = Users.objects.filter(id__in=tagged_users_ids)

                    new_post.tagged_users.set(tagged_users)

                    subscription_plan = subscription.get("plan", "free") if subscription else "free"

                    max_image_size = 2 * 1000 * 1000 if subscription_plan == "free" else 10 * 1000 * 1000 # 2MB For No Subscribers, 10MB For Subscribers
                    max_video_size = 25 * 1000 * 1000 # 25MB For No Subscribers
                    max_video_duration = 60 # 1 Minute For No Subscribers

                    # Subscribers With Basic Plan
                    if subscription_plan == "basic":
                        max_video_size = 50 * 1000 * 1000 # 50MB
                        max_video_duration = 2 * 60 # 2 Minutes

                    # Subscribers With Premium Plan
                    elif subscription_plan == "premium":
                        max_video_size = 100 * 1000 * 1000 # 100MB
                        max_video_duration = 3 * 60 # 3 Minutes

                    MAX_IMAGE_SIZE = max_image_size # 2MB For No Subscribers, 10MB For Subscribers
                    MAX_VIDEO_SIZE = max_video_size # 25MB For No Subscribers, 50MB For Subscribers With Basic Plan, 100MB For Subscribers With Premium Plan
                    MAX_VIDEO_DURATION = max_video_duration # 1 Minute For No Subscribers, 2 Minutes For Subscribers With Basic Plan, 3 Minutes For Subscribers With Premium Plan
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
                                raise ValueError(_("Súbor nemá podporovaný formát:\n%(file)s") % {"file": one_file.name})

                            max_file_size = MAX_VIDEO_SIZE if is_video else MAX_IMAGE_SIZE

                            # Catches Too Large File
                            if one_file.size > max_file_size:
                                raise ValueError(_("Súbor je príliš veľký:\n%(file)s") % {"file": one_file.name})

                            # Catches A Too Long Video
                            if is_video:
                                # Creates A Temporary File For The moviepy Library
                                with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
                                    for one_chunk in one_file.chunks():
                                        temp_file.write(one_chunk)
                                        
                                    temporary_path = temp_file.name
                                
                                try:
                                    video = VideoFileClip(temporary_path)
                                    duration = video.duration
                                    video.close()
                                    os.remove(temporary_path) # Deletes The Temporary File

                                    if duration > MAX_VIDEO_DURATION:
                                        raise ValueError(_("Video je príliš dlhé:\n%(file)s") % {"file": one_file.name})

                                    elif duration < MIN_VIDEO_DURATION:
                                        raise ValueError(_("Video je príliš krátke:\n%(file)s") % {"file": one_file.name})

                                except Exception:
                                    raise ValueError(_("Pri spracovávaní videa došlo k chybe:\n%(file)s") % {"file": one_file.name})

                                finally:
                                    if os.path.exists(temporary_path): 
                                        os.remove(temporary_path)

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
                                    logged_in_user_id,
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
                                compress_image_task = compressImage.delay(new_post_media.id, logged_in_user_id)

                                compress_tasks.append({
                                    "task_id": compress_image_task.id,
                                    "post_media_id": new_post_media.id,
                                    "post_id": new_post_media.post.id
                                })

                        except ValueError as custom_error:
                            raise custom_error

                        except Exception:
                            raise ValueError(_("Chyba pri spracovaní súboru:\n%(file)s") % {"file": one_file.name})

            except ValueError as e:
                return Response({
                    "success": False, 
                    "message": str(e)
                }, status=400)

            return Response({
                "success": True,
                "compress_tasks": compress_tasks,
                "message": str(_("Príspevok bol úspešne pridaný."))
            }, status=200)

        # Wrong Form
        else:
            captureError(f"Uploading the post failed.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n")

            return Response({
                "success": False, 
                "message": str(_("Pridávanie príspevku zlyhalo"))
            }, status=500)
    
    except Exception as e:
        captureError(f"An error occurred while adding the post.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri pridávaní príspevku došlo k chybe"))
        }, status=500)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_upload_progress(request, task_id):
    result = AsyncResult(task_id)
    
    upload_progress = {
        "task_id": task_id,
        "state": result.state, # PENDING, PROGRESS, SUCCESS, FAILURE
        "progress": 0
    }

    if result.state == "PROGRESS":
        upload_progress["progress"] = result.info.get("percentage", 0)
    
    elif result.state == "SUCCESS":
        upload_progress["progress"] = 100
    
    elif result.state == "FAILURE":
        upload_progress["progress"] = 0

    return Response({
        "success": True,
        "upload_progress": upload_progress,
        "message": str(_("Pokrok procesu nahrávania príspevku bol úspešne získaný."))
    }, status=200)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_unread_chats(request):
    try:
        logged_in_user = request.user # Gets The Logged In User

        # Gets The Unread Chats
        unread_chats = Chat.objects.filter(
            receiver=logged_in_user,
            is_read=False
        ).select_related("sender")

        return Response({
            "success": False, 
            "unread_chats": unread_chats,
            "message": str(_("Nové správy boli úspešne načítané."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while loading the unread chats.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri načítavaní nových správ došlo k chybe"))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def mark_post_as_seen(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        post_id = request.data.get("post_id") # Gets The Post ID

        if not post_id or not str(post_id).isdigit():
            return Response({
                "success": False, 
                "message": str(_("Príspevok sa nenašiel."))
            }, status=400)

        # Marks The Post As Seen If Exists And Isn't Already Seen By The User
        SeenPost.objects.get_or_create(
            user_id=logged_in_user_id,
            post_id=post_id
        )

        return Response({
            "success": True, 
            "message": str(_('Príspevok bol úspešne označený za "už videný".'))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while marking the post as seen.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_('Pri označovaní príspevku za "už videný" došlo k chybe.'))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def tag_user(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        searched_tag = request.data.get("searched_tag") # Gets The Searched Tag
        
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

        return Response({
            "success": True, 
            "users": users_for_tag, 
            "message": "Užívatelia pre označenie boli úspešne nájdený."
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while searching for users for the tag.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri hľadaní užívateľov pre označenie došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_video_watch_time(request):
    try:
        logged_in_user = request.user # Gets The Logged In User
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        post_media_id = request.data.get("post_media_id") # Gets The Post Media ID
        watch_time = request.data.get("watch_time") # Gets The Watch Time

        if not post_media_id or not watch_time:
            return Response({
                "success": False, 
                "message": str(_("Nepodarilo sa získať potrebné dáta pre zaznamenanie času pozerania videa."))
            }, status=400)

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

            return Response({
                "success": True, 
                "message": str(_("Celkový čas pozerania videa bol úspešne zaznamenaný."))
            }, status=200)

        else:
            return Response({
                "success": True, 
                "message": str(_("Celkový čas pozerania videa nie je možné navýšiť vlastnému príspevku."))
            }, status=200)

    except Exception as e:
        captureError(f"An error occurred while recording the video watch time.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri zaznamenávaní času pozerania videa došlo k chybe."))
        }, status=500)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def stream_video(request, user_id, media_id, filename):
    try:
        # Manual Addition For HLS Types If The OS Doesn't Know Them
        mimetypes.add_type("application/x-mpegURL", ".m3u8")
        mimetypes.add_type("video/MP2T", ".ts")

        # Gets The Save Video File Path (Path Traversal Protection) From Traveling Between Paths
        safe_filename = os.path.basename(filename)
        path = os.path.join(settings.MEDIA_ROOT, "posts", str(user_id), "videos", str(media_id), safe_filename)

        if not os.path.exists(path):
            return Response({
                "success": False, 
                "message": str(_("Video súbor %(safe_filename)s sa nenašiel.") % {"safe_filename": safe_filename})
            }, status=404)

        # Checks If The File Is index.m3u8 Or .ts Video File Segment
        content_type, _ = mimetypes.guess_type(path)

        if not content_type:
            content_type = "application/octet-stream"

        video_response = FileResponse(open(path, "rb"), content_type=content_type)
        video_response["Accept-Ranges"] = "bytes"

        return Response({
            "success": True, 
            "video": video_response,
            "message": str(_("Video bolo nájdené."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while streaming the video.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri pokuse o prehratie videa došlo k chybe."))
        }, status=500)

# Activity Page

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_activity(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        activities = Activity.objects.filter(user_id=logged_in_user_id) # Gets All Logged In User's Activities
        latest_activity = activities.latest("end_time") if activities else None # Gets The Latest Logged In User's Activity
        longest_activity = activities.order_by("-elapsed_time").first() # Gets The Longest Logged In User's Activity

        # Gets Last 7 Days Average Logged In User's Activity Time
        average_activity_elapsed_time = Activity.objects.filter(
            user_id=logged_in_user_id,
            end_time__gte=timezone.now() - timedelta(days=6)
        ).aggregate(avg=Avg("elapsed_time"))["avg"]

        average_activity_time = math.floor(average_activity_elapsed_time) if average_activity_elapsed_time is not None else 0

        average_activity_time_formatted = f"{(math.floor(average_activity_time / 3600)) % 60}h {(math.floor(average_activity_time / 60)) % 60}m" if activities else "" # Formats Average Activity Time
        activities_amount = Activity.objects.filter(Q(user_id=logged_in_user_id) & Q(end_time__gte=timezone.now() - timedelta(days=6))).count() # Counts Amount Of Last 7 Days Logged In User's Activities

        latest_activity_data = None # Stores The Latest Activity
        longest_activity_data = None # Stores The Longest Activity
        
        if latest_activity:
            # Creates Valid Format Of Latest Activity For JSON Response
            latest_activity_data = {
                "end_time": latest_activity.end_time,
                "elapsed_time": latest_activity.elapsed_time,
                "gained_xp": latest_activity.gained_xp,
                "type": latest_activity.type,
                "training_plan_day": latest_activity.training_plan_day,
                "training_plan_summary": latest_activity.training_plan_summary
            }

        if longest_activity:
            # Creates Valid Format Of Latest Activity For JSON Response
            longest_activity_data = {
                "end_time": longest_activity.end_time,
                "elapsed_time": longest_activity.elapsed_time,
                "gained_xp": longest_activity.gained_xp,
                "type": longest_activity.type,
                "training_plan_day": longest_activity.training_plan_day,
                "training_plan_summary": longest_activity.training_plan_summary
            }

        # Creates Valid Format Of Activity For JSON Response
        activity = {
            "latest_activity": latest_activity_data, 
            "longest_activity": longest_activity_data, 
            "average_activity_time": average_activity_time, 
            "average_activity_time_formatted": average_activity_time_formatted, 
            "activities_amount": activities_amount
        }

        return Response({
            "success": True, 
            "activity": activity,
            "message": "Dáta o aktivite užívateľa boli úspešne získané."
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while getting activity data.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri získavaní dát o aktivite užívateľa došlo k chybe."))
        }, status=500)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_weekly_activity(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

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

        return Response({
            "success": True, 
            "weekly_activity": json.dumps(weekly_activity_result), # Export As A Valid JSON Format
            "message": "Dáta o aktivite užívateľa boli úspešne získané."
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while getting the weekly activity data.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri získavaní aktivity za posledný týždeň došlo k chybe."))
        }, status=500)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_training_plans(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID
        
        day_index = ((datetime.today().weekday()) + 1) % 7 # Gets Current Day Index (Sunday - 0, Monday - 1, Tuesday - 2, Wednesday - 3, Thursday - 4, Friday - 5, Saturday - 6)

        # Gets Logged In User's Training Plans Sorted By Weekdays From Current Day
        training_plans = (
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

        # Creates Valid Format Of Training Plans For JSON Response
        training_plans_data = [
            {
                "training_plan_key": one_training_plan.training_plan_key,
                "day": one_training_plan.day,
                "type": one_training_plan.type,
                "exercise": one_training_plan.exercise,
                "periods": one_training_plan.periods,
                "unit": one_training_plan.unit,
                "order": one_training_plan.order,
            }

            for one_training_plan in training_plans
        ]

        return Response({
            "success": True, 
            "training_plans": training_plans_data,
            "message": "Tréningové plány boli úspešne získané."
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while getting the weekly activity data.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri získavaní tréningových plánov došlo k chybe."))
        }, status=500)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_official_tasks(request):
    try:
        logged_in_user = request.user # Gets The Logged In User

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

        # Creates Valid Format Of Official Tasks For JSON Response
        official_tasks_data = [
            {
                "title": one_official_task.title,
                "data": one_official_task.data,
                "xp": one_official_task.xp,
                "progress_percentage": one_official_task.progress_percentage,
                "is_completed": one_official_task.is_completed
            }

            for one_official_task in official_tasks
        ]

        return Response({
            "success": True, 
            "official_tasks": official_tasks_data,
            "official_tasks_remaining_hours": official_tasks_remaining_hours,
            "message": "Oficiálne úlohy pre tento deň boli úspešne získané."
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while getting user's official tasks.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri získavaní oficiálnych úloh došlo k chybe."))
        }, status=500)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_custom_tasks(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        custom_tasks = CustomTasks.objects.filter(
            user_id=logged_in_user_id
        ).order_by(
            "order"
        )

        # Creates Valid Format Of Custom Tasks For JSON Response
        custom_tasks_data = [
            {
                "title": one_custom_task.title,
                "is_completed": one_custom_task.is_completed,
                "order": one_custom_task.order,
                "created_at": one_custom_task.created_at
            }

            for one_custom_task in custom_tasks
        ]

        return Response({
            "success": True, 
            "custom_tasks": custom_tasks_data,
            "message": "Vlastné úlohy boli úspešne získané."
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while getting user's custom tasks.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri získavaní vlastných úloh došlo k chybe."))
        }, status=500)
    
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_activity_history(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        two_weeks_ago = timezone.now() - timedelta(days=14) # Gets The 2 Weeks Ago Time
        activity_history = Activity.objects.filter(end_time__gte=two_weeks_ago, user_id=logged_in_user_id) # Gets The Activity History Items

        activity_history_data = None # Stores The Activity History Data
        
        if activity_history:
            # Creates Valid Format Of Activity History For JSON Response
            activity_history_data = [
                {
                    "end_time": one_activity.end_time,
                    "elapsed_time": one_activity.elapsed_time,
                    "gained_xp": one_activity.gained_xp,
                    "type": one_activity.type,
                    "training_plan_day": one_activity.training_plan_day,
                    "training_plan_summary": one_activity.training_plan_summary
                }

                for one_activity in activity_history
            ]

            return Response({
                "success": True, 
                "activity_history": activity_history_data,
                "message": "História zaznamenaných aktivít bola úspešne získaná."
            }, status=200)

        return Response({
            "success": False, 
            "message": "Históriu zaznamenaných aktivít sa nepodarilo získať."
        }, status=404)
    
    except Exception as e:
        captureError(f"An error occurred while getting activity history.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri získavaní histórie zaznamenaných aktivít došlo k chybe."))
        }, status=500)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def is_xp_boost_available(request):
    try:
        logged_in_user = request.user # Gets The Logged In User

        # XP Boost
        is_xp_boost_available = False # Stores The Value If The XP Boost Is Available
        one_day_ago = timezone.now() - timedelta(days=1) # Gets The 1 Day Ago Time
        yesterdays_activity = Activity.objects.filter(end_time__gte=one_day_ago).first() # Gets One Of The Yesterday's Activity

        # Checks If The User's XP Boost Expired Yesterday Or Earlier And If The User Recorded Any Activity Yesterday
        if logged_in_user.xp_boost_expiration_time < one_day_ago and yesterdays_activity:
            is_xp_boost_available = True

        return Response({
            "success": True, 
            "is_xp_boost_available": is_xp_boost_available,
            "message": "Informácia o dostupnom navýšení XP bola úspešne získaná."
        }, status=200)
    
    except Exception as e:
        captureError(f"An error occurred while getting information if the XP boost is available.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri získavaní informácie o dostupnom navýšení XP došlo k chybe."))
        }, status=500)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def use_xp_boost(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        xp_boost_expiration_time = timezone.now() + timedelta(minutes=30) # Creates The New XP Boost Expiration Time

        Users.objects.filter(id=logged_in_user_id).update(xp_boost_expiration_time=xp_boost_expiration_time) # Stores New XP Boost Expiration Time

        return Response({
            "success": True, 
            "xp_boost_expiration_time": xp_boost_expiration_time, 
            "message": str(_("Navýšenie XP bolo úspešne uplatnené."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while using the available XP boost.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri uplatňovaní navýšenia XP došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def complete_official_task(request):
    try:
        logged_in_user = request.user # Gets The Logged In User
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        task_data = request.data.get("task_data") # Gets The Completed Task Data
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

                # Creates Valid Format Of Task For JSON Response
                task_data = {
                    "progress_percentage": 100,
                    "is_completed": True,
                    "first_completion": True,
                    "gained_xp": task.xp
                }

                return Response({
                    "success": True, 
                    "task": task_data, 
                    "message": str(_("Úloha bola úspešne dokončená."))
                }, status=200)

            # Creates Valid Format Of Task For JSON Response
            task_data = {
                "progress_percentage": users_daily_official_task.progress_percentage, 
                "is_completed": False, 
                "first_completion": True, 
                "gained_xp": task.xp, 
            }

            return Response({
                "success": True, 
                "task": task_data, 
                "message": str(_("Pokrok úlohy bol úspešne zaznamenaný."))
            }, status=200)

        else:
            # Creates Valid Format Of Task For JSON Response
            task_data = {
                "progress_percentage": 100, 
                "is_completed": True, 
                "first_completion": False, 
                "gained_xp": 0, 
            }

            return Response({
                "success": True, 
                "task": task_data, 
                "message": str(_("Úloha už bola dokončená."))
            }, status=200)

    except Exception as e:
        captureError(f"An error occurred while marking the official task as completed.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri označovaní úlohy za dokončenú došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def add_custom_task(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        custom_task_title = request.data.get("custom_task_title") # Gets The Custom Task Title

        # Creates The New Custom Task
        new_custom_task = CustomTasks(
            user_id = logged_in_user_id,
            title = custom_task_title
        )

        new_custom_task.save() # Saves The New Custom Task

        # Creates Valid Format Of Custom Task For JSON Response
        custom_task_data = {
            "id": new_custom_task.id,
            "title": new_custom_task.title,
            "created_at": new_custom_task.created_at
        }

        return Response({
            "success": True, 
            "custom_task": custom_task_data, 
            "message": str(_("Úloha bola úspešne pridaná."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while adding the new custom task.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri pridávaní úlohy došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def toggle_complete_custom_task(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        task_id = request.data.get("task_id") # Gets The Task ID
        task = CustomTasks.objects.get(id=task_id, user_id=logged_in_user_id) # Gets The User's Custom Task

        task.is_completed = not task.is_completed # Inverts The Completion Status
        task.save(update_fields=["is_completed"]) # Saves The Updated Task

        return Response({
            "success": True, 
            "message": str(_("Stav úlohy bol úspešne zmenený."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while changing the completion of the custom task.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri zmene stavu úlohy došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_custom_task(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        task_id = request.data.get("task_id") # Gets The Task ID
        task = CustomTasks.objects.get(id=task_id, user_id=logged_in_user_id) # Gets The User's Custom Task

        task.delete() # Deletes The User's Custom Task

        return Response({
            "success": True, 
            "message": str(_("Úloha bola úspešne odstránená."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while deleting the custom task.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri odstraňovaní úlohy došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_completed_custom_tasks(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        completed_custom_tasks_ids = json.loads(request.body) # Gets The Completed Custom Tasks IDs

        CustomTasks.objects.filter(
            id__in=completed_custom_tasks_ids,
            user_id=logged_in_user_id
        ).delete()

        return Response({
            "success": True, 
            "message": str(_("Úlohy boli úspešne odstránené."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while deleting the completed custom tasks.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri odstraňovaní úloh došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def change_custom_tasks_order(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        tasks_ids = json.loads(request.body) # Gets The Completed Custom Tasks IDs

        # Updates The Order Of All The Logged In User's Custom Tasks
        for index, task_id in enumerate(tasks_ids):
            CustomTasks.objects.filter(
                id=task_id, 
                user_id=logged_in_user_id
            ).update(order=index)

        return Response({
            "success": True, 
            "message": str(_("Poradie úloh bolo úspešne zmenené."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while changing the order of custom tasks.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri pokuse o zmenu poradia úloh došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def new_activity(request):
    try:
        logged_in_user = request.user # Gets The Logged In User
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        new_activity_data = json.loads(request.body) # Gets Training Plan Data From Fetched JS POST
        gained_xp = new_activity_data["gained_xp"] # Gets Gained XP From POST Data

        Users.objects.filter(id=logged_in_user_id).update(xp = F("xp") + gained_xp) # Increases And Updates The User's Gained XP
        Users.objects.filter(id=logged_in_user_id).update(total_activities = F("total_activities") + 1) # Increases And Updates The User's Total Activities Amount

        today = timezone.now().date() # Determines Today's Date
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

        return Response({
            "success": True, 
            "message": str(_("Aktivita bola úspešne zaznamenaná."))
        }, status=201)

    except Exception as e:
        captureError(f"An error occurred while recording the activity.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri zaznamenávaní aktivity došlo k chybe."))
        }, status=500)

# Manage Training Plans Page

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def get_exercises(request):
    try:
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

        # Creates Valid Format Of Exercises For JSON Response
        exercises_data = [
            {
                "exercise": one_exercise.exercise,
                "unit": one_exercise.unit,
                "categories": one_exercise.categories,
                "requires_weight": one_exercise.requires_weight,
                "image_filename": one_exercise.image_filename
            }

            for one_exercise in exercises
        ]

        return Response({
            "success": True, 
            "exercises": exercises_data,
            "message": str(_("Cviky boli úspešne získané."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while getting the exercises.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri získavaní cvikov došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def manage_training_plan(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

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
                    TrainingPlan.objects.filter(
                        user_id=logged_in_user_id, 
                        training_plan_key=previous_training_plan_key
                    ).delete()

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
                # Deletes Exercises With Similar Training Plan Key
                TrainingPlan.objects.filter(
                    user_id=logged_in_user_id, 
                    training_plan_key=one_object["training_plan_key"]
                ).delete()

        return Response({
            "success": True, 
            "message": str(_("Zmeny v tréningovom pláne boli úspešne vykonané."))
        }, status=201)

    except Exception as e:
        captureError(f"An error occurred while making changes to the training plan.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri vykonávaní zmien v tréningovom pláne došlo k chybe."))
        }, status=500)

# Profile Page

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def get_profile(request, username):
    try:
        if request.user.is_authenticated:
            logged_in_user = request.user # Gets The Logged In User
            logged_in_user_id = request.user.id # Gets The Logged In User ID

        else:
            logged_in_user_id = None # Default State When The User Isn't Logged In
            logged_in_user = None # Default State When The User Isn't Logged In

        is_found = False # Stores The Information If The User Was Found

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

            # Creates Valid Format Of Followers For JSON Response
            followers_data = [
                {
                    "from_user": {
                        "first_name": one_follower.from_user.first_name,
                        "last_name": one_follower.from_user.last_name,
                        "username": one_follower.from_user.username,
                        "profile_picture_name": one_follower.from_user.profile_picture_name,
                        "private_account": one_follower.from_user.private_account
                    },

                    "status": one_follower.status,
                    "created_at": one_follower.created_at
                }

                for one_follower in followers
            ]

            # Gets All Following Users With All Related Data
            following = FollowRelation.objects.filter(
                from_user=user, 
                status="accepted"
            ).select_related("to_user")

            # Creates Valid Format Of Following For JSON Response
            following_data = [
                {
                    "from_user": {
                        "first_name": one_following.to_user.first_name,
                        "last_name": one_following.to_user.last_name,
                        "username": one_following.to_user.username,
                        "profile_picture_name": one_following.to_user.profile_picture_name,
                        "private_account": one_following.to_user.private_account
                    },

                    "status": one_following.status,
                    "created_at": one_following.created_at
                }

                for one_following in following
            ]

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

            # Creates Valid Format Of Posts For JSON Response
            posts_data = [
                {
                    "id": one_post.id,
                    "public_visibility": one_post.public_visibility,
                    "allow_comments": one_post.allow_comments,
                    "hide_likes": one_post.hide_likes,
                    "created_at": one_post.created_at.isoformat(),

                    "media": [
                        {
                            "id": one_media.id,
                            "file": one_media.file.name if one_media.file else None,
                            "thumbnail": one_media.thumbnail.name if one_media.thumbnail else None,
                            "is_video": one_media.is_video,
                            "is_muted": one_media.is_muted
                        }

                        for one_media in one_post.media.all()
                    ]
                }

                for one_post in posts
            ]

            # Creates Valid Format Of User For JSON Response
            user_data = {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "username": user.username,
                "email_address": None,
                "phone_number": None,
                "role": user.role,
                "profile_picture_name": user.profile_picture_name,
                "creation_time": user.creation_time,
                "friend_code": user.friend_code,
                "bio": user.bio,
                "xp": user.xp,
                "activity_streak": user.activity_streak,
                "max_activity_streak": user.max_activity_streak,
                "has_already_increased_activity_streak": user.has_already_increased_activity_streak,
                "private_account": user.private_account,
                "data_saving_mode": None,
                "followers": followers_data,
                "following": following_data,
                "posts": posts_data,
                "saved_posts": None,
                "unread_messages_amount": None,
                "subscription": None
            }

            # If The User Is Logged In
            if logged_in_user_id:
                logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets The Logged In User

                # If Searched Profile Belongs To The Logged In User
                if logged_in_user == user:
                    user_data["email_address"] = user.email_address # Stores The E-mail Address
                    user_data["phone_number"] = user.phone_number # Stores The Phone Number
                    user_data["data_saving_mode"] = user.data_saving_mode # Stores The Information If The Data Saving Mode Is Enabled

                    saved_posts = logged_in_user.saved_posts.all().select_related(
                        "user"
                    ).prefetch_related(
                        "media"
                    ).order_by(
                        "-created_at"
                    ).distinct().values()

                    # Creates Valid Format Of Saved Posts For JSON Response
                    saved_posts_data = [
                        {
                            "id": one_post.id,
                            "created_at": one_post.created_at.isoformat(),

                            "media": [
                                {
                                    "id": one_media.id,
                                    "file": one_media.file.name if one_media.file else None,
                                    "thumbnail": one_media.thumbnail.name if one_media.thumbnail else None,
                                    "is_video": one_media.is_video,
                                    "is_muted": one_media.is_muted
                                }

                                for one_media in one_post.media.all()
                            ]
                        }

                        for one_post in saved_posts
                    ]

                    user_data["saved_posts"] = saved_posts_data # Stores The Saved Posts

                    if hasattr(user, "subscription") and user.subscription:
                        # Gets The Subscription Data If Are Available
                        subscription = {
                            "plan": user.subscription.plan,
                            "is_active": user.subscription.is_active
                        }
                        
                        user_data["subscription"] = subscription # Stores The Subscription

                    return Response({
                        "success": True, 
                        "is_found": is_found,
                        "user": user_data,
                        "message": str(_("Profil užívateľa bol nájdený."))
                    }, status=200)

                else:
                    user_data["has_follow"] = user.has_follow # Stores The Information If The Logged In User Follows The User
                    user_data["has_pending_follow_request"] = user.has_pending_follow_request # Stores The Information If The Logged In User Has Pending Follow Request To The User

                    # Gets The Unread Messages Amount
                    unread_messages_amount = Chat.objects.filter(
                        sender=user,
                        receiver=logged_in_user,
                        is_read=False
                    ).count()

                    user_data["unread_messages_amount"] = unread_messages_amount # Stores The Amount Of The Unread Messages

                    return Response({
                        "success": True, 
                        "is_found": is_found,
                        "user": user_data,
                        "message": str(_("Profil užívateľa bol nájdený."))
                    }, status=200)

            return Response({
                "success": True, 
                "is_found": is_found,
                "user": user_data,
                "message": str(_("Profil užívateľa bol nájdený."))
            }, status=200)

        return Response({
            "success": True, 
            "is_found": is_found,
            "message": str(_("Profil užívateľa sa nenašiel."))
        }, status=400)

    except Exception as e:
        captureError(f"An error occurred while getting the profile.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri získavaní profilu užívateľa došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def remove_follower(request):
    try:
        logged_in_user = request.user # Gets The Logged In User

        removed_follower_id = request.data.get("removed_follower_id") # Gets The Removed Follower ID
        removed_follower = Users.objects.get(id=removed_follower_id) # Gets The Removed Follower

        # Removes The Follower
        FollowRelation.objects.filter(
            from_user=removed_follower,
            to_user=logged_in_user
        ).delete()

        return Response({
            "success": True, 
            "message": str(_("Sledovateľ bol odstránený."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while removing the follower.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri odstraňovaní sledovateľa došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def password_reset(request):
    try:
        logged_in_user = request.user # Gets The Logged In User

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

        return Response({
            "success": True, 
            "message": str(_("Overovací kód bol odoslaný na adresu\n%(email_address)s") % {"email_address": logged_in_user.email_address})
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while removing the follower.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri odstraňovaní sledovateľa došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def approve_follow_request(request):
    try:
        logged_in_user = request.user # Gets The Logged In User

        follow_request_id = request.data.get("follow_request_id") # Gets The Follow Request ID

        # Gets The Follow Request
        follow_request = FollowRelation.objects.filter(
            id=follow_request_id,
            to_user=logged_in_user, 
            status="pending"
        ).first()

        follow_request.status = "accepted" # Accepts The Follow Request

        follow_request.save() # Saves The Updated Follow Request

        return Response({
            "success": True, 
            "message": str(_("Žiadosť o sledovanie bola úspešne potvrdená."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while accepting the follow request.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri potvrdení žiadosti o sledovanie došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def reject_follow_request(request):
    try:
        logged_in_user = request.user # Gets The Logged In User

        follow_request_id = request.data.get("follow_request_id") # Gets The Follow Request ID

        # Gets The Follow Request
        follow_request = FollowRelation.objects.filter(
            id=follow_request_id,
            to_user=logged_in_user, 
            status="pending"
        ).first()

        follow_request.delete() # Removes The Follow Request

        return Response({
            "success": True, 
            "message": str(_("Žiadosť o sledovanie bola zamietnutá."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while rejecting the follow request.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri zamietnutí žiadosti o sledovanie došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def edit_account(request):
    try:
        logged_in_user = request.user # Gets The Logged In User
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        delete_account = request.data.get("delete_account", None) # Gets The Delete Account Request If Is Available
        delete_profile_picture = request.data.get("delete_profile_picture", None) # Gets The Delete Profile Picture If Is Available
        data_saving_mode = request.data.get("data_saving_mode", False) # Gets The Data Saving Mode
        private_account = request.data.get("private_account", False) # Gets The Private Account
        bio = request.data.get("bio", "") # Gets The Bio
        bio_links = request.data.get("bio_links") # Gets The Bio Links
        first_name = request.data.get("first_name") # Gets The First Name
        last_name = request.data.get("last_name") # Gets The Last Name
        email_address = request.data.get("email_address") # Gets The E-mail Address
        phone_number = request.data.get("phone_number") # Gets The Phone Number

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

            captureLogin(f"{logged_in_user.first_name} {logged_in_user.last_name}'s account status has been changed to suspended.\n\t- URL: {request.build_absolute_uri()}\n\t- User ID: {logged_in_user_id},\n\t- IP Address: {getClientIp(request)}\n")

            # del request.session["logged_in_user_id"] # Deletes Previous User ID Session If Was Logged In

            refresh = RefreshToken.for_user(logged_in_user)
            refresh_token = str(refresh.access_token)

            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            return Response({
                "success": True, 
                "message": str(_("Účet %(username)s bol odstránený") % {"username": logged_in_user.username})
            }, status=200)

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

            if delete_profile_picture:
                current_profile_picture_name = logged_in_user.profile_picture_name
                path = os.path.join(settings.MEDIA_ROOT, f"images/{str(logged_in_user_id)}")
                os.remove(f"{path}/{current_profile_picture_name}")

                logged_in_user.profile_picture_name = ""

                logged_in_user.last_edit = timezone.now()

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

            if logged_in_user.bio != bio and bio != "":
                logged_in_user.bio = bio
                logged_in_user.last_edit = timezone.now()

            if logged_in_user.first_name != first_name and first_name != "":
                logged_in_user.first_name = first_name
                logged_in_user.last_edit = timezone.now()

            if logged_in_user.last_name != last_name and last_name != "":
                logged_in_user.last_name = last_name
                logged_in_user.last_edit = timezone.now()

            if logged_in_user.email_address != email_address and email_address != "":
                logged_in_user.email_address = email_address
                logged_in_user.last_edit = timezone.now()

            if logged_in_user.phone_number != phone_number and phone_number != "":
                logged_in_user.phone_number = phone_number
                logged_in_user.last_edit = timezone.now()

            logged_in_user.save() # Updates The Logged In User

            bio_links_json = bio_links # Gets The User's Bio Links In JSON Format

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
                captureError(f"An error occurred while loading bio links from the JSON format.\n\t- URL: {request.build_absolute_uri()}\n\t- User ID: {logged_in_user_id},\n\t- IP Address: {getClientIp(request)}\n")

                return Response({
                    "success": False, 
                    "message": str(_("Pri spracovávaní vlastných odkazov došlo k chybe"))
                }, status=500)

            return Response({
                "success": True, 
                "message": str(_("Zmeny boli uložené"))
            }, status=200)

        else:
            return Response({
                "success": True, 
                "message": str(_("Ďalšie úpravy budú možné %(next_edit_time)s") % {"next_edit_time": (logged_in_user.last_edit + timedelta(days=30)).strftime('%d.%m. %Y')})
            }, status=200)

    # Error
    except Exception as e:
        captureError(f"An error occurred while making changes to your account.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri vykonávaní zmien v účte došlo k chybe"))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def report_user(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        #  = request.data.get("") # Gets The 
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

        return Response({
            "success": True, 
            "message": str(_("Nahlásenie bolo úspešne odoslané."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while submitting the report.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri odosielaní nahlásenia došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def suspend_user(request):
    try:
        logged_in_user = request.user # Gets The Logged In User

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

            return Response({
                "success": True, 
                "message": str(_("Užívateľ bol obmedzený."))
            }, status=200)

        return Response({
            "success": False, 
            "message": str(_("Užívateľa môže obmedziť len správca."))
        }, status=400)

    except Exception as e:
        captureError(f"An error occurred while suspending the user.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri pokuse o obmedzenie užívateľa došlo k chybe."))
        }, status=500)

# Chat Page

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_chat(request, username):
    try:
        logged_in_user = request.user # Gets The Logged In User

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

            return Response({
                "success": False, 
                "receiver": receiver,
                "chats": chats,
                "message": str(_("Užívateľ sa našiel."))
            }, status=200)

        return Response({
            "success": False, 
            "message": str(_("Užívateľ sa nenašiel."))
        }, status=404)

    except Exception as e:
        captureError(f"An error occurred while finding the user.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri hľadaní užívateľa došlo k chybe."))
        }, status=500)

# Blog Page

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def get_articles(request):
    try:
        # Gets All Articles From DB
        articles = cache.get("cached_articles") # Gets All Cached Reviews
        # articles = Articles.objects.all() # Queryset

        # Articles Fallback (If Cache Is Clear)
        if articles is None:
            # Gets All Articles
            articles = list(
                Articles.objects.all().annotate(
                    average_rating=Avg("articlerating__rating"),
                ).order_by(
                    F("html_filename").desc(nulls_last=True), 
                    "-creation_time"
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

        articles.sort(key=lambda x: x.html_filename in (None, "")) # Completed Articles Are On The First Place

        # Number Of All Articles
        num_articles = len(articles) # Redis List
        # num_articles = articles.count() # Queryset

        # Checks If There Are Any Articles In The Database
        # if(articles.exists()): # Queryset
        if articles is not None and len(articles) > 0:
            no_articles = False

        return Response({
            "success": True, 
            "articles": articles,
            "no_articles": no_articles,
            "num_articles": num_articles,
            "message": str(_("Dáta článkov boli úspešne nájdené."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while finding the articles.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri hľadaní článkov došlo k chybe."))
        }, status=500)

# Article Page

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def add_article_rating(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        article_id = request.data.get("article_id") # Gets The Article ID
        rating = request.data.get("rating") # Gets The Rating

        # Stores The Added Article Rating
        ArticleRating.objects.update_or_create(
            article_id=article_id,
            user_id=logged_in_user_id,
            defaults={"rating": rating} # Rating Can Be Updated
        )

        return Response({
            "success": True, 
            "message": str(_("Hodnotenie bolo úspešne odoslané."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while adding the rating.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri pridávaní hodnotenia došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def report_article_comment(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        comment_id = request.data.get("comment_id") # Gets The Article Forum ID
        reason = request.data.get("reason") # Gets The Reason
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

        return Response({
            "success": True, 
            "message": str(_("Nahlásenie bolo úspešne odoslané."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while submitting the report.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri odosielaní nahlásenia došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def add_article_comment(request):
    try:
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        article_id = request.data.get("article_id") # Gets The Article ID
        comment = request.data.get("comment") # Gets The Comment
        parent_id = request.data.get("parent_id") # Gets The Parent ID

        new_comment = ArticleForum(
            article_id = article_id,
            user_id = logged_in_user_id,
            comment = comment,
            parent_id = parent_id
        )

        new_comment.save()

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

        return Response({
            "success": True, 
            "comment": comment, 
            "message": _("Komentár pre článok bol úspešne pridaný.")
        }, status=201)

    except ValidationError as e:
        return Response({
            "success": False, 
            "message": str(e.message) # Returns The Error Message From Models
        }, status=400)

    except Exception as e:
        captureError(f"An error occurred while adding a comment.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri pridávaní komentáru došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def toggle_article_comment_like(request):
    try:
        logged_in_user = request.user # Gets The Logged In User
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        comment_id = request.data.get("comment_id") # Gets The Comment ID
        comment = ArticleForum.objects.get(id=int(comment_id)) # Gets The Comment

        has_like = comment.likes_from_users.filter(id=logged_in_user_id).exists() # Checks If The User Has Already Liked The Comment

        # Like
        if not has_like:
            comment.likes_from_users.add(logged_in_user) # Adds The User To Likes From Users In Comment
            comment.likes = F("likes") + 1 # Increases The Likes Counter
            comment.save() # Updates The Comment

            return Response({
                "success": True, 
                "message": str(_("Označenie páči sa mi to bolo úspešne pridané."))
            }, status=200)

        # Cancel Like
        else:
            comment.likes_from_users.remove(logged_in_user) # Removes The User To Likes From Users In Comment
            comment.likes = F("likes") - 1 # Decreases The Likes Counter
            comment.save() # Updates The Comment

            return Response({
                "success": True, 
                "message": str(_("Označenie páči sa mi to bolo úspešne odstránené."))
            }, status=200)

    except Exception as e:
        captureError(f"An error occurred while changing a like.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri zmene označenia páči sa mi to došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_article_comment(request):
    try:
        logged_in_user = request.user # Gets The Logged In User
        logged_in_user_id = request.user.id # Gets The Logged In User ID

        comment_id = request.data.get("comment_id") # Gets The Comment ID
        comment = ArticleForum.objects.get(id=comment_id) if logged_in_user.role == "developer" or logged_in_user.role == "admin" else ArticleForum.objects.get(id=comment_id, user_id=logged_in_user_id) # Gets The Comment

        if comment:
            comment.delete() # Deletes The Comment

            return Response({
                "success": True, 
                "message": str(_("Komentár bol úspešne odstránený."))
            }, status=200)

        return Response({
            "success": False, 
            "message": str(_("Komentár sa nepodarilo odstrániť."))
        }, status=400)

    except Exception as e:
        captureError(f"An error occurred while deleting the comment from the post.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri odstraňovaní komentáru došlo k chybe."))
        }, status=500)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def get_article(request, theme):
    try:
        if request.user.is_authenticated:
            logged_in_user_id = request.user.id # Gets The Logged In User ID

        else:
            logged_in_user_id = None # Default State When The User Isn't Logged In

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

        # response = render(request, "app/articles.html", {
        #     "article": article,
        #     "not_found": not_found
        # })

        # response.set_cookie(article.link, "visited", expires=timezone.now() + timedelta(days=365)) # Sets 1 Year Timed Cookie About Information That The User Has Already Visited The Article

        # return response

        return Response({
            "success": True, 
            "article": article,
            "not_found": not_found,
            "message": str(_("Článok bol nájdený."))
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while getting the article.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri získavaní článku došlo k chybe."))
        }, status=500)