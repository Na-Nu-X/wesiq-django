from enum import unique
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.conf import settings
from pathlib import Path
import secrets

class Users(models.Model):
    role_choices = [
        ("user", "user"),
        ("admin", "admin"),
    ]

    account_status_choices = [
        ("unverified", "unverified"),
        ("OK", "OK"),
        ("suspended", "suspended"),
        ("deleted", "deleted"),
    ]

    first_name = models.CharField(verbose_name="First Name", max_length=50, null=False)
    last_name = models.CharField(verbose_name="Last Name", max_length=50, null=False)
    username = models.CharField(verbose_name="Username", max_length=20, default="@", null=False)
    email_address = models.CharField(verbose_name="E-mail Address", max_length=50)
    phone_number = models.CharField(verbose_name="Phone Number", max_length=50, null=True)
    password = models.CharField(verbose_name="Password", max_length=255)
    role = models.CharField(verbose_name="Role", choices=role_choices, default="user", max_length=20)
    profile_picture_name = models.CharField(verbose_name="Profile Picture File", max_length=50, null=True, blank=True)
    language = models.CharField(verbose_name="Language Code", max_length=10, default="en", null=False, blank=False)
    last_edit = models.DateTimeField(verbose_name="Last Edit Time", null=True, blank=True)
    creation_time = models.DateTimeField(verbose_name="Creation Time", auto_now_add=True, null=False)
    verification_code = models.CharField(verbose_name="Verification Code", max_length=6, null=True, blank=True)
    password_reset_code = models.CharField(verbose_name="Password Reset Code", max_length=6, null=True, blank=True)
    google_id = models.CharField(verbose_name="Google ID", max_length=255, null=True, blank=True)
    blog_subscribe = models.BooleanField(verbose_name="Blog Subscribe", default=False, null=False)
    friend_code = models.CharField(verbose_name="Friend Code", max_length=6, null=False)
    following = ArrayField(models.CharField(verbose_name="Following", max_length=20), default=list, null=False)
    followers = ArrayField(models.CharField(verbose_name="Followers", max_length=20), default=list, null=False)
    xp = models.IntegerField(verbose_name="Total XP", default=0, null=False)
    account_status = models.CharField(verbose_name="Account Status", max_length=20, choices=account_status_choices, default="unverified", null=False)
    last_login = models.DateTimeField(verbose_name="Last Login", auto_now_add=False, null=True, blank=True)

    def __str__(self):
        return f"{self.role}: {self.first_name} {self.last_name}"
    
class Activity(models.Model):
    user = models.ForeignKey(
        Users, 
        verbose_name="User ID", 
        on_delete=models.DO_NOTHING, 
        related_name="activities", 
        null=True,
    )

    end_time = models.DateTimeField(verbose_name="End Time", auto_now_add=True, null=False)
    formatted_elapsed_time = models.CharField(verbose_name="Formatted Elapsed Time", max_length=11, default="00h 00m 01s", null=False)
    elapsed_time = models.IntegerField(verbose_name="Elapsed Time (Seconds)", default=0, null=False)
    gained_xp = models.IntegerField(verbose_name="Gained XP", default=0, null=False)
    type = models.CharField(verbose_name="Type", max_length=50, null=True)
    training_plan_day = models.IntegerField(verbose_name="Day", null=True, blank=True)
    training_plan_summary = models.JSONField(verbose_name="Training Plan Summary", default=list, null=True, blank=True)

class Reviews(models.Model):
    user = models.ForeignKey(
        Users, 
        verbose_name="User ID", 
        on_delete=models.SET_NULL, 
        related_name="review", 
        null=True,
    )
    
    rating = models.IntegerField(verbose_name="Rating", default=0, null=False)
    review = models.TextField(verbose_name="Review", max_length=200, null=True)
    last_edit = models.DateTimeField(verbose_name="Last Edit Time", null=True, blank=True)
    creation_time = models.DateTimeField(verbose_name="Creation Time", auto_now_add=True, null=False)

class Articles(models.Model):
    user = models.ForeignKey(
        Users, 
        verbose_name="User ID",
        on_delete=models.DO_NOTHING, 
        related_name="article", 
        null=True,
    )

    title = models.CharField(verbose_name="Title", max_length=50, null=False)
    content = models.TextField(verbose_name="Content", null=False)
    categories = ArrayField(models.CharField(verbose_name="Categories", max_length=50), default=list, null=False)
    rating = models.FloatField(verbose_name="Rating", default=0, null=False)
    visitors = models.IntegerField(verbose_name="Visitors", default=0, null=False)
    link = models.CharField(verbose_name="Link", max_length=50, null=False)
    image_name = models.CharField(verbose_name="Image File", max_length=50, null=True, blank=True)
    creation_time = models.DateTimeField(verbose_name="Creation Time", auto_now_add=True, null=False)

