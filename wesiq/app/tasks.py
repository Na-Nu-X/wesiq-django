from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from app.models import Users, Reviews, Articles, Exercises, Activity
import os, shutil
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import translation
from django.utils.translation import gettext as _
from django.core.cache import cache
from quickchart import QuickChart
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from email.mime.image import MIMEImage
from django.db.models import Q
from django.db.models import Sum
from django.db.models.functions import TruncDate
import json

# Functions
def captureMessage(message):
    with open(f"{settings.LOGS_DIR}/celery_tasks.log", mode="a", encoding="utf-8") as file:
        # timezone.LocalTimezone
        file.write(f"[{timezone.now().strftime("%d.%m. %Y %X %Z")}] - {message}\n")

def sendMail(user, subject, text_content, html_content, html_content_end, html_content_middle="", image_data=None):
    with translation.override(user.language):
        # Send Mail
        subject = f"Wesiq - {subject}"
        text_content = _("Dobrý deň %(first_name)s %(last_name)s") % {"first_name": user.first_name, "last_name": user.last_name} + f",\n{text_content}"
        sender = settings.EMAIL_HOST_USER
        receiver = [user.email_address]
        html_content = f"""
            <h1>{_('Dobrý deň %(first_name)s %(last_name)s') % {"first_name": user.first_name, "last_name": user.last_name}},</h1>
            <p>{html_content}<p>
            <h1>{html_content_middle}</h1>
            <p>{html_content_end}<br>
            {_('Tím')} Wesiq.</p>
        """

        mail_message = EmailMultiAlternatives(subject, text_content, sender, receiver)
        mail_message.attach_alternative(html_content, "text/html")

        if image_data:
            image = MIMEImage(image_data)

            image.add_header("Content-ID", "ID")
            image.add_header("Content-Disposition", "inline", filename="weekly_activity.png")

            mail_message.attach(image)

        # mail_message.send()

@shared_task
def modelsWarmUp():
    # Gets All Reviews
    reviews = list(
        Reviews.objects.all()
        # .values("user", "rating", "review", "last_edit", "creation_time")
    )

    # Gets All Articles
    articles = list(
        Articles.objects.all()
        # .values("user", "title", "content", "categories", "rating", "visitors", "link", "image_name", "creation_time")
    )

    # Gets All Exercises
    exercises = list(
        Exercises.objects.all()
        .order_by("exercise")
        # .values("exercise", "unit", "categories", "requires_weight")
    )
    
    cache.set("cached_reviews", reviews, timeout=settings.CACHE_TTL) # Caches Reviews
    cache.set("cached_articles", articles, timeout=settings.CACHE_TTL) # Caches Articles
    cache.set("cached_exercises", exercises, timeout=settings.CACHE_TTL) # Caches Exercises

    # Sets Message
    message = "Redis Cache With Models Has Been Updated"
    captureMessage(message)
    return message

@shared_task(name="app.tasks.cleanupSuspendedUsers")
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
                _("oznamujeme vám, že váš používateľský účet bol trvalo odstránený. Opätovné prihlásenie do pôvodného účtu už nie je možné.\n\nhttp://127.0.0.1:8000/%(language)s/registracia/\n\nAk by ste sa chceli v budúcnosti vrátiť, budeme radi, ak si vytvoríte nový.\nTím Wesiq.") % {"language": user.language}, # Text Content
                _('oznamujeme vám, že váš používateľský účet bol trvalo odstránený. Opätovné prihlásenie do pôvodného účtu už nie je možné.'), # HTML Content
                _('Ak by ste sa chceli v budúcnosti vrátiť, budeme radi, ak si <a href="http://127.0.0.1:8000/%(language)s/registracia/" title="Vytvoriť účet" target="_blank">vytvoríte nový</a>.') % {"language": user.language} # End Of HTML Content
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

@shared_task(name="app.tasks.cleanupUnverifiedUsers")
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

