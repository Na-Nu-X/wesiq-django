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

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def load_first_users(request):
    try:
        if request.user.is_authenticated:
            logged_in_user = request.user
            logged_in_user_id = request.user.id

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
def search_users(request):
    try:
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
def toggle_post_like(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets Logged In User

            post_id = request.data.get("post_id", "") # Gets The Post ID
            post = Post.objects.get(id=int(post_id)) # Gets The Post

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
def report_post(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            report_post_data = request.data.get("report_post_data", "") # Gets The Report Post Data
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

            return Response({
                "success": True, 
                "message": str(_("Nahlásenie bolo úspešne odoslané."))
            }, status=200)

        return Response({
            "success": False, 
            "message": str(_("Nahlásenie nie je možné odoslať bez prihlásenia."))
        }, status=401)

    except Exception as e:
        captureError(f"An error occurred while submitting the report.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri odosielaní nahlásenia došlo k chybe."))
        }, status=500)

@api_view(["POST"])
def toggle_post_save(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets Logged In User

            post_id = request.data.get("post_id", "") # Gets The Post ID
            post = Post.objects.get(id=int(post_id)) # Gets The Post

            has_save = logged_in_user.saved_posts.filter(id=post_id).exists() # Checks If The User Has Already Saved The Post

            # Save
            if not has_save:
                logged_in_user.saved_posts.add(post) # Adds The Post To The User's Saved Posts
                logged_in_user.save() # Saves The Logged In User

                return Response({
                    "success": True, 
                    "message": str(_("Príspevok bol úspešne uložený."))
                }, status=200)

            # Unsave
            else:
                logged_in_user.saved_posts.remove(post) # Removes The Post From The User's Saved Posts
                logged_in_user.save() # Saves The Logged In User

                return Response({
                    "success": True, 
                    "message": str(_("Príspevok bol odstránený zo zoznamu uložených."))
                }, status=200)

        return Response({
            "success": False, 
            "message": str(_("Príspevok nie je možné uložiť bez prihlásenia."))
        }, status=401)

    except Exception as e:
        captureError(f"An error occurred while changing a save.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri zmene uloženia príspevku došlo k chybe."))
        }, status=500)

@api_view(["POST"])
def report_post_comment(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets Logged In User

            post_id = request.data.get("post_id", "") # Gets The Post ID
            post = Post.objects.get(id=int(post_id)) # Gets The Post

            has_save = logged_in_user.saved_posts.filter(id=post_id).exists() # Checks If The User Has Already Saved The Post

            # Save
            if not has_save:
                logged_in_user.saved_posts.add(post) # Adds The Post To The User's Saved Posts
                logged_in_user.save() # Saves The Logged In User

                return Response({
                    "success": True, 
                    "message": str(_("Príspevok bol úspešne uložený."))
                }, status=200)

            # Unsave
            else:
                logged_in_user.saved_posts.remove(post) # Removes The Post From The User's Saved Posts
                logged_in_user.save() # Saves The Logged In User

                return Response({
                    "success": True, 
                    "message": str(_("Príspevok bol odstránený zo zoznamu uložených."))
                }, status=200)

        return Response({
            "success": False, 
            "message": str(_("Príspevok nie je možné uložiť bez prihlásenia."))
        }, status=401)

    except Exception as e:
        captureError(f"An error occurred while changing a save.\n\t- URL: {request.build_absolute_uri()}\n\t- IP Address: {getClientIp(request)}\n\t- Error: {e}\n")

        return Response({
            "success": False, 
            "message": str(_("Pri zmene uloženia príspevku došlo k chybe."))
        }, status=500)

@api_view(["POST"])
def add_comment(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
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
def toggle_post_comment_like(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In User ID From Session
            logged_in_user = Users.objects.get(id=logged_in_user_id) # Gets Logged In User

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
def get_processing_posts(request):
    try:
        if "logged_in_user_id" in request.session:
            logged_in_user_id = request.session.get("logged_in_user_id") # Gets Logged In 

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