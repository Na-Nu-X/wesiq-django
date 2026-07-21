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
import string
import random

class Users(models.Model):
    ROLE_CHOICES = [
        ("developer", _("Developer")),
        ("admin", _("Admin")),
        ("user", _("User"))
    ]

    ACCOUNT_STATUS_CHOICES = [
        ("unverified", _("Unverified")),
        ("OK", _("OK")),
        ("suspended", _("Suspended")),
        ("deleted", _("Deleted"))
    ]

    daily_official_tasks = models.ManyToManyField(
        "OfficialTasks", 
        through="UserDailyOfficialTasks", 
        verbose_name=_("Daily Official Tasks"), 
        help_text=_("User's random generated daily official tasks."), 
        blank=True
    )

    following = models.ManyToManyField(
        "self", 
        through="FollowRelation",
        verbose_name=_("Following"), 
        help_text=_("User's follow relations with other users."), 
        related_name="followers",
        symmetrical=False, 
        blank=True
    )

    first_name = models.CharField(
        verbose_name=_("First Name"), 
        help_text=_("User's first name."),
        max_length=20, 
        null=True, blank=True
    )

    last_name = models.CharField(
        verbose_name=_("Last Name"), 
        help_text=_("User's last name."),
        max_length=50, null=True, 
        blank=True
    )

    username = models.CharField(
        verbose_name=_("Username"), 
        help_text=_("User's username."),
        max_length=20, 
        null=False
    )

    email_address = models.EmailField(
        verbose_name=_("E-mail Address"), 
        help_text=_("User's e-mail address."),
        max_length=50
    )

    phone_number = models.CharField(
        verbose_name=_("Phone Number"), 
        help_text=_("User's phone number."),
        max_length=50, 
        null=True
    )

    password = models.CharField(
        verbose_name=_("Password"), 
        help_text=_("User's hashed password."), 
        max_length=255
    )

    role = models.CharField(
        verbose_name=_("Role"), 
        help_text=_("User's role."),
        choices=ROLE_CHOICES, 
        default="user", 
        max_length=20
    )

    profile_picture_name = models.CharField(
        verbose_name=_("Profile Picture File"), 
        help_text=_("User's profile picture filename."),
        max_length=50, 
        null=True, 
        blank=True
    )

    language = models.CharField(
        verbose_name=_("Language Code"), 
        help_text=_("User's default preferred language."), 
        max_length=10, 
        default="en", 
        null=False, 
        blank=False
    )

    last_edit = models.DateTimeField(
        verbose_name=_("Last Edit Time"), 
        help_text=_("Time of the last account edition (only crucial changes)."), 
        null=True, 
        blank=True
    )

    creation_time = models.DateTimeField(
        verbose_name=_("Creation Time"), 
        help_text=_("User's account creation time."), 
        auto_now_add=True, 
        null=False
    )

    verification_code = models.CharField(
        verbose_name=_("Verification Code"), 
        help_text=_("User's verification code to activate account."), 
        max_length=6, 
        null=True, 
        blank=True
    )

    password_reset_code = models.CharField(
        verbose_name=_("Password Reset Code"), 
        help_text=_("User's password reset code to change the password."), 
        max_length=6, 
        null=True, 
        blank=True
    )

    google_id = models.CharField(
        verbose_name=_("Google ID"), 
        help_text=_("ID of user registered with Google."), 
        max_length=255, 
        null=True, 
        blank=True
    )

    friend_code = models.CharField(
        verbose_name=_("Friend Code"), 
        help_text=_("User's random generated friend code."), 
        max_length=6, 
        unique=True, 
        null=False,
        editable=False
    )

    saved_posts = models.ManyToManyField(
        "Post", 
        verbose_name=_("Saved Posts"), 
        help_text=_("User's saved posts of other users."), 
        related_name="saved_posts", 
        blank=True
    )

    bio = models.TextField(
        verbose_name=_("Bio"), 
        help_text=_("User's bio."), 
        max_length=100, 
        null=True, 
        blank=True
    )

    xp = models.PositiveIntegerField(
        verbose_name=_("Total XP"), 
        help_text=_("User's total amount of obtained XP."), 
        default=0, 
        null=False
    )

    xp_boost_expiration_time = models.DateTimeField(
        verbose_name=_("XP Boost Expiration Time"), 
        help_text=_("Stores the last time of XP boost expiration."), 
        auto_now_add=True, 
        null=False
    )

    total_activities = models.PositiveIntegerField(
        verbose_name=_("Total Activities"), 
        help_text=_("User's total amount of recorded activities."), 
        default=0, 
        null=False
    )

    activity_streak = models.PositiveIntegerField(
        verbose_name=_("Activity Streak"), 
        help_text=_("User's current activity streak."), 
        default=0, 
        null=False
    )

    max_activity_streak = models.PositiveIntegerField(
        verbose_name=_("Max Activity Streak"), 
        help_text=_("Stores the user's maximum activity streak."), 
        default=0, 
        null=False
    )

    last_activity_streak_increase_time = models.DateTimeField(
        verbose_name=_("Last Activity Streak Increase time"), 
        help_text=_("Stores the user's last activity streak increase time."), 
        auto_now_add=False, 
        null=True, 
        blank=True
    )

    private_account = models.BooleanField(
        verbose_name=_("Private Account"), 
        help_text=_("Stores the information if the user's account is private."), 
        default=False, 
        null=False
    )

    account_status = models.CharField(
        verbose_name=_("Account Status"), 
        help_text=_("User's account Status."), 
        max_length=20, 
        choices=ACCOUNT_STATUS_CHOICES, 
        default="unverified", 
        null=False
    )

    suspension_time = models.DateTimeField(
        verbose_name=_("Suspension time"), 
        help_text=_("Stores the user's suspension time if had any."), 
        null=True, 
        blank=True
    )

    last_login = models.DateTimeField(
        verbose_name=_("Last Login"), 
        help_text=_("Stores the time of the user's last login."), 
        auto_now_add=False, 
        null=True, 
        blank=True
    )

    reports = models.PositiveIntegerField(
        verbose_name=_("Reports"), 
        help_text=_("User's reports amount."), 
        default=0, 
        null=False
    )

    data_saving_mode = models.BooleanField(
        verbose_name=_("Data Saving Mode"), 
        help_text=_("Stores the information if the user has turned on the data saving mode."), 
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

    def save(self, *args, **kwargs):
        if not self.friend_code:
            new_friend_code = generate_friend_code()
            
            # Generates The Unique Friend Code
            while Users.objects.filter(friend_code=new_friend_code).exists():
                new_friend_code = generate_friend_code()
                
            self.friend_code = new_friend_code

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.role}: {self.first_name} {self.last_name}"

    def get_absolute_url(self):
        return reverse("profile_url", kwargs={"username": self.username})

