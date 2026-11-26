import os

from django import template
from django.conf import settings
from django.contrib.staticfiles import finders
from django.contrib.staticfiles.storage import staticfiles_storage
from django.templatetags.static import static

register = template.Library()

# Function For Get The Modification Time Of A Static File (None If It Can't Be Found)
def static_version(path):
    try:
        # Production Serves The collectstatic Copy, Development Serves The Source File From STATICFILES_DIRS
        file_path = finders.find(path) if settings.DEBUG else staticfiles_storage.path(path)
        return int(os.path.getmtime(file_path))
    except (TypeError, OSError, NotImplementedError):
        return None

# Function For Static URL With "?v=<Modification Time>" So Browsers Download A Replaced File Instead Of Their Cached Copy
def versioned_static(path):
    url = static(path)
    version = static_version(path)
    return f"{url}?v={version}" if version else url

# Function For Get The Version Of An Article Image (Sent By The API So The App Can Bust Its Image Cache)
def article_image_version(image_name):
    return static_version(f"images/articles/{image_name}") if image_name else None

@register.filter(name = "get_item")
def get_item(dictionary, key):
    return dictionary.get(key)

@register.filter(name = "format_time")
def format_time(elapsed_time):
    elapsed_time = int(elapsed_time)

    hours = (elapsed_time // 3600) % 60 # Gets Hours
    minutes = (elapsed_time // 60) % 60 # Gets Minutes
    seconds = elapsed_time % 60 # Gets Seconds

    result = [] # Stores The Result

    if hours: result.append(f"{hours}h") # Appends Hours
    if minutes: result.append(f"{minutes}m") # Appends Minutes
    if elapsed_time < 3600: result.append(f"{seconds}s") # Appends Seconds

    return " ".join(result) # Returns The Result

@register.filter(name = "article_image_url")
def article_image_url(image_name):
    return versioned_static(f"images/articles/{image_name}")
