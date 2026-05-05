from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from app.models import Users, Reviews, Articles, Exercises, Activity, PostMedia
import os, shutil, io, subprocess, math, random, json
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import translation
from django.utils.translation import gettext as _
from django.core.cache import cache
from quickchart import QuickChart
from email.mime.image import MIMEImage
from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.core.files.base import ContentFile
from PIL import Image
from django.core.files import File

# Functions

# Function For Capture The Message to The Logs
def captureMessage(message):
    with open(f"{settings.LOGS_DIR}/celery_tasks.log", mode="a", encoding="utf-8") as file:
        file.write(f"[{timezone.now().strftime("%d.%m. %Y %X %Z")}] - {message}\n")

# Function For Send Mail
def sendMail(user, subject, text_content, html_content, html_content_end, html_content_middle=""):
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

        mail_message.send()

# Function For Send Weekly Report Mail
def sendWeeklyReportMail(user, activity_data):
    with translation.override(user.language):
        # Mail With No Activity Info
        if activity_data["average_activity_time"] == 0 and activity_data["previous_average_activity_time"] == 0:
            # Send Mail
            text_content = _("Dobrý deň %(first_name)s %(last_name)s") % {"first_name": user.first_name, "last_name": user.last_name} + ",\n" + _("V poslednej dobe sme nezaznamenali žiadnu aktivitu.") + "\n" + _("Začni týždeň s prvou aktivitou kliknutím na odkaz nižšie.") + "\n" + _("%(domain)s%(language)s/trening/" % {"domain": settings.DOMAIN_URL, "language": user.language} + "\n\n" + _("Tím") + "Wesiq.")

            html_content = f"""
                <h1>{_('Dobrý deň %(first_name)s %(last_name)s') % {"first_name": user.first_name, "last_name": user.last_name}},</h1>

                <p>{_('V poslednej dobe sme nezaznamenali žiadnu aktivitu.')}</p>

                <p>{_('Začni týždeň s prvou <a href="%(domain)s%(language)s/trening/" title="Začať tréning" target="_blank">aktivitou</a>.') % {"domain": settings.DOMAIN_URL, "language": user.language}}</p>

                <br>

                <img src='cid:weekly_chart'>
                <img src='cid:exercise_summary_chart'>

                <br>

                {_('Tím')} Wesiq.</p>
            """

        # Mail With No This Week's Activity Info
        elif activity_data["average_activity_time"] == 0 and activity_data["previous_average_activity_time"] > 0:
            # Send Mail
            text_content = _("Dobrý deň %(first_name)s %(last_name)s") % {"first_name": user.first_name, "last_name": user.last_name} + ",\n" + _("Minulý týždeň sme nezaznamenali žiadnu aktivitu.") + "\n" + _("Celkovo si dosiahol aktívneho času 0s - to je o 100% horšie oproti predchádzajúcemu týždňu") + "\n" + _("Začni týždeň s prvou aktivitou kliknutím na odkaz nižšie.") + "\n" + _("%(domain)s%(language)s/trening/" % {"domain": settings.DOMAIN_URL, "language": user.language} + "\n\n" + _("Tím") + "Wesiq.")

            html_content = f"""
                <h1>{_('Dobrý deň %(first_name)s %(last_name)s') % {"first_name": user.first_name, "last_name": user.last_name}},</h1>

                <p>{_('Minulý týždeň sme nezaznamenali žiadnu aktivitu.')}</p>

                <h1>{_('Celkovo si dosiahol aktívneho času <span style="color: #df3535">0s</span> - to je o <span style="color: #df3535">100%</span> horšie oproti predchádzajúcemu týždňu')}</h1>

                <p>{_('Začni týždeň s prvou <a href="%(domain)s%(language)s/trening/" title="Začať tréning" target="_blank">aktivitou</a>.') % {"domain": settings.DOMAIN_URL, "language": user.language}}</p>

                <br>

                <img src='cid:weekly_chart'>
                <img src='cid:exercise_summary_chart'>

                <br>

                {_('Tím')} Wesiq.</p>
            """

        # Mail With Activity Info
        else:
            # Send Mail
            text_content = _("Dobrý deň %(first_name)s %(last_name)s") % {"first_name": user.first_name, "last_name": user.last_name} + ",\n" + _("Pozri sa na svoj prehľad aktivít za posledný týždeň.") + "\n" + _("Tvoj najviac aktívny deň bol %(most_active_day)s s celkovým časom aktivity %(most_active_day_time)s") % {"most_active_day": activity_data["most_active_day"], "most_active_day_time": getMinimalistFormattedTime(activity_data["most_active_day_time"])} + "\n" + _("Priemerná aktivita trvala %(average_activity_time)s") % {"average_activity_time": getMinimalistFormattedTime(activity_data["average_activity_time"])} + "\n" + _("Celkovo si dosiahol aktívneho času %(total_activity_time)s - %(activity_percentage_improvement)s") % {"total_activity_time": getMinimalistFormattedTime(activity_data["total_activity_time"]), "activity_percentage_improvement": getAverageActivityTimeImprovementText(activity_data["activity_percentage_improvement"], False)} + "\n" + _("Celkovo si zaznamenal %(total_activity_amount)s aktivity") % {"total_activity_amount": activity_data["total_activity_amount"]} + "\n" + getFavoriteExerciseText(activity_data["favorite_exercise"], styled=False) + "\n" + _("Začni týždeň s prvou aktivitou kliknutím na odkaz nižšie.") + "\n" + _("%(domain)s%(language)s/trening/" % {"domain": settings.DOMAIN_URL, "language": user.language} + "\n\n" + _("Tím") + "Wesiq.")

            html_content = f"""
                <h1>{_('Dobrý deň %(first_name)s %(last_name)s') % {"first_name": user.first_name, "last_name": user.last_name}},</h1>

                <p>{_('Pozri sa na svoj prehľad aktivít za posledný týždeň.')}</p>

                <p>{_('Tvoj najviac aktívny deň bol <strong>%(most_active_day)s</strong> s celkovým časom aktivity <strong>%(most_active_day_time)s</strong>') % {"most_active_day": activity_data["most_active_day"], "most_active_day_time": getMinimalistFormattedTime(activity_data["most_active_day_time"])}}</p>

                <h1>{_('Priemerná aktivita trvala <span style="color: #52cf20">%(average_activity_time)s</span>') % {"average_activity_time": getMinimalistFormattedTime(activity_data["average_activity_time"])}}</h1>

                <h1>{_('Celkovo si dosiahol aktívneho času <span style="color: #52cf20">%(total_activity_time)s</span> - %(activity_percentage_improvement)s') % {"total_activity_time": getMinimalistFormattedTime(activity_data["total_activity_time"]), "activity_percentage_improvement": getAverageActivityTimeImprovementText(activity_data["activity_percentage_improvement"])}}</h1>

                <h1>{_('Celkovo si zaznamenal <span style="color: #52cf20">%(total_activity_amount)s</span> aktivity') % {"total_activity_amount": activity_data["total_activity_amount"]}}</h1>

                <p>{getFavoriteExerciseText(activity_data["favorite_exercise"])}</p>

                <p>{_('Začni týždeň s prvou <a href="%(domain)s%(language)s/trening/" title="Začať tréning" target="_blank">aktivitou</a>.') % {"domain": settings.DOMAIN_URL, "language": user.language}}</p>

                <br>

                <img src='cid:weekly_chart'>
                <img src='cid:exercise_summary_chart'>

                <br>

                {_('Tím')} Wesiq.</p>
            """

        subject = f"Wesiq - Tvoj týždenný prehľad"
        sender = settings.EMAIL_HOST_USER
        receiver = [user.email_address]

        mail_message = EmailMultiAlternatives(subject, text_content, sender, receiver)
        mail_message.attach_alternative(html_content, "text/html")

        # Attaches The Weekly Activity Chart Image if is Available
        if activity_data["weekly_activity_chart_data"]:
            image = MIMEImage(activity_data["weekly_activity_chart_data"])
            image.add_header("Content-ID", "<weekly_chart>")
            image.add_header(
                "Content-Disposition",
                "inline",
                filename=f"Wesiq - Weekly Report {timezone.now().date()}.png"
            )

            mail_message.attach(image)

        # Attaches The Weekly Training Plan Summary Chart Image if is Available
        if activity_data["weekly_training_plan_summary_chart_data"]:
            image = MIMEImage(activity_data["weekly_training_plan_summary_chart_data"])
            image.add_header("Content-ID", "<exercise_summary_chart>")
            image.add_header(
                "Content-Disposition", 
                "inline", 
                filename=f"Wesiq - Weekly Report {timezone.now().date()}.png"
            )

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

