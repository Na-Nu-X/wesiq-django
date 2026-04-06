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
from email.mime.image import MIMEImage
from django.db.models import Q
from django.db.models import Sum
from django.db.models.functions import TruncDate
import json
import math

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
            image.add_header("Content-Disposition", "inline", filename=f"Wesiq - Weekly Report {timezone.now().date()}.png")

            mail_message.attach(image)

        mail_message.send()

# Function For Formatting Time
def getFormattedTime(unit="seconds", elapsed_seconds=0, leading_zero=False):
    # Formats Seconds
    if(unit == "seconds"):
        result = math.floor(elapsed_seconds % 60) # Number Value Of Elapsed Seconds
        return f"{result:02d}" if leading_zero else result # Returns Formatted Style Of Elapsed Seconds If Format Parameter Is Set As True

    # Formats Minutes
    if(unit == "minutes"):
        result = (math.floor(elapsed_seconds / 60) % 60) # Number Value Of Elapsed Minutes
        return f"{result:02d}" if leading_zero else result # Returns Formatted Style Of Elapsed Minutes If Format Parameter Is Set As True

    # Formats Minutes
    if(unit == "hours"):
        result = (math.floor(elapsed_seconds / 3600) % 60) # Number Value Of Elapsed Hours
        return f"{result:02d}" if leading_zero else result # Returns Formatted Style Of Elapsed Hours If Format Parameter Is Set As True

    else: return "00" if leading_zero else "0" # Default Values

# Function For Formatting Time To Minimalist Format
def getMinimalistFormattedTime(elapsed_time):
    # For Example Converts 3600 To 1h
    result = ""

    result += f"{getFormattedTime("hours", elapsed_time)}h " if getFormattedTime("hours", elapsed_time) != 0 else ""
    result += f"{getFormattedTime("minutes", elapsed_time)}m " if getFormattedTime("minutes", elapsed_time) != 0 else ""
    result += f"{getFormattedTime("seconds", elapsed_time)}s" if getFormattedTime("seconds", elapsed_time) != 0 else "0s"

    return result

