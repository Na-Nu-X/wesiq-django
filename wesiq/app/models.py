from django.contrib.gis.db import models
from django.contrib.postgres.fields import ArrayField
from pathlib import Path
import secrets, os, math
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.utils.translation import gettext as _
from urllib.parse import urlparse

class Users(models.Model):
    role_choices = [
        ("developer", "developer"),
        ("admin", "admin"),
        ("user", "user")
    ]

    account_status_choices = [
        ("unverified", "unverified"),
        ("OK", "OK"),
        ("suspended", "suspended"),
        ("deleted", "deleted")
    ]

    daily_official_tasks = models.ManyToManyField(
        "OfficialTasks", 
        through="UserDailyOfficialTasks", 
        verbose_name="Daily Official Tasks", 
        blank=True
    )

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
    friend_code = models.CharField(verbose_name="Friend Code", max_length=6, null=False)
    following = models.ManyToManyField('self', verbose_name="Following", related_name="followers", symmetrical=False, blank=True)
    saved_posts = models.ManyToManyField("Post", verbose_name="Saved Posts", related_name="saved_posts", blank=True)
    bio = models.TextField(verbose_name="Bio", max_length=100, null=True, blank=True)
    xp = models.PositiveIntegerField(verbose_name="Total XP", default=0, null=False)
    xp_boost_expiration_time = models.DateTimeField(verbose_name="XP Boost Expiration Time", auto_now_add=True, null=False)
    total_activities = models.PositiveIntegerField(verbose_name="Total Activities", default=0, null=False)
    activity_streak = models.PositiveIntegerField(verbose_name="Activity Streak", default=0, null=False)
    max_activity_streak = models.PositiveIntegerField(verbose_name="Max Activity Streak", default=0, null=False)
    last_activity_streak_increase_time = models.DateTimeField(verbose_name="Last Activity Streak Increase Time", auto_now_add=False, null=True, blank=True)
    private_account = models.BooleanField(verbose_name="Private Account", default=False, null=False)
    account_status = models.CharField(verbose_name="Account Status", max_length=20, choices=account_status_choices, default="unverified", null=False)
    last_login = models.DateTimeField(verbose_name="Last Login", auto_now_add=False, null=True, blank=True)
    reports = models.PositiveIntegerField(verbose_name="Reports", default=0, null=False)

    @property
    def total_received_likes(self):
        from .models import Post

        # Gets The Total Amount Of User's Received Likes On Posts From Other Users
        total_received_likes = Post.objects.filter(
            user=self
        ).aggregate(
            total=Count("likes_from_users", filter=~Q(likes_from_users=self))
        )["total"]

        return total_received_likes or 0 # Returns The User's Total Received Likes

    @property
    def total_transactions_amount(self):
        total_transactions_amount = self.transactions.aggregate(Sum("amount"))["amount__sum"] # Calculates And Gets The Dictionary With User's Total Transactions Amount
        return total_transactions_amount or 0 # Returns The User's Total Transactions Amount

    @property
    def level(self):
        if self.xp == 0:
            return 1

        return int(math.sqrt(self.xp / 100)) + 1 # Returns The User's Level According To Obtained XP

    @property
    def xp_for_next_level(self):
        next_level = self.level + 1 # Gets The Next Level
        return 100 * (next_level - 1) ** 2 # Returns The Amount Of XP Needed For Next Level

    @property
    def level_progress_percentage(self):
        current_level = self.level # Gets The Current Level
        xp_start_current_level = 100 * (current_level - 1) ** 2 # Gets The Starting Amount Of XP For Current Level
        xp_start_next_level = 100 * (current_level) ** 2 # Gets The Starting Amount Of XP For Next Level
        xp_needed_in_current_level = xp_start_next_level - xp_start_current_level # Gets The Amount Of XP Needed In The Current Level
        xp_gained_in_current_level = self.xp - xp_start_current_level # Gets The Amount Of XP Needed In The Current Level
        
        if xp_needed_in_current_level == 0:
            return 0
            
        return int((xp_gained_in_current_level / xp_needed_in_current_level) * 100) # Returns The Progress Percentage Of Current Level

    @property
    def years_since_registration(self):
        today = timezone.now().date() # Determines Today's Date
        registration_date = self.creation_time.date() # Gets The User's Registration Date
        years_since_registration = today.year - registration_date.year # Gets The Difference In Years

        # Subtracts 1 Year If The User Hasn't Had An Anniversary Yet
        if (today.month, today.day) < (registration_date.month, registration_date.day):
            years_since_registration -= 1

        return years_since_registration # Returns The Amount Of Years Since Registration

    def __str__(self):
        return f"{self.role}: {self.first_name} {self.last_name}"

