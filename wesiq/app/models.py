from tabnanny import verbose
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
from django.urls import reverse
from datetime import timedelta
from datetime import datetime, timezone as datetime_timezone
import stripe

class Users(models.Model):
    ROLE_CHOICES = [
        ("developer", "developer"),
        ("admin", "admin"),
        ("user", "user")
    ]

    ACCOUNT_STATUS_CHOICES = [
        ("unverified", "unverified"),
        ("OK", "OK"),
        ("suspended", "suspended"),
        ("deleted", "deleted")
    ]

    daily_official_tasks = models.ManyToManyField(
        "OfficialTasks", 
        through="UserDailyOfficialTasks", 
        verbose_name="Daily Official Tasks", 
        help_text="User's random generated daily official tasks.", 
        blank=True
    )

    following = models.ManyToManyField(
        "self", 
        through="FollowRelation",
        verbose_name="Following", 
        help_text="User's follow relations with other users.", 
        related_name="followers",
        symmetrical=False, 
        blank=True
    )

    first_name = models.CharField(
        verbose_name="First Name", 
        max_length=20, 
        null=True, blank=True
    )

    last_name = models.CharField(
        verbose_name="Last Name", 
        max_length=50, null=True, 
        blank=True
    )

    username = models.CharField(
        verbose_name="Username", 
        max_length=20, 
        null=False
    )

    email_address = models.CharField(
        verbose_name="E-mail Address", 
        max_length=50
    )

    phone_number = models.CharField(
        verbose_name="Phone Number", 
        max_length=50, 
        null=True
    )

    password = models.CharField(
        verbose_name="Password", 
        help_text="User's hashed password.", 
        max_length=255
    )

    role = models.CharField(
        verbose_name="Role", 
        choices=ROLE_CHOICES, 
        default="user", 
        max_length=20
    )

    profile_picture_name = models.CharField(
        verbose_name="Profile Picture File", 
        max_length=50, 
        null=True, 
        blank=True
    )

    language = models.CharField(
        verbose_name="Language Code", 
        help_text="User's default preferred language.", 
        max_length=10, 
        default="en", 
        null=False, 
        blank=False
    )

    last_edit = models.DateTimeField(
        verbose_name="Last Edit Time", 
        help_text="Time of the last account edition (only crucial changes).", 
        null=True, 
        blank=True
    )

    creation_time = models.DateTimeField(
        verbose_name="Creation Time", 
        help_text="User's account creation time.", 
        auto_now_add=True, 
        null=False
    )

    verification_code = models.CharField(
        verbose_name="Verification Code", 
        help_text="User's verification code to activate account.", 
        max_length=6, 
        null=True, 
        blank=True
    )

    password_reset_code = models.CharField(
        verbose_name="Password Reset Code", 
        help_text="User's password reset code to change the password.", 
        max_length=6, 
        null=True, 
        blank=True
    )

    google_id = models.CharField(
        verbose_name="Google ID", 
        max_length=255, 
        null=True, 
        blank=True
    )

    friend_code = models.CharField(
        verbose_name="Friend Code", 
        help_text="User's random generated friend code.", 
        max_length=6, 
        null=False
    )

    saved_posts = models.ManyToManyField(
        "Post", 
        verbose_name="Saved Posts", 
        help_text="User's saved posts of other users.", 
        related_name="saved_posts", 
        blank=True
    )

    bio = models.TextField(
        verbose_name="Bio", 
        max_length=100, 
        null=True, 
        blank=True
    )

    xp = models.PositiveIntegerField(
        verbose_name="Total XP", 
        help_text="User's total amount of obtained XP.", 
        default=0, 
        null=False
    )

    xp_boost_expiration_time = models.DateTimeField(
        verbose_name="XP Boost Expiration Time", 
        help_text="Stores the last time of XP boost expiration.", 
        auto_now_add=True, 
        null=False
    )

    total_activities = models.PositiveIntegerField(
        verbose_name="Total Activities", 
        default=0, 
        null=False
    )

    activity_streak = models.PositiveIntegerField(
        verbose_name="Activity Streak", 
        help_text="User's current activity streak.", 
        default=0, 
        null=False
    )

    max_activity_streak = models.PositiveIntegerField(
        verbose_name="Max Activity Streak", 
        help_text="Stores the user's maximum activity streak.", 
        default=0, 
        null=False
    )

    last_activity_streak_increase_time = models.DateTimeField(
        verbose_name="Last Activity Streak Increase time", 
        help_text="Stores the user's last activity streak increase time.", 
        auto_now_add=False, 
        null=True, 
        blank=True
    )

    private_account = models.BooleanField(
        verbose_name="Private Account", 
        help_text="Stores the information if the user's account is private.", 
        default=False, 
        null=False
    )

    account_status = models.CharField(
        verbose_name="Account Status", 
        help_text="User's account Status.", 
        max_length=20, 
        choices=ACCOUNT_STATUS_CHOICES, 
        default="unverified", 
        null=False
    )

    suspension_time = models.DateTimeField(
        verbose_name="Suspension time", 
        help_text="Stores the user's suspension time if had any.", 
        null=True, 
        blank=True
    )

    last_login = models.DateTimeField(
        verbose_name="Last Login", 
        help_text="Stores the time of the user's last login.", 
        auto_now_add=False, 
        null=True, 
        blank=True
    )

    reports = models.PositiveIntegerField(
        verbose_name="Reports", 
        help_text="User's reports amount.", 
        default=0, 
        null=False
    )

    data_saving_mode = models.BooleanField(
        verbose_name="Data Saving Mode", 
        help_text="Stores the information if the user has turned on the data saving mode.", 
        default=False, 
        null=False
    )

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

    class Meta:
        verbose_name = _("Užívateľ")
        verbose_name_plural = _("Užívatelia")
        ordering = ["creation_time"]

    def __str__(self):
        return f"{self.role}: {self.first_name} {self.last_name}"

    def get_absolute_url(self):
        return reverse("profile_url", kwargs={"username": self.username})

class FollowRelation(models.Model):
    STATUS_CHOICES = [
        ("pending", "pending"),
        ("accepted", "accepted")
    ]

    from_user = models.ForeignKey(
        "Users", 
        related_name="following_relations", 
        help_text="Follow from the selected user.", 
        on_delete=models.CASCADE,
        null=False
    )

    to_user = models.ForeignKey(
        "Users", 
        related_name="follower_relations", 
        help_text="Follow to the selected user.", 
        on_delete=models.CASCADE,
        null=False
    )
    
    status = models.CharField(
        verbose_name="Status", 
        help_text="Status of the follow relation.", 
        max_length=10, 
        choices=STATUS_CHOICES, 
        default="accepted", 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name="Created At", 
        help_text="Time of the follow relation creation.", 
        auto_now_add=True, 
        null=False
    )

    class Meta:
        verbose_name = _("Vzťah užívateľov")
        unique_together = ("from_user", "to_user")

    def __str__(self):
        return _("From %(from_user)s to %(to_user)s.") % {"from_user": self.from_user, "to_user": self.to_user}