# Function For Getting Weekly Activity Data
def getWeeklyActivityData(user_id, weeks_before=0):
    today = timezone.now().date() - timedelta(days=1) if weeks_before == 0 else timezone.now().date() - timedelta(days=(weeks_before * 7) + 1) # End Date
    start_date = today - timedelta(days=7) if weeks_before == 0 else today - timedelta(days=((weeks_before * 7) + 7)) # Start Date

    # Gets Activities From Today's Date To Previous 7th Day And Counts Activity Elapsed Times For Each Date
    weekly_activity = (
        Activity.objects
        .filter(
            Q(user_id=user_id) & Q(end_time__date__gte=start_date) & Q(end_time__date__lte=today)
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

    return weekly_activity_result

# Function For Getting Average Activity Time Improvement Text
def getAverageActivityTimeImprovementText(activities_percentage_improvement):
    if activities_percentage_improvement > 0:
        return _("To je o %(value)s%% lepšie oproti predchádzajúcemu týždňu.") % {"value": round(activities_percentage_improvement)}  
        
    else:
        return _("To je o %(value)s%% horšie oproti predchádzajúcemu týždňu.") % {"value": abs(round(activities_percentage_improvement))}

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
        weekly_activity_result = getWeeklyActivityData(user.id) # Gets The Weekly Activity Result

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

        # Weekly Activity Result
        most_active_day = (max(weekly_activity_result, key=lambda x: x["total_elapsed_time"])).get("day") # Gets The Most Active Day Of Week
        most_active_day_time = getMinimalistFormattedTime((max(weekly_activity_result, key=lambda x: x["total_elapsed_time"])).get("total_elapsed_time")) # Gets The Value Of The Most Active Day Of Week
        average_activity_time = sum(data) / len(data) # Gets The Weekly Average Activity Time
        total_activity_time = sum(data) # Gets The Total Activity Time

        # Previous Weekly Activity Result
        previous_weekly_activity_result = getWeeklyActivityData(user.id, 1) # Gets The Previous Weekly Activity Result
        previous_data = [one_item["total_elapsed_time"] for one_item in previous_weekly_activity_result] # Gets Total Elapsed Time For Each Day As Data
        previous_average_activity_time = sum(previous_data) / len(previous_data) # Gets The Previous Weekly Average Activity Time

        activities_percentage_improvement = ((average_activity_time - previous_average_activity_time) / previous_average_activity_time) * 100 if previous_average_activity_time != 0 else 100 # Gets The Activities Percentage Improvement / Decrease

        # Mail With No Activity Info
        if average_activity_time == 0 and previous_average_activity_time == 0:
            # Send Mail
            sendMail(
                user,
                _("Týždenný prehľad aktivít"), # Subject
                _("Pozri sa na svoj prehľad aktivít za posledný týždeň.\n\nhttp://127.0.0.1:8000/%(language)s/trening/\n\nZačni týždeň s prvou aktivitou\nTím Wesiq.") % {"language": user.language}, # Text Content
                _('Pozri sa na svoj prehľad aktivít za posledný týždeň.<br>V poslednej dobe sme nezaznamenali žiadnu aktivitu.'), # HTML Content
                _('Začni týždeň s prvou <a href="http://127.0.0.1:8000/%(language)s/trening/" title="Začať tréning" target="_blank">aktivitou</a>.') % {"language": user.language}, # End Of HTML Content
                _('Priemerný čas bol 0s<br>Celkový čas bol 0s'), # HTML Middle Content
                chart_data
            )

        # Mail With No This Week's Activity Info
        elif average_activity_time == 0 and previous_average_activity_time > 0:
            # Send Mail
            sendMail(
                user,
                _("Týždenný prehľad aktivít"), # Subject
                _("Pozri sa na svoj prehľad aktivít za posledný týždeň.\n\nhttp://127.0.0.1:8000/%(language)s/trening/\n\nZačni týždeň s prvou aktivitou\nTím Wesiq.") % {"language": user.language}, # Text Content
                _('Pozri sa na svoj prehľad aktivít za posledný týždeň.<br>Tento týždeň sme nezaznamenali žiadnu aktivitu.'), # HTML Content
                _('Začni týždeň s prvou <a href="http://127.0.0.1:8000/%(language)s/trening/" title="Začať tréning" target="_blank">aktivitou</a>.') % {"language": user.language}, # End Of HTML Content
                _('Priemerný čas bol %(average_activity_time)s<br>Celkový čas bol %(total_activity_time)s<br>%(activities_percentage_improvement)s') % {"average_activity_time": getMinimalistFormattedTime(average_activity_time), "activities_percentage_improvement": getAverageActivityTimeImprovementText(activities_percentage_improvement), "total_activity_time": getMinimalistFormattedTime(total_activity_time)}, # HTML Middle Content
                chart_data
            )

        # Mail With Activity Info
        else:
            # Send Mail
            sendMail(
                user,
                _("Týždenný prehľad aktivít"), # Subject
                _("Pozri sa na svoj prehľad aktivít za posledný týždeň.\n\nhttp://127.0.0.1:8000/%(language)s/trening/\n\nZačni týždeň s prvou aktivitou\nTím Wesiq.") % {"language": user.language}, # Text Content
                _('Pozri sa na svoj prehľad aktivít za posledný týždeň.<br>Tvoj najviac aktívny deň bol <strong>%(most_active_day)s</strong> s dosiahnutým časom <strong>%(most_active_day_time)s</strong>') % {"most_active_day": most_active_day, "most_active_day_time": most_active_day_time}, # HTML Content
                _('Začni týždeň s prvou <a href="http://127.0.0.1:8000/%(language)s/trening/" title="Začať tréning" target="_blank">aktivitou</a>.') % {"language": user.language}, # End Of HTML Content
                _('Priemerný čas bol %(average_activity_time)s<br>Celkový čas bol %(total_activity_time)s<br>%(activities_percentage_improvement)s') % {"average_activity_time": getMinimalistFormattedTime(average_activity_time), "activities_percentage_improvement": getAverageActivityTimeImprovementText(activities_percentage_improvement), "total_activity_time": getMinimalistFormattedTime(total_activity_time)}, # HTML Middle Content
                chart_data
            )

    # Sets Message
    message = f"Weekly Report Has Been Sent To {len(users)} User" if len(users) == 1 else f"Weekly Report Has Been Sent To {len(users)} Users"
    captureMessage(message)
    return message