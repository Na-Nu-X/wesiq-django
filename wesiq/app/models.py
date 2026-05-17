from django.contrib.gis.db import models
from django.contrib.postgres.fields import ArrayField
from pathlib import Path
import secrets, os
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

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

    first_name = models.CharField(verbose_name="First Name", max_length=20, null=True, blank=True)
    last_name = models.CharField(verbose_name="Last Name", max_length=50, null=True, blank=True)
    username = models.CharField(verbose_name="Username", max_length=20, null=False)
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
    following = models.ManyToManyField('self', verbose_name="Following", related_name="followers", symmetrical=False, blank=True)
    saved_posts = models.ManyToManyField("Post", verbose_name="Saved Posts", related_name="saved_posts", blank=True)
    bio = models.TextField(verbose_name="Bio", max_length=100, null=True, blank=True)
    xp = models.IntegerField(verbose_name="Total XP", default=0, null=False)
    account_status = models.CharField(verbose_name="Account Status", max_length=20, choices=account_status_choices, default="unverified", null=False)
    last_login = models.DateTimeField(verbose_name="Last Login", auto_now_add=False, null=True, blank=True)

    def __str__(self):
        return f"{self.role}: {self.first_name} {self.last_name}"
    
class Activity(models.Model):
    user = models.ForeignKey(
        Users, 
        verbose_name="User", 
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
        verbose_name="User", 
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
        verbose_name="User",
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
        verbose_name="Article", 
        on_delete=models.DO_NOTHING, 
        related_name="comments", 
        null=False,
    )

    user = models.ForeignKey(
        Users, 
        verbose_name="User", 
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
        verbose_name="User",
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
        verbose_name="User",
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
    # Checks If The Name Is Already Generated
    if not hasattr(instance, '_random_uuid'):
        instance._random_uuid = secrets.token_hex(nbytes=10) # Generates Random 20 Characters Long Filename (Numbers and Small Letters)

    IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic"] # Sets List of Supported Image Extensions
    VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm"] # Sets List of Supported Video Extensions

    extension = Path(filename).suffix.lower() # Gets The File Extension
    
    # Sets The Filename Prefix
    if filename.startswith('THUMB-'):
        prefix = "THUMB"

    elif extension in VIDEO_EXTENSIONS:
        prefix = "VID"

    elif extension in IMAGE_EXTENSIONS:
        prefix = "IMG"

    else:
        prefix = "FILE"

    new_filename = f"{prefix}-{instance._random_uuid}{extension}" # Creates The New Filename
    return f"posts/{instance.post.user_id}/{new_filename}" # Returns The Full Path

class Post(models.Model):
    user = models.ForeignKey(
        Users,
        verbose_name="User",
        on_delete=models.CASCADE,
        related_name="posts",
        null=False,
    )

    seen_by = models.ManyToManyField(
        Users, 
        through="SeenPost",
        related_name="viewed_posts"
    )

    reports_from_users = models.ManyToManyField(
        Users, 
        through="PostReport", 
        verbose_name="Reports From Users", 
        related_name="reported_posts", 
        blank=True
    )

    description = models.TextField(verbose_name="Description", max_length=500, null=True, blank=True)
    tagged_users = models.ManyToManyField(Users, verbose_name="Tagged Users", blank=True)
    added_hashtags = ArrayField(models.CharField(verbose_name="Added Hashtags", max_length=30), default=list, null=False)
    location = models.CharField(verbose_name="Location", max_length=255, null=True, blank=True)
    coordinates = models.PointField(verbose_name="Coordinates", null=True, blank=True, srid=4326) # WGS84 (Standardized, Geocentric Coordinate System Used Globally For Mapping, Navigation And GPS)
    public_visibility = models.BooleanField(verbose_name="Public Visibility", default=True, null=False)
    allow_comments = models.BooleanField(verbose_name="Allow Comments", default=True, null=False)
    hide_likes = models.BooleanField(verbose_name="Hide Likes", default=False, null=False)
    likes = models.IntegerField(verbose_name="Likes", default=0, null=False)
    likes_from_users = models.ManyToManyField(Users, verbose_name="Likes From Users", related_name="liked_posts", blank=True)
    latest_interaction = models.DateTimeField(verbose_name="Latest Interaction", auto_now_add=True, db_index=True)
    created_at = models.DateTimeField(verbose_name="Created At", auto_now_add=True, null=False)
    reports = models.IntegerField(verbose_name="Reports", default=0, null=False)

class PostReport(models.Model):
    report_reason_choices = [
        ("spam", "spam"),
        ("harassment", "harassment"),
        ("hate_speech", "hate speech"),
        ("misinformation", "misinformation"),
        ("explicit_content", "explicit content"),
        ("other", "other")
    ]

    post = models.ForeignKey(
        Post,
        verbose_name="Post",
        on_delete=models.CASCADE,
        null=False,
    )

    user = models.ForeignKey(
        Users,
        verbose_name="User",
        on_delete=models.CASCADE,
        null=False,
    )

    reason = models.CharField(verbose_name="Reason", max_length=50, choices=report_reason_choices, default="other", null=False)
    created_at = models.DateTimeField(verbose_name="Created At", auto_now_add=True, null=False)

    class Meta:
        unique_together = ("post", "user")

class PostMedia(models.Model):
    post = models.ForeignKey(
        Post,
        verbose_name="Post",
        on_delete=models.CASCADE,
        related_name="media",
        null=False,
    )

    file = models.FileField(upload_to=getPostUploadPath)
    thumbnail = models.ImageField(upload_to=getPostUploadPath, null=True, blank=True)
    is_video = models.BooleanField(verbose_name="Is Video", default=False, null=False)
    is_processed = models.BooleanField(verbose_name="Is Processed", default=False, null=False)
    original_filename = models.CharField(verbose_name="Original Filename", max_length=255, null=True, blank=True)
    original_size = models.BigIntegerField(verbose_name="Original Size", null=True, blank=True)
    compressed_size = models.BigIntegerField(verbose_name="Compressed Size", null=True, blank=True)

    @property
    def filename(self):
        return os.path.basename(self.file.name)

class SeenPost(models.Model):
    user = models.ForeignKey(
        Users,
        verbose_name="User",
        on_delete=models.CASCADE,
        related_name="seen_instances",
        null=False,
    )

    post = models.ForeignKey(
        Post,
        verbose_name="Post",
        on_delete=models.CASCADE,
        related_name="seen_by_instances",
        null=False,
    )

    viewed_at = models.DateTimeField(verbose_name="Viewed At", auto_now_add=True, null=False, db_index=True)

    class Meta:
        unique_together = ("user", "post")

class PostForum(models.Model):
    status_choices = [
        ("OK", "OK"),
        ("hidden", "hidden"),
    ]

    post = models.ForeignKey(
        Post,
        verbose_name="Post",
        on_delete=models.CASCADE,
        related_name="comments",
        null=False,
    )

    user = models.ForeignKey(
        Users, 
        verbose_name="User", 
        on_delete=models.CASCADE, 
        related_name="post_comments",
        null=True,
    )

    reports_from_users = models.ManyToManyField(
        Users, 
        through="PostForumReport", 
        verbose_name="Reports From Users", 
        related_name="reported_post_forum_comments", 
        blank=True
    )

    comment = models.TextField(verbose_name="Comment", null=False)
    # tagged_users = models.ManyToManyField(Users, verbose_name="Tagged Users", blank=True)
    # added_hashtags = ArrayField(models.CharField(verbose_name="Added Hashtags", max_length=30), default=list, null=False)
    likes = models.IntegerField(verbose_name="Likes", default=0, null=False)
    likes_from_users = models.ManyToManyField(Users, verbose_name="Likes From Users", related_name="liked_post_forum_comments", blank=True)
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
    level = models.PositiveIntegerField(default=1)

    def save(self, *args, **kwargs):
        if self.parent:
            calculated_level = self.parent.level + 1
            
            if calculated_level > 5:
                raise ValidationError(_("Maximum level of nested comments has been reached."))
            
            self.level = calculated_level
            
        else:
            self.level = 1
            
        super().save(*args, **kwargs)

class PostForumReport(models.Model):
    report_reason_choices = [
        ("spam", "spam"),
        ("harassment", "harassment"),
        ("hate_speech", "hate speech"),
        ("misinformation", "misinformation"),
        ("explicit_content", "explicit content"),
        ("other", "other")
    ]

    postforum = models.ForeignKey(
        PostForum,
        verbose_name="Post Forum Comment",
        on_delete=models.CASCADE,
        null=False,
    )

    user = models.ForeignKey(
        Users,
        verbose_name="User",
        on_delete=models.CASCADE,
        null=False,
    )

    reason = models.CharField(verbose_name="Reason", max_length=50, choices=report_reason_choices, default="other", null=False)
    created_at = models.DateTimeField(verbose_name="Created At", auto_now_add=True, null=False)

    class Meta:
        unique_together = ("postforum", "user")