class SpecialBadges(models.Model):
    user = models.ForeignKey(
        Users,
        verbose_name="User",
        help_text="Stores the receiver Of the Badge.", 
        on_delete=models.CASCADE,
        related_name="badges", 
        null=False
    )

    title = models.CharField(
        verbose_name="Title", 
        help_text="Full title of the badge.",
        max_length=50, 
        null=False
    )

    data = models.CharField(
        verbose_name="Data", 
        help_text="Spaceless title of the badge used in the programming logic.",
        max_length=50, 
        null=False
    )

    obtained_in = models.DateTimeField(
        verbose_name="Obtained In", 
        help_text="Time of receivation of the badge.", 
        auto_now_add=True, 
        null=False
    )

    class Meta:
        verbose_name = _("Špeciálny odznak")
        verbose_name_plural = _("Špeciálne odznaky")

    def __str__(self):
        return _('%(first_name)s %(last_name)s získal "%(title)s" v %(obtained_in)s.') % {"first_name": self.user.first_name, "last_name": self.user.last_name, "title": self.title, "obtained_in": self.obtained_in}

class UserDailyOfficialTasks(models.Model):
    task = models.ForeignKey(
        "OfficialTasks",
        verbose_name="Official Task",
        help_text="Full title of the task.",
        on_delete=models.CASCADE,
        null=False
    )

    user = models.ForeignKey(
        Users,
        verbose_name="User",
        help_text="The user to whom the task belongs.",
        on_delete=models.CASCADE,
        null=False
    )

    progress_percentage = models.DecimalField(
        verbose_name="Progress Percentage", 
        help_text="Task's progress percentage of completion.",
        max_digits=5, 
        decimal_places=2, 
        default=0.00, 
        null=False, 
        validators=[MinValueValidator(0.00), MaxValueValidator(100.00)]
    )

    is_completed = models.BooleanField(
        verbose_name="Is Completed", 
        help_text="Stores the information if the task is completed.",
        default=False, 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name="Created At", 
        help_text="Time of the generation of the task.",
        auto_now_add=True, 
        null=False
    )

    class Meta:
        unique_together = ("task", "user")
        verbose_name = _("Denná oficiálna úloha užívateľa")
        verbose_name_plural = _("Denné oficiálne úlohy užívateľov")

    def __str__(self):
        if self.is_completed:
            return _('%(first_name)s %(last_name)s splnil úlohu "%(title)s".') % {"first_name": self.user.first_name, "last_name": self.user.last_name, "title": self.task.title}

        else:
            return _('%(first_name)s %(last_name)s splnil úlohu "%(title)s" na %(progress_percentage)s%.') % {"first_name": self.user.first_name, "last_name": self.user.last_name, "title": self.task.title, "progress_percentage": self.progress_percentage}

class UsersReport(models.Model):
    REPORT_REASON_CHOICES = [
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
        help_text="The user against whom the report was filed.",
        on_delete=models.CASCADE,
        null=False,
        related_name="reports_received"
    )

    reporting_user = models.ForeignKey(
        Users,
        verbose_name="Reporting User",
        help_text="The user who submitted the report.",
        on_delete=models.CASCADE,
        null=False,
        related_name="reports_sent"
    )

    reason = models.CharField(
        verbose_name="Reason", 
        help_text="Reason of the given report.",
        max_length=50, 
        choices=REPORT_REASON_CHOICES, 
        default="other", 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name="Created At", 
        help_text="Time the report was submitted.",
        auto_now_add=True, 
        null=False
    )

    class Meta:
        unique_together = ("reported_user", "reporting_user")
        verbose_name = _("Nahlásenie užívateľa")
        verbose_name_plural = _("Nahlásenia užívateľov")

    def __str__(self):
        return _("Užívateľ %(reporting_user_first_name)s %(reporting_user_last_name)s nahlásil užívateľa %(reported_user_first_name)s %(reported_user_last_name)s.") % {"reported_user_first_name": self.reported_user.first_name, "reported_user_last_name": self.reported_user.last_name, "reporting_user_first_name": self.reporting_user.first_name, "reporting_user_last_name": self.reporting_user.last_name}
    
class Activity(models.Model):
    user = models.ForeignKey(
        Users, 
        verbose_name="User", 
        help_text="The user to whom the activity record belongs.", 
        on_delete=models.DO_NOTHING, 
        related_name="activities", 
        null=True,
    )

    end_time = models.DateTimeField(
        verbose_name="End Time", 
        help_text="Activity end time.", 
        auto_now_add=True, 
        null=False
    )

    elapsed_time = models.PositiveIntegerField(
        verbose_name="Elapsed Time (Seconds)", 
        help_text="Duration of the activity in seconds.", 
        default=0, 
        null=False
    )

    gained_xp = models.PositiveIntegerField(
        verbose_name="Gained XP", 
        help_text="Amount of XP received for activity.", 
        default=0, 
        null=False
    )

    type = models.CharField(
        verbose_name="Type", 
        help_text="Selected activity name.", 
        max_length=50, 
        null=True
    )

    training_plan_day = models.PositiveIntegerField(
        verbose_name="Day", 
        help_text="Assigned activity day.", 
        null=True, 
        blank=True
    )

    training_plan_summary = models.JSONField(
        verbose_name="Training Plan Summary", 
        help_text="Data recorded for an activity completed according to the training plan.", 
        default=list, 
        null=True, 
        blank=True
    )

    class Meta:
        verbose_name = _("Aktivita")
        verbose_name_plural = _("Aktivity")

    def __str__(self):
        return _("Užívateľ %(first_name)s %(last_name)s zaznamenal %(elapsed_time)s sekúnd aktívneho času.") % {"first_name": self.user.first_name, "last_name": self.user.last_name, "elapsed_time": self.elapsed_time}

