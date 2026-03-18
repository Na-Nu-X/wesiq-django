from django.contrib import admin
from .models import Users, Activity, Reviews, Articles, ArticleForum, TrainingPlan, Exercises

admin.site.register(Users)
admin.site.register(Activity)
admin.site.register(Reviews)
admin.site.register(Articles)
admin.site.register(ArticleForum)
admin.site.register(TrainingPlan)
admin.site.register(Exercises)