from django import template

register = template.Library()

@register.filter(name="get_item")
def get_item(dictionary, key):
    return dictionary.get(key)

@register.filter(name="format_time")
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