@shared_task(name="app.tasks.weeklyReport")
def weeklyReport():
    users = Users.objects.filter(account_status="OK") # Gets All Users With Valid Account Status

    for user in users:
        today = timezone.now().date() # Determines Today's Date
        start_date = today - timedelta(days=6) # Determines Previous 7th Date

        # Gets Activities From Today's Date To Previous 7th Day And Counts Activity Elapsed Times For Each Date
        weekly_activity = (
            Activity.objects
            .filter(
                Q(user_id=user.id) & Q(end_time__date__gte=start_date) & Q(end_time__date__lte=today)
            )
            .annotate(day=TruncDate("end_time"))
            .values("day")
            .annotate(total_elapsed_time=Sum("elapsed_time"))
        )

        # Creates Dictionary From Weekly Activity
        weekly_activity_dictionary = {
            one_day["day"]: one_day["total_elapsed_time"]
            for one_day in weekly_activity
        }

        weekday_labels = ["PO", "UT", "ST", "ŠT", "PI", "SO", "NE"] # Weekday Labels For Each Day

        weekly_activity_result = [] # Gets Final Results Of Weekly Activity Days And Elapsed Time For Each Day (For Example: [{'day': 'ŠT', 'total_elapsed_time': 2872}, {'day': 'PI', 'total_elapsed_time': 1451}, {'day': 'SO', 'total_elapsed_time': 825}, {'day': 'NE', 'total_elapsed_time': 639}, {'day': 'PO', 'total_elapsed_time': 2104}, {'day': 'UT', 'total_elapsed_time': 2555}, {'day': 'ST', 'total_elapsed_time': 3000}])

        # Fills And Sorts Result From The Oldest Date To Today's Date 
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            label = weekday_labels[day.weekday()]

            weekly_activity_result.append({
                "day": label,
                "total_elapsed_time": weekly_activity_dictionary.get(day, 0)
            })

        # Extracts Data From Weekly Activity Data
        labels = [one_item["day"] for one_item in weekly_activity_result] # Gets Days As Labels
        data = [one_item["total_elapsed_time"] for one_item in weekly_activity_result] # Gets Total Elapsed Time For Each Day As Data

        # Function To Set Theme Of Bars In The Chart Based On Values
        background_color = []
        border_color = []
        border_width = []
        
        for value in data:
            if value != 0:
                # Sets Bar Theme To Green
                background_color.append("rgb(195, 240, 175)")
                border_color.append("#52cf20")
                border_width.append(1)

            else:
                # Sets Bar Theme To Red
                background_color.append("#df3535")
                border_color.append("#df3535")
                border_width.append(0)

        # Generates The Chart Image
        qc = QuickChart()

        qc.version = "3"
        qc.width = 500
        qc.height = 250
        qc.device_pixel_ratio = 2.0
        qc.background_color = "#999999"

        qc.config = f"""{{
            type: "bar",

            data: {{
                labels: {json.dumps(labels)},

                datasets: [{{
                    data: {json.dumps(data)},
                    borderRadius: 0,
                    minBarLength: 2,
                    backgroundColor: {json.dumps(background_color)},
                    borderColor: {json.dumps(border_color)},
                    borderWidth: {json.dumps(border_width)}
                }}]
            }},

            options: {{
                animation: false,

                scales: {{
                    y: {{
                        display: false
                    }},

                    x: {{
                        ticks: {{
                            color: "#ffffff",

                            font: {{
                                family: "'Balsamiq Sans', sans-serif",
                                size: 15
                            }}
                        }},

                        grid: {{
                            display: false
                        }}
                    }}
                }},

                plugins: {{
                    legend: {{
                        display: false
                    }},

                    datalabels: {{
                        anchor: "end",
                        align: "bottom",
                        color: "#52cf20",

                        font: {{
                            family: "'Balsamiq Sans', sans-serif",
                            size: 12
                        }},

                        formatter: function(value) {{
                            if(value < 60) return ""

                            else {{
                                const hours = Math.floor(value / 3600)
                                const minutes = Math.floor((value % 3600) / 60)
                                
                                let result = ""

                                result += hours + "h "
                                result += minutes + "m"

                                return result
                            }}
                        }}
                    }}
                }}
            }},
        }}"""

        chart_data = qc.get_bytes() # Gets The Chart Data

        # Send Mail
        sendMail(
            user,
            _("Týždenný prehľad aktivít"), # Subject
            _("lorem\n\nhttp://127.0.0.1:8000/%(language)s/registracia/\n\nlorem\nTím Wesiq.") % {"language": user.language}, # Text Content
            _('lorem'), # HTML Content
            _('lorem <a href="http://127.0.0.1:8000/%(language)s/registracia/" title="Vytvoriť účet" target="_blank">lorem</a>.') % {"language": user.language}, # End Of HTML Content
            "",
            chart_data
        )

    return "Weekly Report"