class ArticleForum(models.Model):
    status_choices = [
        ("OK", "OK"),
        ("hidden", "hidden"),
    ]

    article = models.ForeignKey(
        Articles, 
        verbose_name="Article ID", 
        on_delete=models.DO_NOTHING, 
        related_name="comments", 
        null=False,
    )

    user = models.ForeignKey(
        Users, 
        verbose_name="User ID", 
        on_delete=models.DO_NOTHING, 
        related_name="comments", 
        null=True,
    )

    comment = models.TextField(verbose_name="Comment", null=False)
    likes = models.IntegerField(verbose_name="Likes", default=0, null=False)
    likes_from_users = ArrayField(models.CharField(verbose_name="Likes From Users", max_length=20), default=list, null=False)
    creation_time = models.DateTimeField(verbose_name="Creation Time", auto_now_add=True, null=False)

    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies",
    )

    status = models.CharField(verbose_name="Status", choices=status_choices, max_length=20, default="OK")
    reports = models.IntegerField(verbose_name="Reports", default=0, null=False)
    reports_from_users = ArrayField(models.CharField(verbose_name="Reports From Users", max_length=20), default=list, null=False)

class TrainingPlan(models.Model):
    unit_choices = [
        ("reps", "reps"),
        ("seconds", "seconds"),
        ("steps", "steps"),
    ]

    user = models.ForeignKey(
        Users,
        verbose_name="User ID",
        on_delete=models.DO_NOTHING,
        related_name="training_plans",
        null=True,
    )

    training_plan_key = models.CharField(verbose_name="Training Plan Key", max_length=50, default="None", null=False, blank=False)
    day = models.IntegerField(verbose_name="Day", null=True, blank=True)
    type = models.CharField(verbose_name="Type", max_length=50, null=True)
    exercise = models.CharField(verbose_name="Exercise", max_length=50, null=False)
    periods = ArrayField(models.IntegerField(verbose_name="Reps"), default=list, null=False) # The Length Of The Array Represents Sets And The Amount Of Reps Represents The Values (0 = To Failute / Max. Reps)
    unit = models.CharField(verbose_name="Unit", max_length=20, choices=unit_choices, default="reps", null=False)
    order = models.IntegerField(verbose_name="Order", default=0, null=False)

class Exercises(models.Model):
    unit_choices = [
        ("reps", "reps"),
        ("seconds", "seconds"),
        ("steps", "steps"),
    ]

    exercise = models.CharField(verbose_name="Exercise", max_length=50, null=False)
    unit = models.CharField(verbose_name="Unit", max_length=20, choices=unit_choices, default="reps", null=False)
    categories = ArrayField(models.CharField(verbose_name="Categories", max_length=50), default=list, null=False)
    requires_weight = models.BooleanField(verbose_name="Requires Weight", default=False, null=False)

class Transactions(models.Model):
    status_choices = [
        ("pending", "pending"),
        ("succeeded", "succeeded"),
        ("failed", "failed"),
    ]

    user = models.ForeignKey(
        Users,
        verbose_name="User ID",
        on_delete=models.DO_NOTHING,
        related_name="transactions",
        null=True,
    )

    stripe_intent_id = models.CharField(verbose_name="Stripe ID", max_length=255, unique=True, null=False)
    cardholder_name = models.CharField(verbose_name="Cardholder Name", max_length=50, null=False)
    amount = models.DecimalField(verbose_name="Amount (€)", max_digits=10, decimal_places=2, default=0, null=False) # In €
    status = models.CharField(verbose_name="Status", max_length=20, choices=status_choices, default="pending", null=False)
    created_at = models.DateTimeField(verbose_name="Created At", auto_now_add=True, null=False)

    def __str__(self):
        return f"{self.cardholder_name} - {self.amount}€ ({self.status})"

def getPostUploadPath(instance, filename):
    image_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic"] # Sets List of Supported Image Extensions
    video_extensions = [".mp4", ".mov", ".avi", ".mkv", ".webm"] # Sets List of Supported Video Extensions

    extension = Path(filename).suffix.lower() # Gets The File Extension
    
    # Sets The Filename Prefix
    if extension in image_extensions:
        prefix = "IMG"

    elif extension in video_extensions:
        prefix = "VID"

    else:
        prefix = "FILE"

    random_filename = secrets.token_hex(nbytes=10) # Generates Random 20 Characters Long Filename (Numbers and Small Letters)

    new_image_name = f"{prefix}-{random_filename + extension}" # Creates The New Filename
    
    return f"posts/{instance.post.user.id}/{new_image_name}"

class Post(models.Model):
    user = models.ForeignKey(
        "Users",
        verbose_name="User ID",
        on_delete=models.CASCADE,
        related_name="posts",
        null=False,
    )

    description = models.TextField(verbose_name="Description", max_length=500, null=True, blank=True)
    tagged_people = ArrayField(models.CharField(verbose_name="Tagged People", max_length=20), default=list, null=True, blank=True)
    hashtags = ArrayField(models.CharField(verbose_name="Hashtags", max_length=30), default=list, null=True, blank=True)
    location = models.CharField(verbose_name="Location", max_length=255, null=True, blank=True)
    public_visibility = models.BooleanField(verbose_name="Public Visibility", default=True, null=False)
    allow_comments = models.BooleanField(verbose_name="Allow Comments", default=True, null=False)
    hide_likes = models.BooleanField(verbose_name="Hide Likes", default=False, null=False)
    created_at = models.DateTimeField(verbose_name="Created At", auto_now_add=True, null=False)

class PostMedia(models.Model):
    post = models.ForeignKey(
        Post,
        verbose_name="Post",
        on_delete=models.CASCADE,
        related_name="media",
        null=False,
    )

    file = models.FileField(upload_to=getPostUploadPath)
    is_video = models.BooleanField(verbose_name="Is Video", default=False, null=False)