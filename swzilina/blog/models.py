from django.db import models
from django.contrib.postgres.fields import ArrayField

class Users(models.Model):
    role_choices = [
        ("user", "user"),
        ("admin", "admin"),
    ]

    account_status_choices = [
        ("OK", "OK"),
        ("suspended", "suspended"),
        ("deleted", "deleted"),
    ]

    first_name = models.CharField(verbose_name="First Name", max_length=50)
    last_name = models.CharField(verbose_name="Last Name", max_length=50)
    email_address = models.CharField(verbose_name="E-mail Address", max_length=50)
    phone_number = models.CharField(verbose_name="Phone Number", max_length=50, null=True)
    password = models.CharField(verbose_name="Password", max_length=255)
    role = models.CharField(verbose_name="Role", choices=role_choices, default="user", max_length=20)
    profile_picture_name = models.CharField(verbose_name="Profile Picture File", max_length=50, null=True, blank=True)
    language = models.CharField(verbose_name="Language Code", max_length=10, default="en", null=False, blank=False)
    last_edit = models.DateTimeField(verbose_name="Last Edit Time", null=True, blank=True)
    creation_time = models.DateTimeField(verbose_name="Creation Time", auto_now_add=True, null=False)
    password_reset_code = models.CharField(verbose_name="Password Reset Code", max_length=6, null=True, blank=True)
    google_id = models.CharField(verbose_name="Google ID", max_length=255, null=True, blank=True)
    blog_subscribe = models.BooleanField(verbose_name="Blog Subscribe", default=False, null=False)
    following = ArrayField(models.CharField(verbose_name="Following", max_length=100), default=list, null=False)
    followers = ArrayField(models.CharField(verbose_name="Followers", max_length=100), default=list, null=False)
    xp = models.IntegerField(verbose_name="Total XP", default=0, null=False)
    account_status = models.CharField(verbose_name="Account Status", max_length=20, choices=account_status_choices, default="OK", null=False)
    last_login = models.DateTimeField(verbose_name="Last Login", auto_now_add=True, null=True, blank=True)

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
    likes_from_users = ArrayField(models.CharField(verbose_name="Likes From Users", max_length=100), default=list, null=False)
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
    reports_from_users = ArrayField(models.CharField(verbose_name="Reports From Users", max_length=100), default=list, null=False)

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