class Reviews(models.Model):
    STATUS_CHOICES = [
        ("pending", "pending"),
        ("approved", "approved"),
        ("denied", "denied"),
        ("hidden", "hidden")
    ]

    user = models.ForeignKey(
        Users, 
        verbose_name="User", 
        help_text="The user who wrote the review.", 
        on_delete=models.SET_NULL, 
        related_name="review", 
        null=True,
    )

    reports_from_users = models.ManyToManyField(
        Users, 
        through="ReviewReport", 
        verbose_name="Reports From Users", 
        help_text="Users who submitted a report.", 
        related_name="reported_reviews", 
        blank=True
    )
    
    rating = models.PositiveIntegerField(
        verbose_name="Rating", 
        help_text="Rating from 1 to 5.", 
        default=0, 
        null=False
    )

    review = models.TextField(
        verbose_name="Review", 
        help_text="Content of the written review.", 
        max_length=200, 
        null=True
    )

    status = models.CharField(
        verbose_name="Status", 
        help_text="Current status of the written review.", 
        choices=STATUS_CHOICES, 
        max_length=20, 
        default="pending"
    )

    rejection_time = models.DateTimeField(
        verbose_name="Rejection Time", 
        help_text="Review rejection time.", 
        null=True, 
        blank=True
    )

    reports = models.PositiveIntegerField(
        verbose_name="Reports", 
        help_text="Amount of total obtained reports.", 
        default=0, 
        null=False
    )

    last_edit = models.DateTimeField(
        verbose_name="Last Edit Time", 
        help_text="Time of the last editing.", 
        null=True, 
        blank=True
    )

    creation_time = models.DateTimeField(
        verbose_name="Creation Time", 
        help_text="Time of the review submission.", 
        auto_now_add=True, 
        null=False
    )

    class Meta:
        verbose_name = _("Recenzia")
        verbose_name_plural = _("Recenzie")

    def __str__(self):
        if(self.rating > 1):
            return _("Užívateľ %(first_name)s %(last_name)s pridal recenziu s %(rating)s hviezdičkami.") % {"first_name": self.user.first_name, "last_name": self.user.last_name, "rating": self.rating}

        else:
            return _("Užívateľ %(first_name)s %(last_name)s pridal recenziu s %(rating)s hviezdičkou.") % {"first_name": self.user.first_name, "last_name": self.user.last_name, "rating": self.rating}

class ReviewReport(models.Model):
    REPORT_REASON_CHOICES = [
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
        help_text="A review that has been reported.", 
        on_delete=models.CASCADE,
        null=False,
    )

    user = models.ForeignKey(
        Users,
        verbose_name="User",
        help_text="The user who reported the review.", 
        on_delete=models.CASCADE,
        null=False,
    )

    reason = models.CharField(
        verbose_name="Reason", 
        help_text="Reason for reporting the review.", 
        max_length=50, 
        choices=REPORT_REASON_CHOICES, 
        default="other", 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name="Created At", 
        help_text="Time of review report submission.", 
        auto_now_add=True, 
        null=False
    )

    class Meta:
        unique_together = ("review", "user")
        verbose_name = _("Nahlásená recenzia")
        verbose_name_plural = _("Nahlásené recenzie")

    def __str__(self):
        return _("Užívateľ %(first_name)s %(last_name)s nahlásil recenziu od %(reviewer_first_name)s %(reviewer_last_name)s.") % {"first_name": self.user.first_name, "last_name": self.user.last_name, "reviewer_first_name": self.review.user.first_name, "reviewer_last_name": self.review.user.last_name}

