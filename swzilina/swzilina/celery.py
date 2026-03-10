import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'swzilina.settings')
app = Celery("swzilina")
app.config_from_object('django.conf:settings', namespace="CELERY")

@app.task
def testTask():
    return "TEST TASK"

app.autodiscover_tasks()