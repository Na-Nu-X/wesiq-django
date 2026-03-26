from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from blog.models import Users
import os, shutil
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import translation
from django.utils.translation import gettext as _

# Functions
def captureMessage(message):
    with open(f"{settings.LOGS_DIR}/celery_tasks.log", mode="a", encoding="utf-8") as file:
        # timezone.LocalTimezone
        file.write(f"[{timezone.now().strftime("%d.%m. %Y %X %Z")}] - {message}\n")

def sendMail(user, subject, text_content, html_content, html_content_end, html_content_middle=""):
    with translation.override(user.language):
        # Send Mail
        subject = f"SW Žilina - {subject}"
        text_content = _("Dobrý deň %(first_name)s %(last_name)s") % {"first_name": user.first_name, "last_name": user.last_name} + f",\n{text_content}"
        sender = settings.EMAIL_HOST_USER
        receiver = [user.email_address]
        html_content = f"""
            <h1>{_('Dobrý deň %(first_name)s %(last_name)s') % {"first_name": user.first_name, "last_name": user.last_name}},</h1>
            <p>{html_content}<p>
            <h1>{html_content_middle}</h1>
            <p>{html_content_end}<br>
            {_('Tím Street Workout Žilina.')}</p>
        """

        mail_message = EmailMultiAlternatives(subject, text_content, sender, receiver)
        mail_message.attach_alternative(html_content, "text/html")
        mail_message.send()

@shared_task(name="blog.tasks.cleanupSuspendedUsers")
def cleanupSuspendedUsers():
    # Gets Users From Database Which Are Suspended And Their Last Login Is Older Than 30 Days
    users_for_deletion = Users.objects.filter(
        account_status="suspended",
        last_login__lt=timezone.now() - timedelta(days=30)
    )
    
    users_for_deletion_count = users_for_deletion.count() # Gets Amount Of Users For Deletion
    
    if users_for_deletion_count > 0:
        users_with_profile_picture = users_for_deletion.exclude(profile_picture_name__in=["", None]) # Gets Users With Profile Picture

        # Deletes Profile Picture Files
        for user in users_with_profile_picture:
            path = os.path.join(settings.MEDIA_ROOT, f"images/{str(user.id)}")
            os.remove(f"{path}/{user.profile_picture_name}")

            # Deletes The Whole Folder If There Are No Files
            if len(os.listdir(path)) == 0:
                shutil.rmtree(path)

        # Send Mail
        for user in users_for_deletion:
            sendMail(
                user,
                _("Odstránenie účtu"), # Subject
                _("oznamujeme vám, že váš používateľský účet bol trvalo odstránený. Opätovné prihlásenie do pôvodného účtu už nie je možné. Ak by ste sa chceli v budúcnosti vrátiť, budeme radi, ak si vytvoríte nový.\nTím Street Workout Žilina."), # Text Content
                _('oznamujeme vám, že váš používateľský účet bol trvalo odstránený. Opätovné prihlásenie do pôvodného účtu už nie je možné.'), # HTML Content
                _('Ak by ste sa chceli v budúcnosti vrátiť, budeme radi, ak si vytvoríte nový.') # End Of HTML Content
            )

        users_for_deletion.delete() # Deletes Users

        # Sets Message
        message = f"{users_for_deletion_count} Suspended User Has Been Deleted" if users_for_deletion_count == 1 else f"{users_for_deletion_count} Suspended Users Has Been Deleted"
        captureMessage(message)
        return message

    # Sets Message
    message = "No Suspended Users Has Been Deleted"
    captureMessage(message)
    return message

@shared_task(name="blog.tasks.cleanupUnverifiedUsers")
def cleanupUnverifiedUsers():
    # Gets Users From Database Which Are Unverified And Their Creation Time Is Older Than 1 Days
    users_for_deletion = Users.objects.filter(
        account_status="unverified",
        creation_time__lt=timezone.now() - timedelta(days=1)
    )
    
    users_for_deletion_count = users_for_deletion.count() # Gets Amount Of Users For Deletion
    
    if users_for_deletion_count > 0:
        users_for_deletion.delete() # Deletes Users

        # Sets Message
        message = f"{users_for_deletion_count} Unverified User Has Been Deleted" if users_for_deletion_count == 1 else f"{users_for_deletion_count} Unverified Users Has Been Deleted"
        captureMessage(message)
        return message

    # Sets Message
    message = "No Unverified Users Has Been Deleted"
    captureMessage(message)
    return message

@shared_task(name="blog.tasks.weeklyReport")
def weeklyReport():
    return "Weekly Report"