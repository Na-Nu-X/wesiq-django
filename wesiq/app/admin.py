from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Users, FollowRelation, SpecialBadges, UserDailyOfficialTasks, UsersReport, Activity, Reviews, ReviewReport, Articles, ArticleRating, ArticleForum, ArticleForumReport, TrainingPlan, Exercises, OfficialTasks, CustomTasks, Transactions, Subscription, Post, PostReport, PostMedia, SeenPost, VideoView, PostForum, PostForumReport, BioLinks, Chat, MessageReaction, ContactMessage

@admin.register(Users)
class UsersAdmin(ModelAdmin):
    list_display = [
        "id", 
        "first_name", 
        "last_name", 
        "username", 
        "email_address", 
        "phone_number",
        "role",
        "language",
        "last_edit",
        "creation_time",
        "friend_code",
        "bio",
        "xp",
        "total_activities",
        "activity_streak",
        "max_activity_streak",
        "last_activity_streak_increase_time",
        "private_account",
        "account_status",
        "suspension_time",
        "last_login",
        "reports",
        "data_saving_mode"
    ]

    list_filter = [
        "username", 
        "creation_time"
    ]

    search_fields = [
        "first_name", 
        "last_name",
        "username",
        "email_address",
        "friend_code"
    ]

    list_editable = [
        "role",
        "account_status"
    ]

@admin.register(FollowRelation)
class FollowRelationAdmin(ModelAdmin):
    list_display = [
        "id", 
        "from_user", 
        "to_user", 
        "status", 
        "created_at"
    ]

    list_filter = [
        "from_user", 
        "to_user",
        "status"
    ]

    search_fields = [
        "from_user", 
        "to_user"
    ]

    list_editable = []

@admin.register(SpecialBadges)
class SpecialBadgesAdmin(ModelAdmin):
    list_display = [
        "id", 
        "user", 
        "title", 
        "data", 
        "obtained_in"
    ]

    list_filter = [
        "user", 
        "obtained_in"
    ]

    search_fields = [
        "user", 
        "title"
    ]

    list_editable = [
        "title",
        "data"
    ]

@admin.register(UserDailyOfficialTasks)
class UserDailyOfficialTasksAdmin(ModelAdmin):
    list_display = [
        "id", 
        "task", 
        "user", 
        "progress_percentage", 
        "is_completed",
        "created_at"
    ]

    list_filter = [
        "task", 
        "progress_percentage",
        "is_completed",
        "created_at"
    ]

    search_fields = [
        "task"
    ]

    list_editable = []

@admin.register(UsersReport)
class UsersReportAdmin(ModelAdmin):
    list_display = [
        "id", 
        "reported_user", 
        "reporting_user", 
        "reason", 
        "created_at"
    ]

    list_filter = [
        "reported_user", 
        "reporting_user",
        "reason",
        "created_at"
    ]

    search_fields = [
        "reason"
    ]

    list_editable = []

@admin.register(Activity)
class ActivityAdmin(ModelAdmin):
    list_display = [
        "id", 
        "user", 
        "end_time", 
        "elapsed_time", 
        "gained_xp",
        "type",
        "training_plan_day",
        "training_plan_summary"
    ]

    list_filter = [
        "user",
        "end_time", 
        "elapsed_time",
        "gained_xp"
    ]

    search_fields = [
        "user"
    ]

    list_editable = []

@admin.register(Reviews)
class ReviewsAdmin(ModelAdmin):
    list_display = [
        "id", 
        "user", 
        "rating", 
        "review",
        "status",
        "rejection_time",
        "reports",
        "last_edit",
        "creation_time"
    ]

    list_filter = [
        "user",
        "rating", 
        "status",
        "creation_time"
    ]

    search_fields = [
        "review"
    ]

    list_editable = []

@admin.register(ReviewReport)
class ReviewReportAdmin(ModelAdmin):
    list_display = [
        "id", 
        "review", 
        "user", 
        "reason",
        "created_at"
    ]

    list_filter = [
        "reason",
        "created_at"
    ]

    search_fields = [
        "reason"
    ]

    list_editable = []

