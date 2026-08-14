from rest_framework import serializers
from app.models import Users, FollowRelation, SpecialBadges, UserDailyOfficialTasks, UsersReport, Activity, Reviews, ReviewReport, Articles, ArticleRating, ArticleForum, ArticleForumReport, TrainingPlan, Exercises, OfficialTasks, CustomTasks, Transactions, Subscription, Post, PostReport, PostMedia, SeenPost, VideoView, PostForum, PostForumReport, BioLinks, Chat, MessageReaction, ContactMessage

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = "__all__"