class SpecialBadges(models.Model):
    user = models.ForeignKey(
        Users,
        verbose_name="User",
        on_delete=models.CASCADE,
        related_name="badges", 
        null=False
    )

    title = models.CharField(verbose_name="Title", max_length=50, null=False)
    data = models.CharField(verbose_name="Data", max_length=50, null=False)
    obtained_in = models.DateTimeField(verbose_name="Obtained In", auto_now_add=True, null=False)

class UserDailyOfficialTasks(models.Model):
    task = models.ForeignKey(
        "OfficialTasks",
        verbose_name="Official Task",
        on_delete=models.CASCADE,
        null=False
    )

    user = models.ForeignKey(
        Users,
        verbose_name="User",
        on_delete=models.CASCADE,
        null=False
    )

    progress_percentage = models.DecimalField(verbose_name="Progress Percentage", max_digits=5, decimal_places=2, default=0.00, null=False, validators=[MinValueValidator(0.00), MaxValueValidator(100.00)])
    is_completed = models.BooleanField(verbose_name="Is Completed", default=False, null=False)
    created_at = models.DateTimeField(verbose_name="Created At", auto_now_add=True, null=False)

    class Meta:
        unique_together = ("task", "user")

class UsersReport(models.Model):
    report_reason_choices = [
        ("spam", "spam"),
        ("harassment", "harassment"),
        ("hate_speech", "hate speech"),
        ("misinformation", "misinformation"),
        ("explicit_content", "explicit content"),
        ("other", "other")
    ]

    reported_user = models.ForeignKey(
        Users,
        verbose_name="Reported User",
        on_delete=models.CASCADE,
        null=False,
        related_name="reports_received"
    )

    reporting_user = models.ForeignKey(
        Users,
        verbose_name="Reporting User",
        on_delete=models.CASCADE,
        null=False,
        related_name="reports_sent"
    )

    reason = models.CharField(verbose_name="Reason", max_length=50, choices=report_reason_choices, default="other", null=False)
    created_at = models.DateTimeField(verbose_name="Created At", auto_now_add=True, null=False)

    class Meta:
        unique_together = ("reported_user", "reporting_user")
    
class Activity(models.Model):
    user = models.ForeignKey(
        Users, 
        verbose_name="User", 
        on_delete=models.DO_NOTHING, 
        related_name="activities", 
        null=True,
    )

    end_time = models.DateTimeField(verbose_name="End Time", auto_now_add=True, null=False)
    elapsed_time = models.PositiveIntegerField(verbose_name="Elapsed Time (Seconds)", default=0, null=False)
    gained_xp = models.PositiveIntegerField(verbose_name="Gained XP", default=0, null=False)
    type = models.CharField(verbose_name="Type", max_length=50, null=True)
    training_plan_day = models.PositiveIntegerField(verbose_name="Day", null=True, blank=True)
    training_plan_summary = models.JSONField(verbose_name="Training Plan Summary", default=list, null=True, blank=True)

class Reviews(models.Model):
    status_choices = [
        ("pending", "pending"),
        ("approved", "approved"),
        ("denied", "denied"),
        ("hidden", "hidden")
    ]

    user = models.ForeignKey(
        Users, 
        verbose_name="User", 
        on_delete=models.SET_NULL, 
        related_name="review", 
        null=True,
    )

    reports_from_users = models.ManyToManyField(
        Users, 
        through="ReviewReport", 
        verbose_name="Reports From Users", 
        related_name="reported_reviews", 
        blank=True
    )
    
    rating = models.PositiveIntegerField(verbose_name="Rating", default=0, null=False)
    review = models.TextField(verbose_name="Review", max_length=200, null=True)
    status = models.CharField(verbose_name="Status", choices=status_choices, max_length=20, default="pending")
    rejection_time = models.DateTimeField(verbose_name="Rejection Time", null=True, blank=True)
    reports = models.PositiveIntegerField(verbose_name="Reports", default=0, null=False)
    last_edit = models.DateTimeField(verbose_name="Last Edit Time", null=True, blank=True)
    creation_time = models.DateTimeField(verbose_name="Creation Time", auto_now_add=True, null=False)

