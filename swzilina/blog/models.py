from django.db import models
from django.contrib.postgres.fields import ArrayField

class Users(models.Model):
    role_choices = [
        ("user", "user"),
        ("admin", "admin"),
    ]

    first_name = models.CharField(verbose_name="First Name", max_length=50)
    last_name = models.CharField(verbose_name="Last Name", max_length=50)
    email_address = models.CharField(verbose_name="E-mail Address", max_length=50)
    phone_number = models.CharField(verbose_name="Phone Number", max_length=50, null=True)
    password = models.CharField(verbose_name="Password", max_length=255)
    role = models.CharField(verbose_name="Role", choices=role_choices, default="user")
    profile_picture_name = models.CharField(verbose_name="Profile Picture File", max_length=50, null=True, blank=True)
    last_edit = models.DateTimeField(verbose_name="Last Edit Time", null=True, blank=True)
    creation_time = models.DateTimeField(verbose_name="Creation Time", auto_now_add=True, null=False)
    password_reset_code = models.CharField(verbose_name="Password Reset Code", max_length=6, null=True, blank=True)
    google_id = models.CharField(verbose_name="Google ID", max_length=255, null=True, blank=True)
    blog_subscribe = models.BooleanField(verbose_name="Blog Subscribe", default=False, null=False)

    following = ArrayField(models.CharField(verbose_name="Following"), default=list, null=False)
    followers = ArrayField(models.CharField(verbose_name="Followers"), default=list, null=False)

    xp = models.IntegerField(verbose_name="Total XP", default=0, null=False)

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
    likes_from_users = ArrayField(models.CharField(verbose_name="Likes From Users"), default=list, null=False)
    creation_time = models.DateTimeField(verbose_name="Creation Time", auto_now_add=True, null=False)

    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies",
    )

    status = models.CharField(verbose_name="Status", choices=status_choices, default="OK")
    reports = models.IntegerField(verbose_name="Reports", default=0, null=False)
    reports_from_users = ArrayField(models.CharField(verbose_name="Reports From Users"), default=list, null=False)

class TrainingPlan(models.Model):
    user = models.ForeignKey(
        Users, 
        verbose_name="User ID",
        on_delete=models.DO_NOTHING, 
        related_name="training_plans", 
        null=True,
    )

    day_choices = [
        ("Monday", "Monday"),
        ("Tuesday", "Tuesday"),
        ("Wednesday", "Wednesday"),
        ("Thursday", "Thursday"),
        ("Friday", "Friday"),
        ("Saturday", "Saturday"),
        ("Sunday", "Sunday"),
    ]

    day = models.CharField(verbose_name="Day", choices=day_choices, null=False)
    type = models.CharField(verbose_name="Type", max_length=50, null=False)
    exercise = models.CharField(verbose_name="Exercise", max_length=50, null=False)
    sets = models.IntegerField(verbose_name="Sets", default=1, null=False)
    reps = models.IntegerField(verbose_name="Reps", default=0, null=False) # 0 = To Failute / Max. Reps