class Articles(models.Model):
    user = models.ForeignKey(
        Users, 
        verbose_name="User",
        help_text="The user who owns the article.", 
        on_delete=models.DO_NOTHING, 
        related_name="article", 
        null=True,
    )

    rating_from_users = models.ManyToManyField(
        Users, 
        through="ArticleRating",
        verbose_name="Rating From Users", 
        help_text="User rating of the article.", 
        blank=True
    )

    title = models.CharField(
        verbose_name="Title", 
        help_text="Title of the article.", 
        max_length=50, 
        null=False
    )

    description = models.TextField(
        verbose_name="Description", 
        help_text="Description of the article.", 
        max_length=250, 
        null=False
    )

    image_name = models.CharField(
        verbose_name="Image File", 
        help_text="Filename of the banner image of the article.", 
        max_length=50, 
        null=False
    )

    html_filename = models.CharField(
        verbose_name="HTML Filename", 
        help_text="Filename of the HTML template of the article.", 
        max_length=50, 
        null=True, 
        blank=True
    )

    link = models.CharField(
        verbose_name="Link", 
        help_text="URL of the article.", 
        max_length=50, 
        null=False
    )

    categories = ArrayField(
        models.CharField(
            verbose_name="Categories", 
            help_text="Categories corresponding to the article.", 
            max_length=50
        ), 
        
        default=list, 
        null=False
    )

    visitors = models.PositiveIntegerField(
        verbose_name="Visitors", 
        help_text="Amount of the article's visitors.", 
        default=0, 
        null=False
    )

    creation_time = models.DateTimeField(
        verbose_name="Creation Time", 
        help_text="Time of the article creation.", 
        auto_now_add=True, 
        null=False
    )

    difficulty = models.IntegerField(
        verbose_name="Difficulty Percentage", 
        help_text="Exercise difficulty in percent.", 
        default=0, 
        null=False, 
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    time_to_learn = models.IntegerField(
        verbose_name="Time To Learn Percentage", 
        help_text="Exercise time to learn in percent.", 
        default=0, 
        null=False, 
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    time_to_learn_text = models.CharField(
        verbose_name="Time To Learn Text", 
        help_text="Exercise time to learn labeled text.", 
        max_length=20, 
        null=False
    )

    rarity = models.IntegerField(
        verbose_name="Rarity Percentage", 
        help_text="Exercise rarity in percent.", 
        default=0, 
        null=False, 
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    strength = models.IntegerField(
        verbose_name="Strength Percentage", 
        help_text="Exercise required strength in percent.", 
        default=0, 
        null=False, 
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    technique = models.IntegerField(
        verbose_name="Technique Percentage", 
        help_text="The technical difficulty value of the exercise, expressed as a percentage.", 
        default=0, 
        null=False, 
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    class Meta:
        verbose_name = _("Článok")
        verbose_name_plural = _("Články")

    def __str__(self):
        return self.title

class ArticleRating(models.Model):
    article = models.ForeignKey(
        Articles,
        verbose_name="Article",
        help_text="The article to which the given rating applies.", 
        on_delete=models.CASCADE,
        null=False,
    )

    user = models.ForeignKey(
        Users,
        verbose_name="User",
        help_text="The user who rated the article.", 
        on_delete=models.CASCADE,
        null=False,
    )

    rating = models.PositiveIntegerField(
        verbose_name="Rating", 
        help_text="Rating from 1 to 5.", 
        default=0, 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name="Created At", 
        help_text="Time the article rating was submitted.", 
        auto_now_add=True, 
        null=False
    ) 

    class Meta:
        unique_together = ("article", "user")
        verbose_name = _("Recenzia článku")
        verbose_name_plural = _("Recenzie článkov")

    def __str__(self):
        return _("Užívateľ %(first_name)s %(last_name)s pridal recenziu pre článok: %(article_title)s.") % {"first_name": self.user.first_name, "last_name": self.user.last_name, "article_title": self.article.title}

class ArticleForum(models.Model):
    STATUS_CHOICES = [
        ("OK", "OK"),
        ("hidden", "hidden")
    ]

    article = models.ForeignKey(
        Articles, 
        verbose_name="Article", 
        help_text="Time the article rating was submitted.", 
        on_delete=models.DO_NOTHING, 
        related_name="comments", 
        null=False,
    )

    user = models.ForeignKey(
        Users, 
        verbose_name="User", 
        help_text="The user who wrote the comment.", 
        on_delete=models.CASCADE, 
        related_name="article_comments",
        null=True,
    )

    reports_from_users = models.ManyToManyField(
        Users, 
        through="ArticleForumReport", 
        verbose_name="Reports From Users", 
        help_text="Users who reported the comment.", 
        related_name="reported_article_forum_comments", 
        blank=True
    )

    comment = models.TextField(
        verbose_name="Comment", 
        help_text="Comment content.", 
        max_length=100, 
        null=False
    )

    # tagged_users = models.ManyToManyField(Users, verbose_name="Tagged Users", blank=True)
    # added_hashtags = ArrayField(models.CharField(verbose_name="Added Hashtags", max_length=30), default=list, null=False)

    likes = models.PositiveIntegerField(
        verbose_name="Likes", 
        help_text="Number of likes on the comment.", 
        default=0, 
        null=False
    )

    likes_from_users = models.ManyToManyField(
        Users, 
        verbose_name="Likes From Users", 
        help_text="Users who liked the comment.", 
        related_name="liked_article_forum_comments", 
        blank=True
    )

    creation_time = models.DateTimeField(
        verbose_name="Creation Time", 
        help_text="Time the comment was written.", 
        auto_now_add=True, 
        null=False
    )

    parent = models.ForeignKey(
        "self",
        verbose_name="Parent",
        help_text="Link to the parent comment in the case of a reply.", 
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies",
    )

    status = models.CharField(
        verbose_name="Status", 
        help_text="Current status of the comment.", 
        choices=STATUS_CHOICES, 
        max_length=20, 
        default="OK"
    )

    reports = models.PositiveIntegerField(
        verbose_name="Reports", 
        help_text="Amount of received reports of the comment.", 
        default=0, 
        null=False
    )

    level = models.PositiveIntegerField(
        verbose_name="Level", 
        help_text="Comment nesting level (1 is a main comment; deeper levels are replies)", 
        default=1
    )

    def save(self, *args, **kwargs):
        if self.parent:
            calculated_level = self.parent.level + 1
            
            if calculated_level > 5:
                raise ValidationError(_("Maximum level of nested comments has been reached."))
            
            self.level = calculated_level
            
        else:
            self.level = 1
            
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = _("Komentár článku")
        verbose_name_plural = _("Komentáre článkov")

    def __str__(self):
        return _("Užívateľ %(first_name)s %(last_name)s pridal komentár pre článok: %(article_title)s.") % {"first_name": self.user.first_name, "last_name": self.user.last_name, "article_title": self.article.title}

class ArticleForumReport(models.Model):
    REPORT_REASON_CHOICES = [
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
        help_text="The article comment that received a report.", 
        on_delete=models.CASCADE,
        null=False,
    )

    user = models.ForeignKey(
        Users,
        verbose_name="User",
        help_text="The user who submitted the report.", 
        on_delete=models.CASCADE,
        null=False,
    )

    reason = models.CharField(
        verbose_name="Reason", 
        help_text="Reason for reporting.", 
        max_length=50, 
        choices=REPORT_REASON_CHOICES, 
        default="other", 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name="Created At", 
        help_text="Report submission time.", 
        auto_now_add=True, 
        null=False
    )

    class Meta:
        unique_together = ("articleforum", "user")
        verbose_name = _("Nahlásenie komentáru článku")
        verbose_name_plural = _("Nahlásenia komentárov článkov")

    def __str__(self):
        return _("Užívateľ %(first_name)s %(last_name)s nahlásil komentár od %(reported_first_name)s %(reported_last_name)s.") % {"first_name": self.user.first_name, "last_name": self.user.last_name, "reported_first_name": self.articleforum.user.first_name, "reported_last_name": self.articleforum.user.last_name}

class TrainingPlan(models.Model):
    UNIT_CHOICES = [
        ("reps", "reps"),
        ("seconds", "seconds"),
        ("steps", "steps"),
    ]

    user = models.ForeignKey(
        Users,
        verbose_name="User",
        help_text="The user to whom the training plan belongs.", 
        on_delete=models.DO_NOTHING,
        related_name="training_plans",
        null=True,
    )

    training_plan_key = models.CharField(
        verbose_name="Training Plan Key", 
        help_text="Random identification key for the training plan.", 
        max_length=50, 
        default="None", 
        null=False, 
        blank=False
    )

    day = models.PositiveIntegerField(
        verbose_name="Day", 
        help_text="Training plan day.", 
        null=True, 
        blank=True
    )

    type = models.CharField(
        verbose_name="Type", 
        help_text="Training plan name.", 
        max_length=50, 
        null=True
    )

    exercise = models.CharField(
        verbose_name="Exercise", 
        help_text="Exercise name.", 
        max_length=50, 
        null=False
    )

    periods = ArrayField(
        models.PositiveIntegerField(
            verbose_name="Reps"
        ), 

        help_text="Exercise periods (the length of the array represents sets and the amount of reps represents the values (0 = to failute / max. reps).", 
        default=list, 
        null=False
    )

    unit = models.CharField(
        verbose_name="Unit", 
        help_text="The unit in which the exercise is measured.", 
        max_length=20, 
        choices=UNIT_CHOICES, 
        default="reps", 
        null=False
    )

    order = models.PositiveIntegerField(
        verbose_name="Order", 
        help_text="The order of the exercise in the training plan.", 
        default=0, 
        null=False
    )

    class Meta:
        verbose_name = _("Tréningový plán")
        verbose_name_plural = _("Tréningové plány")

    def __str__(self):
        return _("Tréningový plán užívateľa %(first_name)s %(last_name)s.") % {"first_name": self.user.first_name, "last_name": self.user.last_name}

class Exercises(models.Model):
    UNIT_CHOICES = [
        ("reps", "reps"),
        ("seconds", "seconds"),
        ("steps", "steps"),
    ]

    exercise = models.CharField(
        verbose_name="Exercise", 
        help_text="Exercise name.", 
        max_length=50, 
        null=False
    )

    unit = models.CharField(
        verbose_name="Unit", 
        help_text="The unit in which the exercise is measured.", 
        max_length=20, 
        choices=UNIT_CHOICES, 
        default="reps", 
        null=False
    )

    categories = ArrayField(
        models.CharField(
            verbose_name="Categories", 
            max_length=50
        ), 
        
        help_text="Categories the given exercise falls into.", 
        default=list, 
        null=False
    )

    requires_weight = models.BooleanField(
        verbose_name="Requires Weight", 
        help_text="Stores the information if the exercise requires the additional weight.", 
        default=False, 
        null=False
    )

    image_filename = models.CharField(
        verbose_name="Image Filename", 
        help_text="Stores the filename of the exercise image.", 
        max_length=50, 
        null=True, 
        blank=True
    )

    class Meta:
        verbose_name = _("Cvik")
        verbose_name_plural = _("Cviky")

    def __str__(self):
        return self.exercise

class OfficialTasks(models.Model):
    title = models.CharField(
        verbose_name="Title", 
        help_text="Title of the task.", 
        max_length=100, 
        null=False
    )

    data = models.CharField(
        verbose_name="Data", 
        help_text="Spaceless title of the task used in the programming logic.",
        max_length=100, 
        null=False
    )

    xp = models.PositiveIntegerField(
        verbose_name="XP", 
        help_text="Amount of XP upon completing the task.",
        default=0, 
        null=False
    )

    class Meta:
        verbose_name = _("Oficiálna úloha")
        verbose_name_plural = _("Oficiálne úlohy")

    def __str__(self):
        return _("Oficiálna úloha za %(xp)s XP.") % {"xp": self.xp}

class CustomTasks(models.Model):
    user = models.ForeignKey(
        Users,
        verbose_name="User",
        help_text="The user who created a custom task.",
        on_delete=models.CASCADE,
        null=False,
    )

    title = models.CharField(
        verbose_name="Title", 
        help_text="Title of the custom task.",
        max_length=100, 
        null=False
    )

    is_completed = models.BooleanField(
        verbose_name="Is Completed", 
        help_text="Stores the information if the task is completed.",
        default=False, 
        null=False
    )

    order = models.PositiveIntegerField(
        verbose_name="Order", 
        help_text="Order of the task.",
        default=0, 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name="Created At", 
        help_text="Time of creation of the task.",
        auto_now_add=True, 
        null=False
    )

    class Meta:
        verbose_name = _("Vlastná úloha")
        verbose_name_plural = _("Vlastné úlohy")

    def __str__(self):
        return _("Vlastná úloha užívateľa %(first_name)s %(last_name)s.") % {"first_name": self.user.first_name, "last_name": self.user.last_name}

class Transactions(models.Model):
    STATUS_CHOICES = [
        ("pending", "pending"),
        ("succeeded", "succeeded"),
        ("failed", "failed")
    ]

    user = models.ForeignKey(
        Users,
        verbose_name="User",
        help_text="The user who created the transaction.",
        on_delete=models.DO_NOTHING,
        related_name="transactions",
        null=True,
    )

    stripe_intent_id = models.CharField(
        verbose_name="Stripe ID", 
        help_text="Transaction ID in the Stripe service.",
        max_length=255, 
        unique=True, 
        null=False
    )

    cardholder_name = models.CharField(
        verbose_name="Cardholder Name", 
        help_text="Cardholder's name.",
        max_length=50, 
        null=True
    )

    # In €
    amount = models.DecimalField(
        verbose_name="Amount (€)", 
        help_text="Volume of processed funds in EUR.",
        max_digits=10, 
        decimal_places=2, 
        default=0, 
        null=False
    )

    status = models.CharField(
        verbose_name="Status", 
        help_text="Status of the added transaction.",
        max_length=20, 
        choices=STATUS_CHOICES, 
        default="pending", 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name="Created At", 
        help_text="Transaction addition time.",
        auto_now_add=True, 
        null=False
    )

    title = models.CharField(
        verbose_name="Title", 
        help_text="Title of the payment.",
        max_length=20, 
        null=True
    )

    class Meta:
        verbose_name = _("Transakcia")
        verbose_name_plural = _("Transakcie")

    def __str__(self):
        return f"{self.cardholder_name} - {self.amount}€ ({self.status})"

class Subscription(models.Model):
    PLAN_CHOICES = [
        ("free", _("Zadarmo")),
        ("basic", _("Základné")),
        ("premium", _("Prémiové"))
    ]

    user = models.OneToOneField(
        Users, 
        verbose_name="User",
        help_text="The user who activated the subscription.", 
        on_delete=models.CASCADE, 
        related_name="subscription",
        null=False
    )
    
    stripe_subscription_id = models.CharField(
        verbose_name="Stripe Subscription ID",
        help_text="ID of the Stripe subscription.", 
        max_length=255, 
        unique=True,
        null=True, 
        blank=True
    )

    plan = models.CharField(
        verbose_name="Plan",
        help_text="Activated subscription plan.", 
        max_length=20, 
        choices=PLAN_CHOICES, 
        default="free",
        null=False
    )

    is_active = models.BooleanField(
        verbose_name="Is Active", 
        help_text="Stores the information if the subscription is still active.", 
        default=False, 
        null=False
    )

    is_cancelled = models.BooleanField(
        verbose_name="Is Cancelled", 
        help_text="Stores the information if the subscription is cancelled. The subscription will end at the end of the billing period.", 
        default=False, 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name="Created At", 
        help_text="Time the subscription was added.", 
        auto_now_add=True, 
        null=False
    )

    updated_at = models.DateTimeField(
        verbose_name="Created At", 
        help_text="Time the subscription was updated.", 
        auto_now=True,
        null=False
    )

    @property
    def remaining_time(self):
        if not self.stripe_subscription_id or not self.is_active:
            return _("Žiadne aktívne predplatné")

        try:
            stripe_subscription = stripe.Subscription.retrieve(self.stripe_subscription_id) # Gets The Stripe Subscription
            subscription_dict = stripe_subscription.to_dict() # Converts The Stripe Subscription Data Into The Dictionary Format

            items = subscription_dict.get("items", {}).get("data", [])

            if not items:
                return _("Nepodarilo sa načítať dáta.")

            end_time = items[0].get("current_period_end") # Gets The End Time

            if not end_time:
                return _("Nepodarilo sa načítať dáta.")

            end_date = datetime.fromtimestamp(end_time, tz=datetime_timezone.utc) # Gets The End Date
            now = datetime.now(datetime_timezone.utc) # Gets The Current Time

            remaining_time = end_date - now # Calculates The Remaining Time

            remaining_seconds = int(remaining_time.total_seconds()) # Calculates The Remaining Seconds

            if remaining_seconds <= 0:
                return _("Predplatné vypršalo.")

            remaining_days = remaining_seconds // 86400 # Calculates The Remaining Days

            if remaining_days > 0:
                return _("Ostáva %(remaining_days)s dní") % {
                    "remaining_days": remaining_days
                }

            remaining_hours = remaining_seconds // 3600 # Calculates The Remaining Hours

            return _("Ostáva %(remaining_hours)s hodín") % {
                "remaining_hours": remaining_hours
            }

        except Exception:
            return _("Nepodarilo sa načítať dáta.")

    class Meta:
        verbose_name = _("Predplatné")

    def __str__(self):
        if self.is_active:
            return _("Užívateľ %(first_name)s %(last_name)s má aktívne predplatné.") % {"first_name": self.user.first_name, "last_name": self.user.last_name}

        else:
            return _("Užívateľ %(first_name)s %(last_name)s nemá aktívne predplatné.") % {"first_name": self.user.first_name, "last_name": self.user.last_name}

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
        help_text="The user who uploaded the post.",
        on_delete=models.CASCADE,
        related_name="posts",
        null=False,
    )

    seen_by = models.ManyToManyField(
        Users, 
        through="SeenPost",
        verbose_name="Seen By",
        help_text="Users who have already seen the post.",
        related_name="viewed_posts"
    )

    reports_from_users = models.ManyToManyField(
        Users, 
        through="PostReport", 
        verbose_name="Reports From Users", 
        help_text="Users who reported the post.",
        related_name="reported_posts", 
        blank=True
    )

    description = models.TextField(
        verbose_name="Description", 
        help_text="Description of the post.",
        max_length=500, 
        null=True, 
        blank=True
    )

    tagged_users = models.ManyToManyField(
        Users, 
        verbose_name="Tagged Users", 
        help_text="Users tagged in the post.",
        blank=True
    )

    added_hashtags = ArrayField(
        models.CharField(
            verbose_name="Added Hashtags", 
            max_length=30
        ), 
        
        help_text="Hashtags added to the post.",
        default=list, 
        null=False
    )

    location = models.CharField(
        verbose_name="Location", 
        help_text="Location added to the post.",
        max_length=255, 
        null=True, 
        blank=True
    )

    coordinates = models.PointField(
        verbose_name="Coordinates", 
        help_text="The exact coordinates of the location added to the post in WGS84 (Standardized, Geocentric Coordinate System Used Globally For Mapping, Navigation And GPS) format.",
        null=True, 
        blank=True, 
        srid=4326
    )

    public_visibility = models.BooleanField(
        verbose_name="Public Visibility", 
        help_text="Stores the information if the post is visible for public.",
        default=True, 
        null=False
    )

    allow_comments = models.BooleanField(
        verbose_name="Allow Comments", 
        help_text="Stores the information if the comments are allowed for the post.",
        default=True, 
        null=False
    )

    hide_likes = models.BooleanField(
        verbose_name="Hide Likes", 
        help_text="Stores the information if the post's likes are hidden.",
        default=False, 
        null=False
    )

    likes = models.PositiveIntegerField(
        verbose_name="Likes", 
        help_text="Total amount of obtained likes.",
        default=0, 
        null=False
    )

    likes_from_users = models.ManyToManyField(
        Users, 
        verbose_name="Likes From Users", 
        help_text="Users who liked the post.", 
        related_name="liked_posts", 
        blank=True
    )

    latest_interaction = models.DateTimeField(
        verbose_name="Latest Interaction", 
        help_text="Time of the last recorded interaction with the post (new comment, like).", 
        auto_now_add=True, 
        db_index=True
    )

    created_at = models.DateTimeField(
        verbose_name="Created At", 
        help_text="Time of creation of the post.", 
        auto_now_add=True, 
        null=False
    )

    reports = models.PositiveIntegerField(
        verbose_name="Reports", 
        help_text="Amount of received reports of the post.", 
        default=0, 
        null=False
    )

    def get_absolute_url(self):
        return reverse("post_url", kwargs={"post_id": self.id})

    class Meta:
        verbose_name = _("Príspevok")
        verbose_name_plural = _("Príspevky")

    def __str__(self):
        return _("Príspevok užívateľa %(first_name)s %(last_name)s.") % {"first_name": self.user.first_name, "last_name": self.user.last_name}

class PostReport(models.Model):
    REPORT_REASON_CHOICES = [
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
        help_text="The post that received a report.", 
        on_delete=models.CASCADE,
        null=False,
    )

    user = models.ForeignKey(
        Users,
        verbose_name="User",
        help_text="The user who submitted the report.", 
        on_delete=models.CASCADE,
        null=False,
    )

    reason = models.CharField(
        verbose_name="Reason", 
        help_text="Reason for reporting.", 
        max_length=50, 
        choices=REPORT_REASON_CHOICES, 
        default="other", 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name="Created At", 
        help_text="Report submission time.", 
        auto_now_add=True, 
        null=False
    )

    class Meta:
        unique_together = ("post", "user")
        verbose_name = _("Príspevok")
        verbose_name_plural = _("Príspevky")

    def __str__(self):
        return _("Užívateľ %(first_name)s %(last_name)s nahlásil príspevok užívateľa %(reported_first_name)s %(reported_last_name)s.") % {"first_name": self.user.first_name, "last_name": self.user.last_name, "reported_first_name": self.post.user.first_name, "reported_last_name": self.post.user.last_name}

class PostMedia(models.Model):
    post = models.ForeignKey(
        Post,
        verbose_name="Post",
        help_text="The post to which the given medium belongs.", 
        on_delete=models.CASCADE,
        related_name="media",
        null=False,
    )

    file = models.FileField(
        upload_to=getPostUploadPath,
        verbose_name="File",
        help_text="Path to the file.", 
    )
    
    thumbnail = models.ImageField(
        upload_to=getPostUploadPath, 
        verbose_name="Thumbnail",
        help_text="Path to the video thumbnail.", 
        null=True, 
        blank=True,
    )

    is_video = models.BooleanField(
        verbose_name="Is Video", 
        help_text="Stores the information if the uploaded file is a video.", 
        default=False, 
        null=False
    )

    is_muted = models.BooleanField(
        verbose_name="Is Muted Video", 
        help_text="Stores the information if the uploaded video is muted.", 
        default=False, 
        null=False
    )

    total_watch_time = models.FloatField(
        verbose_name="Total Watch Time", 
        help_text="Total video watch time in seconds.", 
        null=True, 
        blank=True
    )

    is_processed = models.BooleanField(
        verbose_name="Is Processed", 
        help_text="Stores the information if the uploaded file is already processed.", 
        default=False, 
        null=False
    )

    original_filename = models.CharField(
        verbose_name="Original Filename", 
        help_text="Original filename of the uploaded file.", 
        max_length=255, 
        null=True, 
        blank=True
    )

    original_size = models.BigIntegerField(
        verbose_name="Original Size", 
        help_text="Original size of the uploaded file.", 
        null=True, 
        blank=True
    )

    compressed_size = models.BigIntegerField(
        verbose_name="Compressed Size", 
        help_text="Compressed size of the uploaded file.", 
        null=True, 
        blank=True
    )

    order = models.PositiveIntegerField(
        verbose_name="Order", 
        help_text="Order of the uploaded file in post.", 
        default=0, 
        null=False
    )

    sprite_sheet = models.ImageField(
        verbose_name="Sprite Sheet",
        help_text="Video image sprite sheet for scrubbar preview.", 
        upload_to=getPostUploadPath,
        null=True,
        blank=True
    )
    
    vtt_file = models.FileField(
        verbose_name="VTT File Map",
        help_text="VTT file map of the video sprite sheet.", 
        upload_to=getPostUploadPath,
        null=True,
        blank=True
    )

    @property
    def filename(self):
        return os.path.basename(self.file.name)

    class Meta:
        verbose_name = _("Médium príspevku")
        verbose_name_plural = _("Média príspevkov")

    def __str__(self):
        return _("Médium príspevku od %(first_name)s %(last_name)s.") % {"first_name": self.post.user.first_name, "last_name": self.post.user.last_name}

class SeenPost(models.Model):
    user = models.ForeignKey(
        Users,
        verbose_name="User",
        help_text="User who viewed the post.", 
        on_delete=models.CASCADE,
        related_name="seen_instances",
        null=False,
    )

    post = models.ForeignKey(
        Post,
        verbose_name="Post",
        help_text="A post that has been viewed.", 
        on_delete=models.CASCADE,
        related_name="seen_by_instances",
        null=False,
    )

    viewed_at = models.DateTimeField(
        verbose_name="Viewed At", 
        help_text="Post view time.", 
        auto_now_add=True, 
        null=False, 
        db_index=True
    )

    class Meta:
        unique_together = ("user", "post")
        verbose_name = _("Označený videný príspevok")
        verbose_name_plural = _("Označenia videných príspevkov")

    def __str__(self):
        return _("Užívateľ %(first_name)s %(last_name)s videl príspevok od %(post_user_first_name)s %(post_user_last_name)s.") % {"first_name": self.user.first_name, "last_name": self.user.last_name, "post_user_first_name": self.post.user.first_name, "post_user_last_name": self.post.user.last_name}

class VideoView(models.Model):
    post_media = models.ForeignKey(
        PostMedia, 
        verbose_name="Post Media",
        help_text="The exact video from the post that was marked as seen.", 
        on_delete=models.CASCADE, 
        related_name="video_views",
        null=False
    )

    user = models.ForeignKey(
        Users,
        verbose_name="User",
        help_text="A user who watched the video.", 
        on_delete=models.CASCADE,
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name="Created At",
        help_text="The time when the user viewed the video.", 
        auto_now_add=True,
        null=False
    )

    class Meta:
        unique_together = ("post_media", "user")
        verbose_name = _("Označené videné video")
        verbose_name_plural = _("Označenia videných videií")

    def __str__(self):
        return _("Užívateľ %(first_name)s %(last_name)s videl video príspevku od %(post_user_first_name)s %(post_user_last_name)s.") % {"first_name": self.user.first_name, "last_name": self.user.last_name, "post_user_first_name": self.post_media.post.user.first_name, "post_user_last_name": self.post_media.post.user.last_name}

class PostForum(models.Model):
    STATUS_CHOICES = [
        ("OK", "OK"),
        ("hidden", "hidden")
    ]

    post = models.ForeignKey(
        Post,
        verbose_name="Post",
        help_text="The post to which the comment belongs.", 
        on_delete=models.CASCADE,
        related_name="comments",
        null=False,
    )

    user = models.ForeignKey(
        Users, 
        verbose_name="User", 
        help_text="The user who added the comment.", 
        on_delete=models.CASCADE, 
        related_name="post_comments",
        null=True,
    )

    reports_from_users = models.ManyToManyField(
        Users, 
        through="PostForumReport", 
        verbose_name="Reports From Users", 
        help_text="Users who reported the comment.", 
        related_name="reported_post_forum_comments", 
        blank=True
    )

    comment = models.TextField(
        verbose_name="Comment", 
        help_text="Comment content.", 
        max_length=100, 
        null=False
    )

    # tagged_users = models.ManyToManyField(Users, verbose_name="Tagged Users", blank=True)
    # added_hashtags = ArrayField(models.CharField(verbose_name="Added Hashtags", max_length=30), default=list, null=False)

    likes = models.PositiveIntegerField(
        verbose_name="Likes", 
        help_text="Amount of obtained likes on the comment.", 
        default=0, 
        null=False
    )

    likes_from_users = models.ManyToManyField(
        Users, 
        verbose_name="Likes From Users", 
        help_text="Users who liked the comment.", 
        related_name="liked_post_forum_comments", 
        blank=True
    )

    creation_time = models.DateTimeField(
        verbose_name="Creation Time", 
        help_text="Time the comment was added.", 
        auto_now_add=True, 
        null=False
    )

    parent = models.ForeignKey(
        "self",
        verbose_name="Parent",
        help_text="Link to the parent comment in the case of a reply.", 
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies",
    )

    status = models.CharField(
        verbose_name="Status", 
        help_text="Current status of the comment.", 
        choices=STATUS_CHOICES, 
        max_length=20, 
        default="OK"
    )

    reports = models.PositiveIntegerField(
        verbose_name="Reports", 
        help_text="Amount of received reports of the comment.", 
        default=0, 
        null=False
    )

    level = models.PositiveIntegerField(
        verbose_name="Level", 
        help_text="Comment nesting level (1 is a main comment; deeper levels are replies)", 
        default=1
    )

    def save(self, *args, **kwargs):
        if self.parent:
            calculated_level = self.parent.level + 1
            
            if calculated_level > 5:
                raise ValidationError(_("Maximum level of nested comments has been reached."))
            
            self.level = calculated_level
            
        else:
            self.level = 1
            
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = _("Komentár príspevku")
        verbose_name_plural = _("Komentáre príspevkov")

    def __str__(self):
        return _("Užívateľ %(first_name)s %(last_name)s pridal komentár k príspevku od %(post_user_first_name)s %(post_user_last_name)s.") % {"first_name": self.user.first_name, "last_name": self.user.last_name, "post_user_first_name": self.post.user.first_name, "post_user_last_name": self.post.user.last_name}

class PostForumReport(models.Model):
    REPORT_REASON_CHOICES = [
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
        help_text="The post comment that received a report.", 
        on_delete=models.CASCADE,
        null=False,
    )

    user = models.ForeignKey(
        Users,
        verbose_name="User",
        help_text="The user who submitted the report.", 
        on_delete=models.CASCADE,
        null=False,
    )

    reason = models.CharField(
        verbose_name="Reason", 
        help_text="Reason for reporting.", 
        max_length=50, 
        choices=REPORT_REASON_CHOICES, 
        default="other", 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name="Created At", 
        help_text="Report submission time.", 
        auto_now_add=True, 
        null=False
    )

    class Meta:
        unique_together = ("postforum", "user")
        verbose_name = _("Nahlásenie komentáru príspevku")
        verbose_name_plural = _("Nahlásenia komentárov príspevkov")

    def __str__(self):
        return _("Užívateľ %(first_name)s %(last_name)s nahlásil komentár od %(reported_first_name)s %(reported_last_name)s.") % {"first_name": self.user.first_name, "last_name": self.user.last_name, "reported_first_name": self.postforum.user.first_name, "reported_last_name": self.postforum.user.last_name}

class BioLinks(models.Model):
    user = models.ForeignKey(
        Users,
        verbose_name="User",
        help_text="The user who added the link to their bio.", 
        on_delete=models.CASCADE,
        related_name="bio_links",
        null=False
    )

    # title = models.CharField(verbose_name="Title", max_length=20, null=False)
    
    url = models.URLField(
        verbose_name="URL Address", 
        help_text="URL of the added link.", 
        max_length=200, 
        null=False
    )

    @property
    def domain(self):
        url = urlparse(self.url) # Gets The URL
        domain = url.netloc.replace("www.", "") # Gets The Domain
        return domain # Returns The URL Domain

    class Meta:
        verbose_name = _("Bio odkaz")
        verbose_name_plural = _("Bio odkazy")

    def __str__(self):
        return _("Odkaz užívateľa %(first_name)s %(last_name)s.") % {"first_name": self.user.first_name, "last_name": self.user.last_name}

class Chat(models.Model):
    sender = models.ForeignKey(
        Users,
        verbose_name="Sender",
        help_text="Message sender.", 
        on_delete=models.SET_NULL,
        related_name="sent_messages",
        null=True,
        blank=True
    )

    receiver = models.ForeignKey(
        Users,
        verbose_name="Receiver",
        help_text="Message receiver.", 
        on_delete=models.SET_NULL, 
        related_name="received_messages",
        null=True,
        blank=True
    )

    content = models.TextField(
        verbose_name="Content", 
        help_text="Message content.", 
        max_length=250, 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name="Created At", 
        help_text="Message sending time.", 
        auto_now_add=True, 
        null=False
    )

    is_read = models.BooleanField(
        verbose_name="Is Read", 
        help_text="Stores the information if the message is read.", 
        default=False, 
        null=False
    )

    is_edited = models.BooleanField(
        verbose_name="Is Edited", 
        help_text="Stores the information if the message was edited.", 
        default=False, 
        null=False
    )

    reacted_users = models.ManyToManyField(
        "Users",
        through="MessageReaction",
        verbose_name="Reactions", 
        help_text="Users who reacted to the message.", 
        related_name="reacted_messages",
        null=True,
        blank=True
    )

    @property
    def is_older_than_15_minutes(self):
        now = timezone.now() # Gets The Current Time
        created_ago = now - self.created_at # Gets The Created Ago Time
        _15_minutes = timedelta(minutes=15) # Determines 15 Minutes

        return created_ago > _15_minutes # Returns True If The Message Is Older Than 15 Minutes

    @property
    def is_older_than_1_day(self):
        now = timezone.now() # Gets The Current Time
        created_ago = now - self.created_at # Gets The Created Ago Time
        _1_day = timedelta(days=1) # Determines 1 Day

        return created_ago > _1_day # Returns True If The Message Is Older Than 1 Day

    @property
    def formatted_time(self):
        now = timezone.now() # Gets The Current Time
        created_ago = now - self.created_at # Gets The Created Ago Time

        # Today
        if created_ago.days == 0:
            # Less Than 60 Seconds
            if created_ago.seconds < 60:
                return _("teraz")
            
            # Less Than 1 Hour
            elif created_ago.seconds < 3600:
                minutes = created_ago.seconds // 60

                # 1 Minute
                if minutes == 1:
                    return _("pred minútou")

                # Some Minutes
                return _("pred %(minutes)s minútami" % {"minutes": minutes})
            
            else:
                hours = created_ago.seconds // 3600

                # 1 Hour
                if hours == 1:
                    return _("pred hodinou")

                # Some Hours
                return _("pred %(hours)s hodinami" % {"hours": hours})

        # Yesterday
        elif created_ago.days == 1:
            return _("včera o %(time)s" % {"time": self.created_at.strftime('%H:%M')})

        # 2 Days Ago And Older
        else:
            return self.created_at.strftime("%d.%m.%Y %H:%M")

    class Meta:
        verbose_name = _("Správa")
        verbose_name_plural = _("Správy")

    def __str__(self):
        return _("Správa od %(sender_first_name)s %(sender_first_name)s pre %(receiver_first_name)s %(receiver_last_name)s.") % {"sender_first_name": self.sender.first_name, "sender_last_name": self.sender.last_name, "receiver_first_name": self.receiver.first_name, "receiver_last_name": self.receiver.last_name}

class MessageReaction(models.Model):
    chat = models.ForeignKey(
        Chat, 
        verbose_name="Chat",
        help_text="The message to which the reaction belongs.", 
        on_delete=models.CASCADE, 
        related_name="message_reactions",
        null=False
    )

    user = models.ForeignKey(
        Users, 
        verbose_name="User",
        help_text="The user who added a reaction to the message.", 
        on_delete=models.CASCADE, 
        related_name="user_reactions",
        null=False
    )
    
    emoji = models.CharField(
        verbose_name="Emoji",
        help_text="Emoji added as a reaction.", 
        max_length=10,
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name="Created At", 
        help_text="Time the reaction was added.", 
        auto_now_add=True, 
        null=False
    )

    def __str__(self):
        return f"{self.user.username} has reacted {self.emoji} to message {self.chat.id}"

    class Meta:
        verbose_name = _("Správa")
        verbose_name_plural = _("Správy")

    def __str__(self):
        return _("Reakcia od %(first_name)s %(last_name)s na správu od %(chat_user_first_name)s %(chat_user_last_name)s.") % {"first_name": self.user.first_name, "last_name": self.user.last_name, "chat_user_first_name": self.chat.user.first_name, "chat_user_last_name": self.chat.user.last_name}