class ReviewReport(models.Model):
    report_reason_choices = [
        ("spam", "spam"),
        ("harassment", "harassment"),
        ("hate_speech", "hate speech"),
        ("misinformation", "misinformation"),
        ("explicit_content", "explicit content"),
        ("other", "other")
    ]

    review = models.ForeignKey(
        Reviews,
        verbose_name="Review",
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
        unique_together = ("review", "user")

class Articles(models.Model):
    user = models.ForeignKey(
        Users, 
        verbose_name="User",
        on_delete=models.DO_NOTHING, 
        related_name="article", 
        null=True,
    )

    rating_from_users = models.ManyToManyField(
        Users, 
        through="ArticleRating",
        verbose_name="Rating From Users", 
        blank=True
    )

    title = models.CharField(verbose_name="Title", max_length=50, null=False)
    description = models.TextField(verbose_name="Description", max_length=250, null=False)
    image_name = models.CharField(verbose_name="Image File", max_length=50, null=False)
    html_filename = models.CharField(verbose_name="HTML Filename", max_length=50, null=True, blank=True)
    link = models.CharField(verbose_name="Link", max_length=50, null=False)
    categories = ArrayField(models.CharField(verbose_name="Categories", max_length=50), default=list, null=False)
    visitors = models.PositiveIntegerField(verbose_name="Visitors", default=0, null=False)
    creation_time = models.DateTimeField(verbose_name="Creation Time", auto_now_add=True, null=False)

    difficulty = models.IntegerField(verbose_name="Difficulty Percentage", default=0, null=False, validators=[MinValueValidator(0), MaxValueValidator(100)])
    time_to_learn = models.IntegerField(verbose_name="Time To Learn Percentage", default=0, null=False, validators=[MinValueValidator(0), MaxValueValidator(100)])
    time_to_learn_text = models.CharField(verbose_name="Time To Learn Text", max_length=20, null=False)
    rarity = models.IntegerField(verbose_name="Rarity Percentage", default=0, null=False, validators=[MinValueValidator(0), MaxValueValidator(100)])
    strength = models.IntegerField(verbose_name="Strength Percentage", default=0, null=False, validators=[MinValueValidator(0), MaxValueValidator(100)])
    technique = models.IntegerField(verbose_name="Technique Percentage", default=0, null=False, validators=[MinValueValidator(0), MaxValueValidator(100)])

class ArticleRating(models.Model):
    article = models.ForeignKey(
        Articles,
        verbose_name="Article",
        on_delete=models.CASCADE,
        null=False,
    )

    user = models.ForeignKey(
        Users,
        verbose_name="User",
        on_delete=models.CASCADE,
        null=False,
    )

    rating = models.PositiveIntegerField(verbose_name="Rating", default=0, null=False)
    created_at = models.DateTimeField(verbose_name="Created At", auto_now_add=True, null=False)

    class Meta:
        unique_together = ("article", "user")

class ArticleForum(models.Model):
    status_choices = [
        ("OK", "OK"),
        ("hidden", "hidden")
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
        on_delete=models.CASCADE, 
        related_name="article_comments",
        null=True,
    )

    reports_from_users = models.ManyToManyField(
        Users, 
        through="ArticleForumReport", 
        verbose_name="Reports From Users", 
        related_name="reported_article_forum_comments", 
        blank=True
    )

    comment = models.TextField(verbose_name="Comment", max_length=100, null=False)
    # tagged_users = models.ManyToManyField(Users, verbose_name="Tagged Users", blank=True)
    # added_hashtags = ArrayField(models.CharField(verbose_name="Added Hashtags", max_length=30), default=list, null=False)
    likes = models.PositiveIntegerField(verbose_name="Likes", default=0, null=False)
    likes_from_users = models.ManyToManyField(Users, verbose_name="Likes From Users", related_name="liked_article_forum_comments", blank=True)
    creation_time = models.DateTimeField(verbose_name="Creation Time", auto_now_add=True, null=False)

    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies",
    )

    status = models.CharField(verbose_name="Status", choices=status_choices, max_length=20, default="OK")
    reports = models.PositiveIntegerField(verbose_name="Reports", default=0, null=False)
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

