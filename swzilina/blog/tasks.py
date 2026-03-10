from celery import shared_task

@shared_task
def testSharedTask():
    return "TEST SHARED TASK"