# Function For Generate The Friend Code
def generate_friend_code():
    characters = string.ascii_uppercase + string.digits
    return "".join(random.choices(characters, k=6))

class FollowRelation(models.Model):
    STATUS_CHOICES = [
        ("pending", _("Pending")),
        ("accepted", _("Accepted"))
    ]

    from_user = models.ForeignKey(
        "Users", 
        related_name="following_relations", 
        verbose_name=_("From User"),
        help_text=_("Follow from the selected user."), 
        on_delete=models.CASCADE,
        null=False
    )

    to_user = models.ForeignKey(
        "Users", 
        related_name="follower_relations", 
        verbose_name=_("To User"),
        help_text=_("Follow to the selected user."), 
        on_delete=models.CASCADE,
        null=False
    )
    
    status = models.CharField(
        verbose_name=_("Status"), 
        help_text=_("Status of the follow relation."), 
        max_length=10, 
        choices=STATUS_CHOICES, 
        default="accepted", 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name=_("Created At"), 
        help_text=_("Time of the follow relation creation."), 
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
        verbose_name=_("User"),
        help_text=_("Stores the receiver Of the Badge."), 
        on_delete=models.CASCADE,
        related_name="badges", 
        null=False
    )

    title = models.CharField(
        verbose_name=_("Title"), 
        help_text=_("Full title of the badge."),
        max_length=50, 
        null=False
    )

    data = models.CharField(
        verbose_name=_("Data"), 
        help_text=_("Spaceless title of the badge used in the programming logic."),
        max_length=50, 
        null=False
    )

    obtained_in = models.DateTimeField(
        verbose_name=_("Obtained In"), 
        help_text=_("Time of receivation of the badge."), 
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
        verbose_name=_("Official Task"),
        help_text=_("Full title of the task."),
        on_delete=models.CASCADE,
        null=False
    )

    user = models.ForeignKey(
        Users,
        verbose_name=_("User"),
        help_text=_("The user to whom the task belongs."),
        on_delete=models.CASCADE,
        null=False
    )

    progress_percentage = models.DecimalField(
        verbose_name=_("Progress Percentage"), 
        help_text=_("Task's progress percentage of completion."),
        max_digits=5, 
        decimal_places=2, 
        default=0.00, 
        null=False, 
        validators=[MinValueValidator(0.00), MaxValueValidator(100.00)]
    )

    is_completed = models.BooleanField(
        verbose_name=_("Is Completed"), 
        help_text=_("Stores the information if the task is completed."),
        default=False, 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name=_("Created At"), 
        help_text=_("Time of the generation of the task."),
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
        ("spam", _("Spam")),
        ("harassment", _("Harassment")),
        ("hate_speech", _("Hate Speech")),
        ("misinformation", _("Misinformation")),
        ("explicit_content", _("Explicit Content")),
        ("other", "other")
    ]

    reported_user = models.ForeignKey(
        Users,
        verbose_name=_("Reported User"),
        help_text=_("The user against whom the report was filed."),
        on_delete=models.CASCADE,
        null=False,
        related_name="reports_received"
    )

    reporting_user = models.ForeignKey(
        Users,
        verbose_name=_("Reporting User"),
        help_text=_("The user who submitted the report."),
        on_delete=models.CASCADE,
        null=False,
        related_name="reports_sent"
    )

    reason = models.CharField(
        verbose_name=_("Reason"), 
        help_text=_("Reason of the given report."),
        max_length=50, 
        choices=REPORT_REASON_CHOICES, 
        default="other", 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name=_("Created At"), 
        help_text=_("Time the report was submitted."),
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
        verbose_name=_("User"), 
        help_text=_("The user to whom the activity record belongs."), 
        on_delete=models.DO_NOTHING, 
        related_name="activities", 
        null=True,
    )

    end_time = models.DateTimeField(
        verbose_name=_("End Time"), 
        help_text=_("Activity end time."), 
        auto_now_add=True, 
        null=False
    )

    elapsed_time = models.PositiveIntegerField(
        verbose_name=_("Elapsed Time (Seconds)"), 
        help_text=_("Duration of the activity in seconds."), 
        default=0, 
        null=False
    )

    gained_xp = models.PositiveIntegerField(
        verbose_name=_("Gained XP"), 
        help_text=_("Amount of XP received for activity."), 
        default=0, 
        null=False
    )

    type = models.CharField(
        verbose_name=_("Type"), 
        help_text=_("Selected activity name."), 
        max_length=50, 
        null=True
    )

    training_plan_day = models.PositiveIntegerField(
        verbose_name=_("Day"), 
        help_text=_("Assigned activity day."), 
        null=True, 
        blank=True
    )

    training_plan_summary = models.JSONField(
        verbose_name=_("Training Plan Summary"), 
        help_text=_("Data recorded for an activity completed according to the training plan."), 
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
        ("pending", _("Pending")),
        ("approved", _("Approved")),
        ("denied", _("Denied")),
        ("hidden", _("Hidden"))
    ]

    user = models.ForeignKey(
        Users, 
        verbose_name=_("User"), 
        help_text=_("The user who wrote the review."), 
        on_delete=models.SET_NULL, 
        related_name="review", 
        null=True,
    )

    reports_from_users = models.ManyToManyField(
        Users, 
        through="ReviewReport", 
        verbose_name=_("Reports From Users"), 
        help_text=_("Users who submitted a report."), 
        related_name="reported_reviews", 
        blank=True
    )
    
    rating = models.PositiveIntegerField(
        verbose_name=_("Rating"), 
        help_text=_("Rating from 1 to 5."), 
        default=0, 
        null=False
    )

    review = models.TextField(
        verbose_name=_("Review"), 
        help_text=_("Content of the written review."), 
        max_length=200, 
        null=True
    )

    status = models.CharField(
        verbose_name=_("Status"), 
        help_text=_("Current status of the written review."), 
        choices=STATUS_CHOICES, 
        max_length=20, 
        default="pending"
    )

    rejection_time = models.DateTimeField(
        verbose_name=_("Rejection Time"), 
        help_text=_("Review rejection time."), 
        null=True, 
        blank=True
    )

    reports = models.PositiveIntegerField(
        verbose_name=_("Reports"), 
        help_text=_("Amount of total obtained reports."), 
        default=0, 
        null=False
    )

    last_edit = models.DateTimeField(
        verbose_name=_("Last Edit Time"), 
        help_text=_("Time of the last editing."), 
        null=True, 
        blank=True
    )

    creation_time = models.DateTimeField(
        verbose_name=_("Creation Time"), 
        help_text=_("Time of the review submission."), 
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
        ("spam", _("Spam")),
        ("harassment", _("Harassment")),
        ("hate_speech", _("Hate Speech")),
        ("misinformation", _("Misinformation")),
        ("explicit_content", _("Explicit Content")),
        ("other", "other")
    ]

    review = models.ForeignKey(
        Reviews,
        verbose_name=_("Review"),
        help_text=_("A review that has been reported."), 
        on_delete=models.CASCADE,
        null=False,
    )

    user = models.ForeignKey(
        Users,
        verbose_name=_("User"),
        help_text=_("The user who reported the review."), 
        on_delete=models.CASCADE,
        null=False,
    )

    reason = models.CharField(
        verbose_name=_("Reason"), 
        help_text=_("Reason for reporting the review."), 
        max_length=50, 
        choices=REPORT_REASON_CHOICES, 
        default="other", 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name=_("Created At"), 
        help_text=_("Time of review report submission."), 
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
        verbose_name=_("User"),
        help_text=_("The user who owns the article."), 
        on_delete=models.DO_NOTHING, 
        related_name="article", 
        null=True,
    )

    rating_from_users = models.ManyToManyField(
        Users, 
        through="ArticleRating",
        verbose_name=_("Rating From Users"), 
        help_text=_("User rating of the article."), 
        blank=True
    )

    title = models.CharField(
        verbose_name=_("Title"), 
        help_text=_("Title of the article."), 
        max_length=50, 
        null=False
    )

    description = models.TextField(
        verbose_name=_("Description"), 
        help_text=_("Description of the article."), 
        max_length=250, 
        null=False
    )

    image_name = models.CharField(
        verbose_name=_("Image File"), 
        help_text=_("Filename of the banner image of the article."), 
        max_length=50, 
        null=False
    )

    html_filename = models.CharField(
        verbose_name=_("HTML Filename"), 
        help_text=_("Filename of the HTML template of the article."), 
        max_length=50, 
        null=True, 
        blank=True
    )

    link = models.CharField(
        verbose_name=_("Link"), 
        help_text=_("URL of the article."), 
        max_length=50, 
        null=False
    )

    categories = ArrayField(
        models.CharField(
            verbose_name=_("Categories"), 
            help_text=_("Categories corresponding to the article."), 
            max_length=50
        ), 
        
        default=list, 
        null=False
    )

    visitors = models.PositiveIntegerField(
        verbose_name=_("Visitors"), 
        help_text=_("Amount of the article's visitors."), 
        default=0, 
        null=False
    )

    creation_time = models.DateTimeField(
        verbose_name=_("Creation Time"), 
        help_text=_("Time of the article creation."), 
        auto_now_add=True, 
        null=False
    )

    difficulty = models.IntegerField(
        verbose_name=_("Difficulty Percentage"), 
        help_text=_("Exercise difficulty in percent."), 
        default=0, 
        null=False, 
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    time_to_learn = models.IntegerField(
        verbose_name=_("Time To Learn Percentage"), 
        help_text=_("Exercise time to learn in percent."), 
        default=0, 
        null=False, 
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    time_to_learn_text = models.CharField(
        verbose_name=_("Time To Learn Text"), 
        help_text=_("Exercise time to learn labeled text."), 
        max_length=20, 
        null=False
    )

    rarity = models.IntegerField(
        verbose_name=_("Rarity Percentage"), 
        help_text=_("Exercise rarity in percent."), 
        default=0, 
        null=False, 
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    strength = models.IntegerField(
        verbose_name=_("Strength Percentage"), 
        help_text=_("Exercise required strength in percent."), 
        default=0, 
        null=False, 
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    technique = models.IntegerField(
        verbose_name=_("Technique Percentage"), 
        help_text=_("The technical difficulty value of the exercise, expressed as a percentage."), 
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
        verbose_name=_("Article"),
        help_text=_("The article to which the given rating applies."), 
        on_delete=models.CASCADE,
        null=False,
    )

    user = models.ForeignKey(
        Users,
        verbose_name=_("User"),
        help_text=_("The user who rated the article."), 
        on_delete=models.CASCADE,
        null=False,
    )

    rating = models.PositiveIntegerField(
        verbose_name=_("Rating"), 
        help_text=_("Rating from 1 to 5."), 
        default=0, 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name=_("Created At"), 
        help_text=_("Time the article rating was submitted."), 
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
        ("OK", _("OK")),
        ("hidden", _("Hidden"))
    ]

    article = models.ForeignKey(
        Articles, 
        verbose_name=_("Article"), 
        help_text=_("Time the article rating was submitted."), 
        on_delete=models.DO_NOTHING, 
        related_name="comments", 
        null=False,
    )

    user = models.ForeignKey(
        Users, 
        verbose_name=_("User"), 
        help_text=_("The user who wrote the comment."), 
        on_delete=models.CASCADE, 
        related_name="article_comments",
        null=True,
    )

    reports_from_users = models.ManyToManyField(
        Users, 
        through="ArticleForumReport", 
        verbose_name=_("Reports From Users"), 
        help_text=_("Users who reported the comment."), 
        related_name="reported_article_forum_comments", 
        blank=True
    )

    comment = models.TextField(
        verbose_name=_("Comment"), 
        help_text=_("Comment content."), 
        max_length=100, 
        null=False
    )

    # tagged_users = models.ManyToManyField(Users, verbose_name="Tagged Users", blank=True)
    # added_hashtags = ArrayField(models.CharField(verbose_name="Added Hashtags", max_length=30), default=list, null=False)

    likes = models.PositiveIntegerField(
        verbose_name=_("Likes"), 
        help_text=_("Number of likes on the comment."), 
        default=0, 
        null=False
    )

    likes_from_users = models.ManyToManyField(
        Users, 
        verbose_name=_("Likes From Users"), 
        help_text=_("Users who liked the comment."), 
        related_name="liked_article_forum_comments", 
        blank=True
    )

    creation_time = models.DateTimeField(
        verbose_name=_("Creation Time"), 
        help_text=_("Time the comment was written."), 
        auto_now_add=True, 
        null=False
    )

    parent = models.ForeignKey(
        "self",
        verbose_name=_("Parent"),
        help_text=_("Link to the parent comment in the case of a reply."), 
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies",
    )

    status = models.CharField(
        verbose_name=_("Status"), 
        help_text=_("Current status of the comment."), 
        choices=STATUS_CHOICES, 
        max_length=20, 
        default="OK"
    )

    reports = models.PositiveIntegerField(
        verbose_name=_("Reports"), 
        help_text=_("Amount of received reports of the comment."), 
        default=0, 
        null=False
    )

    level = models.PositiveIntegerField(
        verbose_name=_("Level"), 
        help_text=_("Comment nesting level (1 is a main comment; deeper levels are replies)"), 
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
        ("spam", _("Spam")),
        ("harassment", _("Harassment")),
        ("hate_speech", _("Hate Speech")),
        ("misinformation", _("Misinformation")),
        ("explicit_content", _("Explicit Content")),
        ("other", _("Other"))
    ]

    articleforum = models.ForeignKey(
        ArticleForum,
        verbose_name=_("Article Forum Comment"),
        help_text=_("The article comment that received a report."), 
        on_delete=models.CASCADE,
        null=False,
    )

    user = models.ForeignKey(
        Users,
        verbose_name=_("User"),
        help_text=_("The user who submitted the report."), 
        on_delete=models.CASCADE,
        null=False,
    )

    reason = models.CharField(
        verbose_name=_("Reason"), 
        help_text=_("Reason for reporting."), 
        max_length=50, 
        choices=REPORT_REASON_CHOICES, 
        default="other", 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name=_("Created At"), 
        help_text=_("Report submission time."), 
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
        ("reps", _("Reps")),
        ("seconds", _("Seconds")),
        ("steps", _("Steps")),
    ]

    user = models.ForeignKey(
        Users,
        verbose_name=_("User"),
        help_text=_("The user to whom the training plan belongs."), 
        on_delete=models.DO_NOTHING,
        related_name="training_plans",
        null=True,
    )

    training_plan_key = models.CharField(
        verbose_name=_("Training Plan Key"), 
        help_text=_("Random identification key for the training plan."), 
        max_length=50, 
        default="None", 
        null=False, 
        blank=False
    )

    day = models.PositiveIntegerField(
        verbose_name=_("Day"), 
        help_text=_("Training plan day."), 
        null=True, 
        blank=True
    )

    type = models.CharField(
        verbose_name=_("Type"), 
        help_text=_("Training plan name."), 
        max_length=50, 
        null=True
    )

    exercise = models.CharField(
        verbose_name=_("Exercise"), 
        help_text=_("Exercise name."), 
        max_length=50, 
        null=False
    )

    periods = ArrayField(
        models.PositiveIntegerField(
            verbose_name=_("Reps")
        ), 

        help_text=_("Exercise periods (the length of the array represents sets and the amount of reps represents the values (0 = to failute / max. reps)."), 
        default=list, 
        null=False
    )

    unit = models.CharField(
        verbose_name=_("Unit"), 
        help_text=_("The unit in which the exercise is measured."), 
        max_length=20, 
        choices=UNIT_CHOICES, 
        default="reps", 
        null=False
    )

    order = models.PositiveIntegerField(
        verbose_name=_("Order"), 
        help_text=_("The order of the exercise in the training plan."), 
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
        ("reps", _("reps")),
        ("seconds", _("seconds")),
        ("steps", _("steps")),
    ]

    exercise = models.CharField(
        verbose_name=_("Exercise"), 
        help_text=_("Exercise name."), 
        max_length=50, 
        null=False
    )

    unit = models.CharField(
        verbose_name=_("Unit"), 
        help_text=_("The unit in which the exercise is measured."), 
        max_length=20, 
        choices=UNIT_CHOICES, 
        default="reps", 
        null=False
    )

    categories = ArrayField(
        models.CharField(
            verbose_name=_("Categories"), 
            max_length=50
        ), 
        
        help_text=_("Categories the given exercise falls into."), 
        default=list, 
        null=False
    )

    requires_weight = models.BooleanField(
        verbose_name=_("Requires Weight"), 
        help_text=_("Stores the information if the exercise requires the additional weight."), 
        default=False, 
        null=False
    )

    image_filename = models.CharField(
        verbose_name=_("Image Filename"), 
        help_text=_("Stores the filename of the exercise image."), 
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
        verbose_name=_("Title"), 
        help_text=_("Title of the task."), 
        max_length=100, 
        null=False
    )

    data = models.CharField(
        verbose_name=_("Data"), 
        help_text=_("Spaceless title of the task used in the programming logic."),
        max_length=100, 
        null=False
    )

    xp = models.PositiveIntegerField(
        verbose_name=_("XP"), 
        help_text=_("Amount of XP upon completing the task."),
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
        verbose_name=_("User"),
        help_text=_("The user who created a custom task."),
        on_delete=models.CASCADE,
        null=False,
    )

    title = models.CharField(
        verbose_name=_("Title"), 
        help_text=_("Title of the custom task."),
        max_length=100, 
        null=False
    )

    is_completed = models.BooleanField(
        verbose_name=_("Is Completed"),
        help_text=_("Stores the information if the task is completed."),
        default=False, 
        null=False
    )

    order = models.PositiveIntegerField(
        verbose_name=_("Order"), 
        help_text=_("Order of the task."),
        default=0, 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name=_("Created At"), 
        help_text=_("Time of creation of the task."),
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
        ("pending", _("pending")),
        ("succeeded", _("succeeded")),
        ("failed", _("failed"))
    ]

    user = models.ForeignKey(
        Users,
        verbose_name=_("User"),
        help_text=_("The user who created the transaction."),
        on_delete=models.DO_NOTHING,
        related_name="transactions",
        null=True,
    )

    stripe_intent_id = models.CharField(
        verbose_name="Stripe ID", 
        help_text=_("Transaction ID in the Stripe service."),
        max_length=255, 
        unique=True, 
        null=False
    )

    cardholder_name = models.CharField(
        verbose_name=_("Cardholder Name"), 
        help_text=_("Cardholder's name."),
        max_length=50, 
        null=True
    )

    # In €
    amount = models.DecimalField(
        verbose_name=_("Amount (€)"), 
        help_text=_("Volume of processed funds in EUR."),
        max_digits=10, 
        decimal_places=2, 
        default=0, 
        null=False
    )

    status = models.CharField(
        verbose_name=_("Status"), 
        help_text=_("Status of the added transaction."),
        max_length=20, 
        choices=STATUS_CHOICES, 
        default="pending", 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name=_("Created At"), 
        help_text=_("Transaction addition time."),
        auto_now_add=True, 
        null=False
    )

    title = models.CharField(
        verbose_name=_("Title"), 
        help_text=_("Title of the payment."),
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
        verbose_name=_("User"),
        help_text=_("The user who activated the subscription."), 
        on_delete=models.CASCADE, 
        related_name="subscription",
        null=False
    )
    
    stripe_subscription_id = models.CharField(
        verbose_name=_("Stripe Subscription ID"),
        help_text=_("ID of the Stripe subscription."), 
        max_length=255, 
        unique=True,
        null=True, 
        blank=True
    )

    plan = models.CharField(
        verbose_name=_("Plan"),
        help_text=_("Activated subscription plan."), 
        max_length=20, 
        choices=PLAN_CHOICES, 
        default="free",
        null=False
    )

    is_active = models.BooleanField(
        verbose_name=_("Is Active"), 
        help_text=_("Stores the information if the subscription is still active."), 
        default=False, 
        null=False
    )

    is_cancelled = models.BooleanField(
        verbose_name=_("Is Cancelled"), 
        help_text=_("Stores the information if the subscription is cancelled. The subscription will end at the end of the billing period."), 
        default=False, 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name=_("Created At"), 
        help_text=_("Time the subscription was added."), 
        auto_now_add=True, 
        null=False
    )

    updated_at = models.DateTimeField(
        verbose_name=_("Created At"), 
        help_text=_("Time the subscription was updated."), 
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
        verbose_name=_("User"),
        help_text=_("The user who uploaded the post."),
        on_delete=models.CASCADE,
        related_name="posts",
        null=False,
    )

    seen_by = models.ManyToManyField(
        Users, 
        through="SeenPost",
        verbose_name=_("Seen By"),
        help_text=_("Users who have already seen the post."),
        related_name="viewed_posts"
    )

    reports_from_users = models.ManyToManyField(
        Users, 
        through="PostReport", 
        verbose_name=_("Reports From Users"), 
        help_text=_("Users who reported the post."),
        related_name="reported_posts", 
        blank=True
    )

    description = models.TextField(
        verbose_name=_("Description"), 
        help_text=_("Description of the post."),
        max_length=500, 
        null=True, 
        blank=True
    )

    tagged_users = models.ManyToManyField(
        Users, 
        verbose_name=_("Tagged Users"), 
        help_text=_("Users tagged in the post."),
        blank=True
    )

    added_hashtags = ArrayField(
        models.CharField(
            verbose_name=_("Added Hashtags"), 
            max_length=30
        ), 
        
        help_text=_("Hashtags added to the post."),
        default=list, 
        null=False
    )

    location = models.CharField(
        verbose_name=_("Location"), 
        help_text=_("Location added to the post."),
        max_length=255, 
        null=True, 
        blank=True
    )

    coordinates = models.PointField(
        verbose_name=_("Coordinates"), 
        help_text=_("The exact coordinates of the location added to the post in WGS84 (Standardized, Geocentric Coordinate System Used Globally For Mapping, Navigation And GPS) format."),
        null=True, 
        blank=True, 
        srid=4326
    )

    public_visibility = models.BooleanField(
        verbose_name=_("Public Visibility"), 
        help_text=_("Stores the information if the post is visible for public."),
        default=True, 
        null=False
    )

    allow_comments = models.BooleanField(
        verbose_name=_("Allow Comments"), 
        help_text=_("Stores the information if the comments are allowed for the post."),
        default=True, 
        null=False
    )

    hide_likes = models.BooleanField(
        verbose_name=_("Hide Likes"), 
        help_text=_("Stores the information if the post's likes are hidden."),
        default=False, 
        null=False
    )

    likes = models.PositiveIntegerField(
        verbose_name=_("Likes"), 
        help_text=_("Total amount of obtained likes."),
        default=0, 
        null=False
    )

    likes_from_users = models.ManyToManyField(
        Users, 
        verbose_name=_("Likes From Users"), 
        help_text=_("Users who liked the post."), 
        related_name="liked_posts", 
        blank=True
    )

    latest_interaction = models.DateTimeField(
        verbose_name=_("Latest Interaction"), 
        help_text=_("Time of the last recorded interaction with the post (new comment, like)."), 
        auto_now_add=True, 
        db_index=True
    )

    created_at = models.DateTimeField(
        verbose_name=_("Created At"), 
        help_text=_("Time of creation of the post."), 
        auto_now_add=True, 
        null=False
    )

    reports = models.PositiveIntegerField(
        verbose_name=_("Reports"), 
        help_text=_("Amount of received reports of the post."), 
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
        ("spam", _("Spam")),
        ("harassment", _("Harassment")),
        ("hate_speech", _("Hate Speech")),
        ("misinformation", _("Misinformation")),
        ("explicit_content", _("Explicit Content")),
        ("other", _("Other"))
    ]

    post = models.ForeignKey(
        Post,
        verbose_name=_("Post"),
        help_text=_("The post that received a report."), 
        on_delete=models.CASCADE,
        null=False,
    )

    user = models.ForeignKey(
        Users,
        verbose_name=_("User"),
        help_text=_("The user who submitted the report."), 
        on_delete=models.CASCADE,
        null=False,
    )

    reason = models.CharField(
        verbose_name=_("Reason"), 
        help_text=_("Reason for reporting."), 
        max_length=50, 
        choices=REPORT_REASON_CHOICES, 
        default="other", 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name=_("Created At"), 
        help_text=_("Report submission time."), 
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
        verbose_name=_("Post"),
        help_text=_("The post to which the given medium belongs."), 
        on_delete=models.CASCADE,
        related_name="media",
        null=False,
    )

    file = models.FileField(
        upload_to=getPostUploadPath,
        verbose_name=_("File"),
        help_text=_("Path to the file."), 
    )
    
    thumbnail = models.ImageField(
        upload_to=getPostUploadPath, 
        verbose_name=_("Thumbnail"),
        help_text=_("Path to the video thumbnail."), 
        null=True, 
        blank=True,
    )

    is_video = models.BooleanField(
        verbose_name=_("Is Video"), 
        help_text=_("Stores the information if the uploaded file is a video."), 
        default=False, 
        null=False
    )

    is_muted = models.BooleanField(
        verbose_name=_("Is Muted Video"), 
        help_text=_("Stores the information if the uploaded video is muted."), 
        default=False, 
        null=False
    )

    total_watch_time = models.FloatField(
        verbose_name=_("Total Watch Time"), 
        help_text=_("Total video watch time in seconds."), 
        null=True, 
        blank=True
    )

    is_processed = models.BooleanField(
        verbose_name=_("Is Processed"), 
        help_text=_("Stores the information if the uploaded file is already processed."), 
        default=False, 
        null=False
    )

    original_filename = models.CharField(
        verbose_name=_("Original Filename"), 
        help_text=_("Original filename of the uploaded file."), 
        max_length=255, 
        null=True, 
        blank=True
    )

    original_size = models.BigIntegerField(
        verbose_name=_("Original Size"), 
        help_text=_("Original size of the uploaded file."), 
        null=True, 
        blank=True
    )

    compressed_size = models.BigIntegerField(
        verbose_name=_("Compressed Size"), 
        help_text=_("Compressed size of the uploaded file."), 
        null=True, 
        blank=True
    )

    order = models.PositiveIntegerField(
        verbose_name=_("Order"), 
        help_text=_("Order of the uploaded file in post."), 
        default=0, 
        null=False
    )

    sprite_sheet = models.ImageField(
        verbose_name=_("Sprite Sheet"),
        help_text=_("Video image sprite sheet for scrubbar preview."), 
        upload_to=getPostUploadPath,
        null=True,
        blank=True
    )
    
    vtt_file = models.FileField(
        verbose_name=_("VTT File Map"),
        help_text=_("VTT file map of the video sprite sheet."), 
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
        verbose_name=_("User"),
        help_text=_("User who viewed the post."), 
        on_delete=models.CASCADE,
        related_name="seen_instances",
        null=False,
    )

    post = models.ForeignKey(
        Post,
        verbose_name=_("Post"),
        help_text=_("A post that has been viewed."), 
        on_delete=models.CASCADE,
        related_name="seen_by_instances",
        null=False,
    )

    viewed_at = models.DateTimeField(
        verbose_name=_("Viewed At"), 
        help_text=_("Post view time."), 
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
        verbose_name=_("Post Media"),
        help_text=_("The exact video from the post that was marked as seen."), 
        on_delete=models.CASCADE, 
        related_name="video_views",
        null=False
    )

    user = models.ForeignKey(
        Users,
        verbose_name=_("User"),
        help_text=_("A user who watched the video."), 
        on_delete=models.CASCADE,
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name=_("Created At"),
        help_text=_("The time when the user viewed the video."), 
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
        verbose_name=_("Post"),
        help_text=_("The post to which the comment belongs."), 
        on_delete=models.CASCADE,
        related_name="comments",
        null=False,
    )

    user = models.ForeignKey(
        Users, 
        verbose_name=_("User"), 
        help_text=_("The user who added the comment."), 
        on_delete=models.CASCADE, 
        related_name="post_comments",
        null=True,
    )

    reports_from_users = models.ManyToManyField(
        Users, 
        through="PostForumReport", 
        verbose_name=_("Reports From Users"), 
        help_text=_("Users who reported the comment."), 
        related_name="reported_post_forum_comments", 
        blank=True
    )

    comment = models.TextField(
        verbose_name=_("Comment"), 
        help_text=_("Comment content."), 
        max_length=100, 
        null=False
    )

    # tagged_users = models.ManyToManyField(Users, verbose_name="Tagged Users", blank=True)
    # added_hashtags = ArrayField(models.CharField(verbose_name="Added Hashtags", max_length=30), default=list, null=False)

    likes = models.PositiveIntegerField(
        verbose_name=_("Likes"), 
        help_text=_("Amount of obtained likes on the comment."), 
        default=0, 
        null=False
    )

    likes_from_users = models.ManyToManyField(
        Users, 
        verbose_name=_("Likes From Users"), 
        help_text=_("Users who liked the comment."), 
        related_name="liked_post_forum_comments", 
        blank=True
    )

    creation_time = models.DateTimeField(
        verbose_name=_("Creation Time"), 
        help_text=_("Time the comment was added."), 
        auto_now_add=True, 
        null=False
    )

    parent = models.ForeignKey(
        "self",
        verbose_name=_("Parent"),
        help_text=_("Link to the parent comment in the case of a reply."), 
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies",
    )

    status = models.CharField(
        verbose_name=_("Status"), 
        help_text=_("Current status of the comment."), 
        choices=STATUS_CHOICES, 
        max_length=20, 
        default="OK"
    )

    reports = models.PositiveIntegerField(
        verbose_name=_("Reports"), 
        help_text=_("Amount of received reports of the comment."), 
        default=0, 
        null=False
    )

    level = models.PositiveIntegerField(
        verbose_name=_("Level"), 
        help_text=_("Comment nesting level (1 is a main comment; deeper levels are replies)"), 
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
        ("spam", _("Spam")),
        ("harassment", _("Harassment")),
        ("hate_speech", _("Hate Speech")),
        ("misinformation", _("Misinformation")),
        ("explicit_content", _("Explicit Content")),
        ("other", _("Other"))
    ]

    postforum = models.ForeignKey(
        PostForum,
        verbose_name=_("Post Forum Comment"),
        help_text=_("The post comment that received a report."), 
        on_delete=models.CASCADE,
        null=False,
    )

    user = models.ForeignKey(
        Users,
        verbose_name=_("User"),
        help_text=_("The user who submitted the report."), 
        on_delete=models.CASCADE,
        null=False,
    )

    reason = models.CharField(
        verbose_name=_("Reason"), 
        help_text=_("Reason for reporting."), 
        max_length=50, 
        choices=REPORT_REASON_CHOICES, 
        default="other", 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name=_("Created At"), 
        help_text=_("Report submission time."), 
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
        verbose_name=_("User"),
        help_text=_("The user who added the link to their bio."), 
        on_delete=models.CASCADE,
        related_name="bio_links",
        null=False
    )

    # title = models.CharField(verbose_name="Title", max_length=20, null=False)
    
    url = models.URLField(
        verbose_name=_("URL Address"), 
        help_text=_("URL of the added link."), 
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
        verbose_name=_("Sender"),
        help_text=_("Message sender."), 
        on_delete=models.SET_NULL,
        related_name="sent_messages",
        null=True,
        blank=True
    )

    receiver = models.ForeignKey(
        Users,
        verbose_name=_("Receiver"),
        help_text=_("Message receiver."), 
        on_delete=models.SET_NULL, 
        related_name="received_messages",
        null=True,
        blank=True
    )

    content = models.TextField(
        verbose_name=_("Content"), 
        help_text=_("Message content."), 
        max_length=250, 
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name=_("Created At"), 
        help_text=_("Message sending time."), 
        auto_now_add=True, 
        null=False
    )

    is_read = models.BooleanField(
        verbose_name=_("Is Read"), 
        help_text=_("Stores the information if the message is read."), 
        default=False, 
        null=False
    )

    is_edited = models.BooleanField(
        verbose_name=_("Is Edited"), 
        help_text=_("Stores the information if the message was edited."), 
        default=False, 
        null=False
    )

    reacted_users = models.ManyToManyField(
        "Users",
        through="MessageReaction",
        verbose_name=_("Reactions"), 
        help_text=_("Users who reacted to the message."), 
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
        verbose_name=_("Chat"),
        help_text=_("The message to which the reaction belongs."), 
        on_delete=models.CASCADE, 
        related_name="message_reactions",
        null=False
    )

    user = models.ForeignKey(
        Users, 
        verbose_name=_("User"),
        help_text=_("The user who added a reaction to the message."), 
        on_delete=models.CASCADE, 
        related_name="user_reactions",
        null=False
    )
    
    emoji = models.CharField(
        verbose_name=_("Emoji"),
        help_text=_("Emoji added as a reaction."), 
        max_length=10,
        null=False
    )

    created_at = models.DateTimeField(
        verbose_name=_("Created At"), 
        help_text=_("Time the reaction was added."), 
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

class ContactMessage(models.Model):
    SUBJECT_CHOICES = [
        ("question", _("Question")),
        ("account_issue", _("Account Issue")),
        ("bug", _("Bug")),
        ("suggestion", _("Suggestion"))
    ]

    first_name = models.CharField(
        verbose_name=_("First Name"), 
        help_text=_("Sender's first name."),
        max_length=20,
        null=False
    )

    last_name = models.CharField(
        verbose_name=_("Last Name"), 
        help_text=_("Sender's last name."),
        max_length=50, 
        null=False
    )

    email_address = models.EmailField(
        verbose_name=_("E-mail Address"), 
        help_text=_("Sender's e-mail address."),
        max_length=50,
        null=False
    )

    subject = models.CharField(
        verbose_name=_("Subject"), 
        help_text=_("Subject of the message."),
        choices=SUBJECT_CHOICES, 
        default="question", 
        max_length=20
    )

    message = models.TextField(
        verbose_name="Message", 
        help_text="Message content.",
        max_length=200, 
        null=True, 
        blank=True
    )

    attachment = models.CharField(
        verbose_name=_("Attachment Filename"), 
        help_text=_("Selected attachment filename."),
        max_length=250, 
        null=True, 
        blank=True
    )

    creation_time = models.DateTimeField(
        verbose_name=_("Creation Time"), 
        help_text=_("Message sending time."), 
        auto_now_add=True,
        null=False
    )

    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"

    def __str__(self):
        return f"Message from {self.first_name} {self.last_name}"