class ArticleForumReport(models.Model):
    report_reason_choices = [
        ("spam", "spam"),
        ("harassment", "harassment"),
        ("hate_speech", "hate speech"),
        ("misinformation", "misinformation"),
        ("explicit_content", "explicit content"),
        ("other", "other")
    ]

    articleforum = models.ForeignKey(
        ArticleForum,
        verbose_name="Article Forum Comment",
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
        unique_together = ("articleforum", "user")

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
    day = models.PositiveIntegerField(verbose_name="Day", null=True, blank=True)
    type = models.CharField(verbose_name="Type", max_length=50, null=True)
    exercise = models.CharField(verbose_name="Exercise", max_length=50, null=False)
    periods = ArrayField(models.PositiveIntegerField(verbose_name="Reps"), default=list, null=False) # The Length Of The Array Represents Sets And The Amount Of Reps Represents The Values (0 = To Failute / Max. Reps)
    unit = models.CharField(verbose_name="Unit", max_length=20, choices=unit_choices, default="reps", null=False)
    order = models.PositiveIntegerField(verbose_name="Order", default=0, null=False)

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
    image_filename = models.CharField(verbose_name="Image Filename", max_length=50, null=True, blank=True)

class OfficialTasks(models.Model):
    title = models.CharField(verbose_name="Title", max_length=100, null=False)
    data = models.CharField(verbose_name="Data", max_length=100, null=False)
    xp = models.PositiveIntegerField(verbose_name="XP", default=0, null=False)

class CustomTasks(models.Model):
    user = models.ForeignKey(
        Users,
        verbose_name="User",
        on_delete=models.CASCADE,
        null=False,
    )

    title = models.CharField(verbose_name="Title", max_length=100, null=False)
    is_completed = models.BooleanField(verbose_name="Is Completed", default=False, null=False)
    order = models.PositiveIntegerField(verbose_name="Order", default=0, null=False)
    created_at = models.DateTimeField(verbose_name="Created At", auto_now_add=True, null=False)

class Transactions(models.Model):
    status_choices = [
        ("pending", "pending"),
        ("succeeded", "succeeded"),
        ("failed", "failed")
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
    # HLS Vide Files
    if filename == "index.m3u8":
        return f"posts/{instance.post.user_id}/videos/{instance.id}/index.m3u8" # For Example: posts/5/videos/12/index.m3u8

    if not hasattr(instance, '_random_uuid'):
        instance._random_uuid = secrets.token_hex(nbytes=10)

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
    likes = models.PositiveIntegerField(verbose_name="Likes", default=0, null=False)
    likes_from_users = models.ManyToManyField(Users, verbose_name="Likes From Users", related_name="liked_posts", blank=True)
    latest_interaction = models.DateTimeField(verbose_name="Latest Interaction", auto_now_add=True, db_index=True)
    created_at = models.DateTimeField(verbose_name="Created At", auto_now_add=True, null=False)
    reports = models.PositiveIntegerField(verbose_name="Reports", default=0, null=False)

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
    is_muted = models.BooleanField(verbose_name="Is Muted Video", default=False, null=False)
    is_processed = models.BooleanField(verbose_name="Is Processed", default=False, null=False)
    original_filename = models.CharField(verbose_name="Original Filename", max_length=255, null=True, blank=True)
    original_size = models.BigIntegerField(verbose_name="Original Size", null=True, blank=True)
    compressed_size = models.BigIntegerField(verbose_name="Compressed Size", null=True, blank=True)
    order = models.PositiveIntegerField(verbose_name="Order", default=0, null=False)

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
        ("hidden", "hidden")
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

    comment = models.TextField(verbose_name="Comment", max_length=100, null=False)
    # tagged_users = models.ManyToManyField(Users, verbose_name="Tagged Users", blank=True)
    # added_hashtags = ArrayField(models.CharField(verbose_name="Added Hashtags", max_length=30), default=list, null=False)
    likes = models.PositiveIntegerField(verbose_name="Likes", default=0, null=False)
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
    reports = models.PositiveIntegerField(verbose_name="Reports", default=0, null=False)
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

class BioLinks(models.Model):
    user = models.ForeignKey(
        Users,
        verbose_name="User",
        on_delete=models.CASCADE,
        related_name="bio_links",
        null=False
    )

    # title = models.CharField(verbose_name="Title", max_length=20, null=False)
    url = models.URLField(verbose_name="URL Address", max_length=200, null=False)

    @property
    def domain(self):
        url = urlparse(self.url) # Gets The URL
        domain = url.netloc.replace("www.", "") # Gets The Domain
        return domain # Returns The URL Domain