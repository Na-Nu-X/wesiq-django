from django.db import models
class Users(models.Model):
    role_choices = [
        ("user", "user"),
        ("admin", "admin"),
    ]

    first_name = models.CharField(verbose_name="First Name", max_length=50, null=False)
    last_name = models.CharField(verbose_name="Last Name", max_length=50, null=False)
    email_address = models.CharField(verbose_name="E-mail Address", max_length=50, null=False)
    phone_number = models.CharField(verbose_name="Phone Number", max_length=50, null=True)
    password = models.CharField(verbose_name="Password", max_length=255, null=False)
    role = models.CharField(verbose_name="Role", choices=role_choices, default="user", null=False)

    def __str__(self):
        return f"{self.role}: {self.first_name} {self.last_name}"