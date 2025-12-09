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

    def __str__(self):
        return f"{self.role}: {self.first_name} {self.last_name}"

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
    categories = ArrayField(models.CharField(verbose_name="Categories", max_length=50),default=list, null=False)
    rating = models.FloatField(verbose_name="Rating", default=0, null=False)
    visitors = models.IntegerField(verbose_name="Visitors", default=0, null=False)
    link = models.CharField(verbose_name="Link", max_length=50, null=False)
    image_name = models.CharField(verbose_name="Image File", max_length=50, null=True, blank=True)
    creation_time = models.DateTimeField(verbose_name="Creation Time", auto_now_add=True, null=False)

class ArticleForum(models.Model):
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
    creation_time = models.DateTimeField(verbose_name="Creation Time", auto_now_add=True, null=False)

    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies",
    )