# Function For Get User's Weekly Activity Data
def getWeeklyActivityData(user, weeks_before=0):
    today = timezone.now().date() # Gets Today's Date
    end_date = today - timedelta(days=(weeks_before * 7) + 1) # End Date
    start_date = end_date - timedelta(days=6) # Start Date

    # Gets Weekly Activity From Today's Date To Previous 7th Day And Counts Activity Elapsed Times For Each Date
    weekly_activity = (
        Activity.objects
        .filter(
            user_id=user.id,
            end_time__date__range=[start_date, end_date] # Every Date Between Those (Total of 7 Days)
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

    with translation.override(user.language):
        weekday_labels = [_("PO"), _("UT"), _("ST"), _("ŠT"), _("PI"), _("SO"), _("NE")] # Weekday Labels For Each Day

    weekly_activity_data = [] # Gets Final Results Of Weekly Activity Days And Elapsed Time For Each Day (For Example: [{'day': 'ŠT', 'total_elapsed_time': 2872}, {'day': 'PI', 'total_elapsed_time': 1451}, {'day': 'SO', 'total_elapsed_time': 825}, {'day': 'NE', 'total_elapsed_time': 639}, {'day': 'PO', 'total_elapsed_time': 2104}, {'day': 'UT', 'total_elapsed_time': 2555}, {'day': 'ST', 'total_elapsed_time': 3000}])

    # Fills And Sorts Result From The Oldest Date To Today's Date
    for i in range(6, -1, -1):
        day = end_date - timedelta(days=i)
        label = weekday_labels[day.weekday()]

        weekly_activity_data.append({
            "day": label,
            "total_elapsed_time": weekly_activity_dictionary.get(day, 0)
        })

    return weekly_activity_data

# Function For Get Weekly Training Plan Summary
def getWeeklyTrainingPlanSummaryData(user_id, weeks_before=0, amount=5):
    today = timezone.now().date() # Gets Today's Date
    end_date = today - timedelta(days=(weeks_before * 7) + 1) # End Date
    start_date = end_date - timedelta(days=6) # Start Date

    # Gets Weekly Training Plan Summary Values
    weekly_training_plan_summary_data = Activity.objects.filter(
        user_id=user_id,
        end_time__date__range=[start_date, end_date] # Every Date Between Those (Total of 7 Days)
    ).exclude(training_plan_summary__isnull=True).values("training_plan_summary")

    result_dict = {}

    for one_activity in weekly_training_plan_summary_data:
        for one_item in one_activity["training_plan_summary"]:
            exercise = one_item["exercise"]
            elapsed_time = one_item["elapsed_time"]

            if exercise not in result_dict:
                result_dict[exercise] = 0

            result_dict[exercise] += elapsed_time

    result = [
        {"color": randomColor(128, 255), "exercise": exercise, "elapsed_time": elapsed_time}
        for exercise, elapsed_time in result_dict.items()
    ]

    result.sort(key=lambda x: x["elapsed_time"], reverse=True) # Sorts The Exercises by The Longest Elapsed Time

    return result[:amount] # Gets Only The Amount of Exercises by Entered Value

# Function For Get Total Amount of Recorded Activity of the User
def getTotalActivityAmount(user_id, weeks_before=0):
    today = timezone.now().date() # Gets Today's Date
    end_date = today - timedelta(days=(weeks_before * 7) + 1) # End Date
    start_date = end_date - timedelta(days=6) # Start Date

    # Counts Amount Of User's Activity
    total_activity_amount = Activity.objects.filter(
        user_id=user_id,
        end_time__date__range=[start_date, end_date] # Every Date Between Those (Total of 7 Days)
    ).count()

    return total_activity_amount

# Function For Getting Average Activity Time Improvement Text
def getAverageActivityTimeImprovementText(activity_percentage_improvement, styled=True):
    if activity_percentage_improvement > 0:
        if styled:
            return _("to je o <span style='color: #52cf20'>%(value)s%%</span> lepšie oproti predchádzajúcemu týždňu") % {"value": round(activity_percentage_improvement)}

        else:
            return _("to je o %(value)s%% lepšie oproti predchádzajúcemu týždňu") % {"value": round(activity_percentage_improvement)}
        
    else:
        if styled:
            return _("to je o <span style='color: #df3535'>%(value)s%%</span> horšie oproti predchádzajúcemu týždňu") % {"value": abs(round(activity_percentage_improvement))}

        else:
            return _("to je o %(value)s%% horšie oproti predchádzajúcemu týždňu") % {"value": abs(round(activity_percentage_improvement))}

# Function For Getting Favorite Exercise Text Text
def getFavoriteExerciseText(favorite_exercise, styled=True):
    if favorite_exercise:
        if styled:
            favorite_exercise_text = _('Tvoj obľúbený cvik týždňa bol <span style="color: %(color)s">%(exercise)s</span>') % {"color": favorite_exercise["color"],"exercise": favorite_exercise["exercise"]}

        else:
            favorite_exercise_text = _('Tvoj obľúbený cvik týždňa bol %(exercise)s') % {"exercise": favorite_exercise["exercise"]}

    else:
        if styled:
            favorite_exercise_text = _('Vytvor si <a href="https://delinquently-overdistraught-glynis.ngrok-free.dev/%(language)s/my-training-plans/?create" title="Vytvoriť tréningový plán" target="_blank">tréningový plán</a> pre získanie viac štatistík.')

        else:
            favorite_exercise_text = _('Vytvor si tréningový plán kliknutím na href="https://delinquently-overdistraught-glynis.ngrok-free.dev/%(language)s/my-training-plans/?create pre získanie viac štatistík.')

    return favorite_exercise_text

# Function To Set Theme Of Bars In The Chart Based On Values
def setBarTheme(data):
    bar_theme = {
        "background_color": [],
        "border_color": [],
        "border_width": []
    }
    
    for value in data:
        if value != 0:
            # Sets Bar Theme To Green
            bar_theme["background_color"].append("rgb(195, 240, 175)")
            bar_theme["border_color"].append("#52cf20")
            bar_theme["border_width"].append(1)

        else:
            # Sets Bar Theme To Red
            bar_theme["background_color"].append("#df3535")
            bar_theme["border_color"].append("#df3535")
            bar_theme["border_width"].append(0)

    return bar_theme

# Function For Generate Random Color In The Specific Range
def randomColor(from_=0, to=255):
    return f"rgb({random.randint(from_, to)},{random.randint(from_, to)},{random.randint(from_, to)})"

@shared_task
def modelsWarmUp():
    reviews = list(Reviews.objects.all()) # Gets All Reviews
    articles = list(Articles.objects.all()) # Gets All Articles
    exercises = list(Exercises.objects.all().order_by("exercise")) # Gets All Exercises
    
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
                _("oznamujeme vám, že váš používateľský účet bol trvalo odstránený. Opätovné prihlásenie do pôvodného účtu už nie je možné.\n\n%(domain)s%(language)s/registracia/\n\nAk by ste sa chceli v budúcnosti vrátiť, budeme radi, ak si vytvoríte nový.\nTím Wesiq.") % {"domain": settings.DOMAIN_URL, "language": user.language}, # Text Content
                _('oznamujeme vám, že váš používateľský účet bol trvalo odstránený. Opätovné prihlásenie do pôvodného účtu už nie je možné.'), # HTML Content
                _('Ak by ste sa chceli v budúcnosti vrátiť, budeme radi, ak si <a href="%(domain)s%(language)s/registracia/" title="Vytvoriť účet" target="_blank">vytvoríte nový</a>.') % {"domain": settings.DOMAIN_URL, "language": user.language} # End Of HTML Content
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
    users = Users.objects.filter(account_status="OK", id=16) # Gets All Users With Valid Account Status
    # users = Users.objects.filter(account_status="OK") # Gets All Users With Valid Account Status

    for user in users:
        # Weekly Activity Chart

        weekly_activity_data = getWeeklyActivityData(user) # Gets The Weekly Activity Data

        # Extracts Data From Weekly Activity Data
        bar_chart_labels = [one_item["day"] for one_item in weekly_activity_data] # Gets Days As Labels
        bar_chart_data = [one_item["total_elapsed_time"] for one_item in weekly_activity_data] # Gets Total Elapsed Time For Each Day As Data

        # Generates The Weekly Activity Chart Image
        bar_chart = QuickChart()

        bar_chart.version = "3"
        bar_chart.width = 500
        bar_chart.height = 250
        bar_chart.device_pixel_ratio = 2.0
        bar_chart.background_color = "transparent"

        bar_chart.config = f"""{{
            type: "bar",

            data: {{
                labels: {json.dumps(bar_chart_labels)},

                datasets: [{{
                    data: {json.dumps(bar_chart_data)},
                    borderRadius: 0,
                    minBarLength: 2,
                    backgroundColor: {json.dumps(setBarTheme(bar_chart_data)["background_color"])},
                    borderColor: {json.dumps(setBarTheme(bar_chart_data)["border_color"])},
                    borderWidth: {json.dumps(setBarTheme(bar_chart_data)["border_width"])}
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
                            color: "#cccccc",

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

        weekly_activity_chart_data = bar_chart.get_bytes() # Gets The Chart Data

        # Weekly Training Plan Summary Chart

        weekly_training_plan_summary_data = getWeeklyTrainingPlanSummaryData(user.id) # Gets The Weekly Activity Data

        if len(weekly_training_plan_summary_data) > 0:
            favorite_exercise = max(weekly_training_plan_summary_data, key=lambda x: x["elapsed_time"]) # Gets the Exercise From The Weekly Training Plan Summary With Longest Elapsed Time

            # Extracts Data From Weekly Training Plan Summary Data
            doughnut_chart_colors = [one_item["color"] for one_item in weekly_training_plan_summary_data] # Gets Color For Each Exercise
            doughnut_chart_labels = [one_item["exercise"] for one_item in weekly_training_plan_summary_data] # Gets Exercises As Labels
            doughnut_chart_data = [one_item["elapsed_time"] for one_item in weekly_training_plan_summary_data] # Gets Elapsed Time For Each Exercise As Data

            # Generates The Training Plan Summary Chart Image
            doughnut_chart = QuickChart()

            doughnut_chart.version = "3"
            doughnut_chart.width = 250
            doughnut_chart.height = 250
            doughnut_chart.device_pixel_ratio = 2.0
            doughnut_chart.background_color = "transparent"

            doughnut_chart.config = {
                "type": "doughnut",

                "data": {
                    "labels": doughnut_chart_labels,

                    "datasets": [{
                        "data": doughnut_chart_data,
                        "backgroundColor": doughnut_chart_colors,
                        "borderColor": "#cccccc",
                        "borderWidth": 2,
                        "borderRadius": 5,
                        "offset": 10
                    }]
                },

                "options": {
                    "plugins": {
                        "legend": {
                            "display": True,
                            "position": "top",

                            "labels": {
                                "boxWidth": 0,
                                "fontSize": 5,
                                "fontStyle": "bold",
                                "color": "#cccccc",
                                "padding": 5,
                            }
                        },

                        "datalabels": {
                            "display": False
                        }
                    },

                    "cutout": "50%"
                }
            }

            weekly_training_plan_summary_chart_data = doughnut_chart.get_bytes() # Gets The Chart Data

        # Weekly Activity Data
        most_active_day = (max(weekly_activity_data, key=lambda x: x["total_elapsed_time"])).get("day") # Gets The Most Active Day Of Week
        most_active_day_time = (max(weekly_activity_data, key=lambda x: x["total_elapsed_time"])).get("total_elapsed_time") # Gets The Value Of The Most Active Day Of Week
        average_activity_time = sum(bar_chart_data) / len(bar_chart_data) # Gets The Weekly Average Activity Time
        total_activity_time = sum(bar_chart_data) # Gets The Total Activity Time

        # Previous Weekly Activity Data
        previous_weekly_activity_data = getWeeklyActivityData(user, 1) # Gets The Previous Weekly Activity Data
        previous_doughnut_chart_data = [one_item["total_elapsed_time"] for one_item in previous_weekly_activity_data] # Gets Total Elapsed Time For Each Day As Data
        previous_average_activity_time = sum(previous_doughnut_chart_data) / len(previous_doughnut_chart_data) # Gets The Previous Weekly Average Activity Time

        activity_percentage_improvement = ((average_activity_time - previous_average_activity_time) / previous_average_activity_time) * 100 if previous_average_activity_time != 0 else 100 # Gets The Activity Percentage Improvement / Decrease

        # Stores All of the Activity Data
        activity_data = {
            "most_active_day": most_active_day, # Stores The Most Active Day
            "most_active_day_time": most_active_day_time, # Stores The Most Active Day Time
            "average_activity_time": average_activity_time, # Stores The Average Activity Time
            "previous_average_activity_time": previous_average_activity_time, # Stores The Previous Average Activity Time
            "total_activity_time": total_activity_time, # Stores The Total Activity Time
            "activity_percentage_improvement": activity_percentage_improvement, # Stores The Activity Percentage Improvement or Decrease
            "total_activity_amount": getTotalActivityAmount(user.id), # Stores The Total Activity Amount
            "weekly_activity_chart_data": weekly_activity_chart_data, # Stores The Weekly Activity Chart Data
            "weekly_training_plan_summary_chart_data": weekly_training_plan_summary_chart_data, # Stores The Weekly Training Plan Summary Chart Data
            "favorite_exercise": favorite_exercise # Stores The Favorite Exercise
        }

        sendWeeklyReportMail(user, activity_data) # Sends Weekly Report Mail

    # Sets Message
    message = f"Weekly Report Has Been Sent To {len(users)} User" if len(users) == 1 else f"Weekly Report Has Been Sent To {len(users)} Users"
    captureMessage(message)
    return message

@shared_task
def compressImage(post_media_id):
    try:
        media_object = PostMedia.objects.get(id=post_media_id)
        
        # If The File Was Not Found
        if not media_object.file:
            message = f"The Image To Compress Was Not Found."
            captureMessage(message)
            return message

        old_file_path = media_object.file.path # Stores The File Path Of The Original File

        with Image.open(media_object.file) as image:
            # Resizes The Image
            max_width = 1920

            if image.width > max_width:
                ratio = max_width / float(image.width)
                new_height = int(float(image.height) * float(ratio))
                image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)

            # Converts The Image To RGB Format
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
            
            # Stores To Memory
            buffer = io.BytesIO()
            image.save(buffer, format="JPEG", quality=70, optimize=True, progressive=True) # Compresses The Image
            
            new_file_name = os.path.basename(old_file_path).split('.')[0] + '_compressed.jpg'

            # Saves The Data To The Database
            media_object.file.save(new_file_name, ContentFile(buffer.getvalue()), save=False)
            media_object.is_processed = True
            media_object.save()

        media_object.file.close()
        
        # Removes Original Image File From Disk
        if os.path.exists(old_file_path):
            os.remove(old_file_path)

        message = f"Image {post_media_id} Was Successfully Compressed."
        captureMessage(message)
        return message
        
    except PostMedia.DoesNotExist:
        message = f"Image {post_media_id} Does Not Exist."
        captureMessage(message)
        return message

    except Exception as e:
        message = f"An Error Occurred During Compression: {str(e)}"
        captureMessage(message)
        return message

@shared_task
def compressVideo(post_media_id):
    try:
        media_object = PostMedia.objects.get(id=post_media_id)
        
        # If The File Was Not Found
        if not media_object.file:
            message = f"The Video To Compress Was Not Found."
            captureMessage(message)
            return message

        input_path = media_object.file.path
        old_file_path = input_path # Stores The File Path Of The Original File

        # Thumbnail Generation

        thumb_temp_path = os.path.join(settings.MEDIA_ROOT, 'temp', f"thumb_{post_media_id}.jpg")
        os.makedirs(os.path.dirname(thumb_temp_path), exist_ok=True)

        # Gets The Frame From The First Second Of The Video
        thumb_command = [
            'ffmpeg', '-y', '-ss', '00:00:01', '-i', input_path,
            '-vframes', '1', '-q:v', '2', thumb_temp_path
        ]

        try:
            subprocess.run(thumb_command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            with open(thumb_temp_path, 'rb') as f:
                media_object.thumbnail.save(f"THUMB-{post_media_id}.jpg", ContentFile(f.read()), save=True)

        except subprocess.CalledProcessError as e:
            message = f"Video {post_media_id} Is Shorter Than 1 Second."
            captureMessage(message)
            return message

        finally:
            # Removes Temporary Thumbnail Image File From Disk
            if os.path.exists(thumb_temp_path):
                os.remove(thumb_temp_path)

        # Video Compression

        output_filename = f"compressed_{post_media_id}.mp4"
        output_path = os.path.join(settings.MEDIA_ROOT, 'temp', output_filename)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # FFmpeg Compression
        command = [
            'ffmpeg', '-y', '-i', input_path,
            '-vcodec', 'libx264', 
            '-crf', '32',
            '-preset', 'fast',
            '-acodec', 'aac',
            '-b:a', '128k',
            output_path
        ]

        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        original_size = os.path.getsize(input_path)
        compressed_size = os.path.getsize(output_path)

        # Stores The Original File (If The Compressed Is Larger)
        if compressed_size >= original_size:
            # Saves The Data To The Database
            media_object.is_processed = True
            media_object.save()

        # Stores The Compressed Video File
        else:
            with open(output_path, 'rb') as f:
                # Saves The Data To The Database
                new_file_name = f"VID_{post_media_id}.mp4" 
                media_object.file.save(new_file_name, File(f), save=False)
                media_object.is_processed = True
                media_object.save()

            media_object.file.close()

            # Removes Original Video File From Disk
            if os.path.exists(old_file_path):
                os.remove(old_file_path)

        # Removes Temporary Video File From Disk
        if os.path.exists(output_path):
            os.remove(output_path)

        message = f"Video {post_media_id} Was Successfully Compressed."
        captureMessage(message)
        return message

    except PostMedia.DoesNotExist:
        message = f"Video {post_media_id} Does Not Exist."
        captureMessage(message)
        return message

    except subprocess.CalledProcessError as e:
        message = f"FFmpeg Error Occurred During Video Compression: {e.stderr.decode('utf-8')}"
        captureMessage(message)
        return message

    except Exception as e:
        message = f"An Error Occurred During Video Compression: {str(e)}"
        captureMessage(message)
        return message