@admin.register(Articles)
class ArticlesAdmin(ModelAdmin):
    list_display = [
        "id", 
        "user", 
        "title", 
        "description",
        "image_name",
        "html_filename",
        "link",
        "categories",
        "visitors",
        "creation_time",
        "difficulty",
        "time_to_learn",
        "time_to_learn_text",
        "rarity",
        "strength",
        "technique"
    ]

    list_filter = [
        "categories",
        "visitors",
        "creation_time",
        "time_to_learn",
        "rarity",
        "strength",
        "technique"
    ]

    search_fields = [
        "title",
        "html_filename",
        "categories"
    ]

    list_editable = [
        "title",
        "description",
        "image_name",
        "html_filename",
        "link",
        "categories",
        "difficulty",
        "time_to_learn",
        "time_to_learn_text",
        "rarity",
        "strength",
        "technique"
    ]

@admin.register(ArticleRating)
class ArticleRatingAdmin(ModelAdmin):
    list_display = [
        "id", 
        "article", 
        "user", 
        "rating",
        "created_at"
    ]

    list_filter = [
        "article",
        "rating",
        "created_at"
    ]

    search_fields = [
        "article"
    ]

    list_editable = []

@admin.register(ArticleForum)
class ArticleForumAdmin(ModelAdmin):
    list_display = [
        "id", 
        "article", 
        "user", 
        "comment",
        "likes",
        "creation_time",
        "parent",
        "status",
        "reports",
        "level"
    ]

    list_filter = [
        "article",
        "user",
        "likes",
        "creation_time",
        "status",
        "reports"
    ]

    search_fields = [
        "article"
    ]

    list_editable = [
        "status"
    ]

@admin.register(ArticleForumReport)
class ArticleForumReportAdmin(ModelAdmin):
    list_display = [
        "id", 
        "articleforum", 
        "user", 
        "reason",
        "created_at"
    ]

    list_filter = [
        "articleforum", 
        "user", 
        "reason",
        "created_at"
    ]

    search_fields = [
        "reason"
    ]

    list_editable = []

@admin.register(TrainingPlan)
class TrainingPlanAdmin(ModelAdmin):
    list_display = [
        "id",
        "user", 
        "training_plan_key", 
        "day", 
        "type",
        "exercise",
        "periods",
        "unit",
        "order"
    ]

    list_filter = [
        "user", 
        "training_plan_key", 
        "day", 
        "exercise",
        "order"
    ]

    search_fields = [
        "exercise"
    ]

    list_editable = []

@admin.register(Exercises)
class ExercisesAdmin(ModelAdmin):
    list_display = [
        "id",
        "exercise", 
        "unit", 
        "categories", 
        "requires_weight",
        "image_filename"
    ]

    list_filter = [
        "exercise", 
        "unit", 
        "requires_weight"
    ]

    search_fields = [
        "exercise"
    ]

    list_editable = [
        "exercise", 
        "unit", 
        "categories", 
        "requires_weight",
        "image_filename"
    ]

@admin.register(OfficialTasks)
class OfficialTasksAdmin(ModelAdmin):
    list_display = [
        "id",
        "title", 
        "data", 
        "xp"
    ]

    list_filter = [
        "title", 
        "data",
        "xp"
    ]

    search_fields = [
        "title", 
        "data"
    ]

    list_editable = [
        "title", 
        "data", 
        "xp"
    ]

@admin.register(CustomTasks)
class CustomTasksAdmin(ModelAdmin):
    list_display = [
        "id",
        "user", 
        "title", 
        "is_completed",
        "order",
        "created_at"
    ]

    list_filter = [
        "title", 
        "is_completed",
        "created_at"
    ]

    search_fields = [
        "title"
    ]

    list_editable = []

@admin.register(Transactions)
class TransactionsAdmin(ModelAdmin):
    list_display = [
        "id",
        "user", 
        "stripe_intent_id", 
        "cardholder_name",
        "amount",
        "status",
        "created_at",
        "title"
    ]

    list_filter = [
        "user", 
        "amount",
        "status",
        "created_at",
        "title"
    ]

    search_fields = [
        "stripe_intent_id",
        "cardholder_name"
    ]

    list_editable = []

@admin.register(Subscription)
class SubscriptionAdmin(ModelAdmin):
    list_display = [
        "id",
        "user", 
        "stripe_subscription_id", 
        "plan",
        "is_active",
        "is_cancelled",
        "created_at",
        "updated_at"
    ]

    list_filter = [
        "user", 
        "plan",
        "is_active",
        "is_cancelled",
        "created_at",
        "updated_at"
    ]

    search_fields = [
        "stripe_subscription_id"
    ]

    list_editable = []

