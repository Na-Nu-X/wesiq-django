from rest_framework.response import Response
from django.db.models import F, Exists, OuterRef, Value, BooleanField, Prefetch
from django.utils.translation import gettext as _
from app.models import Users, FollowRelation, SpecialBadges, UserDailyOfficialTasks, UsersReport, Activity, Reviews, ReviewReport, Articles, ArticleRating, ArticleForum, ArticleForumReport, TrainingPlan, Exercises, OfficialTasks, CustomTasks, Transactions, Subscription, Post, PostReport, PostMedia, SeenPost, VideoView, PostForum, PostForumReport, BioLinks, Chat, MessageReaction, ContactMessage
from .serializers import UserSerializer
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
from django.db.models import Exists, OuterRef, Case, When, BooleanField
from django.core.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from django_ratelimit.decorators import ratelimit
from django_ratelimit.core import get_usage
from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken

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
        "profile_picture_name": logged_in_user_object.profile_picture_name,
        "friend_code": logged_in_user_object.friend_code,
        "private_account": logged_in_user_object.private_account,
        "followers": len(logged_in_user_object.accepted_followers),
        "has_follow": logged_in_user_object.has_follow,
        "has_pending_follow_request": logged_in_user_object.has_pending_follow_request,
        "subscription": subscription
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

            return Response({
                "success": True, 
                "message": str(_("Označenie páči sa mi to bolo úspešne pridané."))
            }, status=200)

        # Cancel Like
        else:
            post.likes_from_users.remove(logged_in_user) # Removes The User From Likes From Users In Post
            Post.objects.filter(id=int(post_id)).update(likes = F("likes") - 1) # Decreases And Updates The Likes Counter

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

        report_post_data = request.data.get("report_post_data", {}) # Gets The Report Post Data
        post_id = report_post_data.get("post_id") # Gets The Post ID
        reason = report_post_data.get("reason") # Gets The Reason

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
        
        comment_id = request.data.get("postforum_id") # Gets The Post Forum ID
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

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def add_comment(request):
    try:
        if request.user.is_authenticated:
            logged_in_user = request.user # Gets The Logged In User
            logged_in_user_id = request.user.id # Gets The Logged In User ID
            comment_data = request.data.get("comment_data", "") # Gets The Comment Data

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

        return Response({
            "success": False, 
            "message": str(_("Komentár nie je možné pridať bez prihlásenia."))
        }, status=401)

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
        if request.user.is_authenticated:
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

        return Response({
            "success": False, 
            "message": str(_("Označenie páči sa mi to nie je možné zmeniť bez prihlásenia."))
        }, status=401)

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
        if request.user.is_authenticated:
            logged_in_user = request.user # Gets The Logged In User
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

        return Response({
            "success": False, 
            "message": str(_("Spracovávané príspevky nie je možné načítať bez prihlásenia."))
        }, status=401)

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
        if request.user.is_authenticated:
            logged_in_user = request.user # Gets The Logged In User
            logged_in_user_id = request.user.id # Gets The Logged In User ID

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

        return Response({
            "success": False, 
            "message": str(_("Nové správy nie je možné načítať bez prihlásenia."))
        }, status=401)

    except Exception as e:
        captureError(f"An error occurred while loading the unread messages.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri načítaní nových správ došlo k chybe."))
        }, status=500)

@api_view(["POST"])
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
                    "private_account": one_post.user.private_account,

                    "subscription": {
                        "is_active": one_post.user.subscription.is_active
                    } if hasattr(one_post.user, "subscription") and one_post.user.subscription else None
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

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def mark_post_as_seen(request):
    # Unfinished
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

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def toggle_follow(request):
    # Unfinished
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

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def edit_post_settings(request):
    # Edit Post Settings
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

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_post(request):
    # Delete Post
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

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_post_comment(request):
    # Unfinished
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

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def tag_user(request):
    # Unfinished
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