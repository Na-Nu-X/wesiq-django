from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from django.db.models import F, Exists, OuterRef, Value, BooleanField, Prefetch
from django.utils.translation import gettext as _
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
                    "message": str(_("Úspešne prihlásený ako %(username)s") % {"username": user.username}),
                    "access": str(refresh.access_token),
                    "refresh": str(refresh)
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
    ).annotate(
        # Creates The Has Follow Column (True If The Logged In User Is Following The User)
        has_follow=Exists(
            FollowRelation.objects.filter(
                from_user=logged_in_user_id,
                to_user=OuterRef("pk"),
                status="accepted"
            )
        ),
        
        # Creates The Has Pending Follow Request Column (True If The Logged In User Has Pending Follow Request)
        has_pending_follow_request=Exists(
            FollowRelation.objects.filter(
                from_user=logged_in_user_id,
                to_user=OuterRef("pk"),
                status="pending"
            )
        )
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
        "followers": len(logged_in_user_object.accepted_followers),
        "has_follow": logged_in_user_object.has_follow,
        "has_pending_follow_request": logged_in_user_object.has_pending_follow_request,
        "subscription": subscription,
        "data_saving_mode": logged_in_user_object.data_saving_mode
    }

    return Response({
        "success": True, 
        "logged_in_user": logged_in_user_data,
        "message": str(_("Prihlásený užívateľ bol úspešne nájdený."))
    }, status=200)

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

        posts_query = Post.objects.select_related(
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

            return Response({
                "success": False, 
                "has_next": False, 
                "message": str(_("Pri hľadaní príspevkov došlo k chybe."))
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
            "posts": posts, 
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
        post_root_comments_query = PostForum.objects.filter(
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
            "user__subscription"
        ).prefetch_related(
            "likes_from_users",
            "reports_from_users"
        )

        # Combines The Post Root Comments And Replies
        combined_post_comments = sorted(
            chain(page_post_root_comments, post_replies_comments_query),
            key=lambda x: x.creation_time
        )

        # Creates Valid Format Of Post Comments For JSON Response
        post_comments = [
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
            "visible_comments": post_comments, 
            "message": _("Komentáre boli úspešné nájdené.")
        }, status=200)

    except Exception as e:
        captureError(f"An error occurred while searching for comments.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "has_next": False, 
            "message": _("Pri hľadaní komentárov došlo k chybe.")
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
def getUploadProgress(request, task_id):
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