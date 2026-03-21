from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from blog.models import Users
import os, logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)

if not logger.handlers:
    handler = logging.FileHandler(os.path.join(settings.LOGS_DIR, 'celery_tasks.log'), mode='a')
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    handler.terminator = '\n'

@shared_task(name="blog.tasks.cleanup_users")
def cleanup_users():
    # Gets Users From Database Which Are Suspended And Their Last Login Is Older Than 30 Days
    users_for_deletion = Users.objects.filter(
        account_status='suspended',
        last_login__lt=timezone.now() - timedelta(days=30)
    )
    
    users_for_deletion_count = users_for_deletion.count() # Gets Amount Of Users For Deletion
    
    if users_for_deletion_count > 0:
        users_with_profile_picture = users_for_deletion.exclude(profile_picture_name__in=["", None]) # Gets Users With Profile Picture

        # Deletes Profile Picture Files
        for user in users_with_profile_picture:
            path = os.path.join(settings.MEDIA_ROOT, f"images/{str(user.id)}")
            os.remove(f"{path}/{user.profile_picture_name}")

        # Send Mail
        for user in users_for_deletion:
            subject = "SW Žilina - Odstránenie účtu"
            text_content = f"Dobrý deň {user.first_name} {user.last_name},\noznamujeme vám, že váš používateľský účet bol trvalo odstránený. Opätovné prihlásenie do pôvodného účtu už nie je možné. Ak by ste sa chceli v budúcnosti vrátiť, budeme radi, ak si vytvoríte nový.\nTím Street Workout Žilina."
            sender = settings.EMAIL_HOST_USER
            receiver = [user.email_address]
            html_content = f"""
                <h1>Dobrý deň {user.first_name} {user.last_name},</h1>
                <p>oznamujeme vám, že váš používateľský účet bol trvalo odstránený. Opätovné prihlásenie do pôvodného účtu už nie je možné. Ak by ste sa chceli v budúcnosti vrátiť, budeme radi, ak si vytvoríte nový.<p><br>
                Tím Street Workout Žilina.</p>
            """

            mail_message = EmailMultiAlternatives(subject, text_content, sender, receiver)
            mail_message.attach_alternative(html_content, "text/html")
            mail_message.send()

        users_for_deletion.delete() # Deletes Users

        # Sets Message
        message = f"{users_for_deletion_count} User Has Been Deleted" if users_for_deletion_count == 1 else f"{users_for_deletion_count} Users Has Been Deleted"
        logger.info(message)
        return message

    # Sets Message
    message = "No Users Has Been Deleted."
    logger.info(message)
    return message