@admin.register(Post)
class PostAdmin(ModelAdmin):
    list_display = [
        "id",
        "user", 
        "description", 
        "added_hashtags",
        "location",
        "coordinates",
        "public_visibility",
        "allow_comments",
        "hide_likes",
        "likes",
        "latest_interaction",
        "created_at",
        "reports"
    ]

    list_filter = [
        "user", 
        "location",
        "public_visibility",
        "allow_comments",
        "hide_likes",
        "likes",
        "latest_interaction",
        "created_at",
        "reports"
    ]

    search_fields = [
        "description",
        "added_hashtags",
        "location"
    ]

    list_editable = []

@admin.register(PostReport)
class PostReportAdmin(ModelAdmin):
    list_display = [
        "id",
        "post", 
        "user", 
        "reason",
        "created_at"
    ]

    list_filter = [
        "reason",
        "created_at",
    ]

    search_fields = [
        "reason"
    ]

    list_editable = []

@admin.register(PostMedia)
class PostMediaAdmin(ModelAdmin):
    list_display = [
        "id",
        "post", 
        "file", 
        "thumbnail",
        "is_video",
        "is_muted",
        "total_watch_time",
        "is_processed",
        "original_filename",
        "original_size",
        "compressed_size",
        "order",
        "sprite_sheet",
        "vtt_file"
    ]

    list_filter = [
        "is_video",
        "is_muted",
        "total_watch_time",
        "is_processed",
        "original_size",
        "compressed_size"
    ]

    search_fields = [
        "post"
    ]

    list_editable = []

@admin.register(SeenPost)
class SeenPostAdmin(ModelAdmin):
    list_display = [
        "id",
        "user", 
        "post", 
        "viewed_at"
    ]

    list_filter = [
        "user", 
        "post", 
        "viewed_at"
    ]

    search_fields = [
        "post"
    ]

    list_editable = []

@admin.register(VideoView)
class VideoViewAdmin(ModelAdmin):
    list_display = [
        "id",
        "post_media", 
        "user", 
        "created_at"
    ]

    list_filter = [
        "user", 
        "created_at"
    ]

    search_fields = [
        "post_media"
    ]

    list_editable = []

@admin.register(PostForum)
class PostForumAdmin(ModelAdmin):
    list_display = [
        "id",
        "post", 
        "user", 
        "comment",
        "likes",
        "creation_time",
        "parent",
        "status",
        "reports",
        "level"
    ]

    list_filter = [
        "post", 
        "user", 
        "likes",
        "creation_time",
        "status",
        "reports"
    ]

    search_fields = [
        "comment"
    ]

    list_editable = [
        "status"
    ]

@admin.register(PostForumReport)
class PostForumReportAdmin(ModelAdmin):
    list_display = [
        "id",
        "postforum", 
        "user", 
        "reason",
        "created_at"
    ]

    list_filter = [
        "postforum", 
        "user", 
        "reason",
        "created_at"
    ]

    search_fields = [
        "reason"
    ]

    list_editable = []

@admin.register(BioLinks)
class BioLinksAdmin(ModelAdmin):
    list_display = [
        "id",
        "user", 
        "url"
    ]

    list_filter = [
        "user", 
        "url"
    ]

    search_fields = [
        "url"
    ]

    list_editable = []

@admin.register(Chat)
class ChatAdmin(ModelAdmin):
    list_display = [
        "id",
        "sender", 
        "receiver",
        "content",
        "created_at",
        "is_read",
        "is_edited"
    ]

    list_filter = [
        "sender", 
        "receiver",
        "created_at",
        "is_read",
        "is_edited"
    ]

    search_fields = [
        "content"
    ]

    list_editable = []

@admin.register(MessageReaction)
class MessageReactionAdmin(ModelAdmin):
    list_display = [
        "id",
        "chat", 
        "user",
        "emoji",
        "created_at"
    ]

    list_filter = [
        "chat", 
        "user",
        "created_at"
    ]

    search_fields = [
        "emoji"
    ]

    list_editable = []

@admin.register(ContactMessage)
class ContactMessageAdmin(ModelAdmin):
    list_display = [
        "id",
        "first_name", 
        "last_name", 
        "email_address",
        "subject",
        "message",
        "attachment",
        "creation_time"
    ]

    list_filter = [
        "email_address", 
        "subject",
        "creation_time"
    ]

    search_fields = [
        "first_name",
        "last_name",
        "email_address"
    ]

    list_editable = []