import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Users, Chat, MessageReaction, ChatAttachment
from django.db import transaction
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs
from django.utils.translation import gettext as _
from django.db.models import Count, Q

class ChatConsumer(AsyncWebsocketConsumer):
    # Function For Get The User From The JWT Token (Native App)
    @database_sync_to_async
    def get_user_from_token(self, token_key):
        try:
            validated_token = AccessToken(token_key)
            user_id = validated_token["user_id"]
            return Users.objects.get(id=user_id)

        except Exception:
            return None

    # Function For Connect
    async def connect(self):
        self.receiver_username = self.scope["url_route"]["kwargs"]["username"] # Gets The Receiver's Username

        self.sender = await self.get_logged_in_user() # Gets The Sender (Logged In User) From The Session (Only On Web)

        # Gets The Sender (Logged In User) From The JWT Token (Native App)
        if not self.sender:
            # Gets The JWT Token (Native App)
            query_string = self.scope.get("query_string", b"").decode("utf-8")
            query_params = parse_qs(query_string)
            token_list = query_params.get("token")

            if token_list:
                self.sender = await self.get_user_from_token(token_list[0]) # Gets The Sender (Logged In User) From The JWT Token (Native App)

        # Closes The Connection
        if not self.sender:
            await self.close()
            return

        self.receiver = await self.get_user_by_username(self.receiver_username) # Gets The Receiver

        # Closes The Connection
        if not self.receiver:
            await self.close()
            return

        sorted_ids = sorted([self.sender.id, self.receiver.id]) # Sorts IDs Of Users

        self.room_group_name = f"chat_{sorted_ids[0]}_{sorted_ids[1]}" # Creates The Room Group Name

        # Adds The Group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    # Function For Disconnect
    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    # Function For Receive The Events
    async def receive(self, text_data):
        json_data = json.loads(text_data) # Gets The Received JSON Data

        action = json_data.get("action", "new") # Gets The Action (New By Default)

        # New Message Action
        if action == "new":
            message = json_data["message"] # Gets The Message

            new_chat = await self.save_message(message) # Saves The Message

            receiver_id = self.receiver.id # Gets The Receiver ID
            receiver_group_name = f"user_{receiver_id}_notifications" # Gets The Receiver Group Name

            # Sends Data To The Notification Channel
            await self.channel_layer.group_send(
                receiver_group_name,

                {
                    "action": "new_message_notification",
                    "type": "new_message_notification", # Calls The Function "New Message Notification"
                    "chat_id": new_chat.id, # Stores The Chat ID To The Event
                    "message": message, # Stores The Message To The Event
                    "sender_id": self.sender.id, # Stores The Sender's ID To The Event
                    "sender_username": self.sender.username, # Stores The Sender's Username To The Event
                    "sender_profile_picture_name": self.sender.profile_picture_name # Stores The Sender's Profile Picture Name To The Event
                }
            )

            # Sends Data Back To The Front-End
            await self.channel_layer.group_send(
                self.room_group_name,

                {
                    "type": "new", # Calls The Function "New"
                    "chat_id": new_chat.id, # Stores The Chat ID To The Event
                    "message": message, # Stores The Message To The Event
                    "attachments": [],
                    "formatted_time": new_chat.formatted_time, # Stores The Chat Formatted Time To The Event
                    "sender_id": self.sender.id, # Stores The Sender's ID To The Event
                    "sender_profile_picture_name": self.sender.profile_picture_name # Stores The Sender's Profile Picture Name To The Event
                }
            )

        # Edit Message Action
        elif action == "edit":
            chat_id = json_data["chat_id"] # Gets The Chat ID
            message = json_data["message"] # Gets The Message

            await self.edit_message(chat_id, message) # Edits The Message

            # Sends Data Back To The Front-End
            await self.channel_layer.group_send(
                self.room_group_name,

                {
                    "type": "edit", # Calls The Function "Edit"
                    "chat_id": chat_id, # Stores The Chat ID To The Event
                    "message": message # Stores The Message To The Event
                }
            )

        # Delete Message Action
        elif action == "delete":
            chat_id = json_data["chat_id"] # Gets The Chat ID

            await self.delete_message(chat_id) # Deletes The Message

            # Sends Data Back To The Front-End
            await self.channel_layer.group_send(
                self.room_group_name,

                {
                    "type": "delete", # Calls The Function "Delete"
                    "chat_id": chat_id # Stores The Chat ID To The Event
                }
            )

        # Adds The Message Reaction Action
        elif action == "add_reaction":
            chat_id = json_data["chat_id"] # Gets The Chat ID
            emoji = json_data["emoji"] # Gets The Emoji

            new_reaction = await self.add_reaction_to_message(chat_id, emoji) # Adds The Reaction To Message

            # Sends Data Back To The Front-End
            await self.channel_layer.group_send(
                self.room_group_name,

                {
                    "type": "add_reaction", # Calls The Function "Add Reaction"
                    "chat_id": chat_id, # Stores The Chat ID To The Event
                    "emoji": emoji, # Stores The Emoji To The Event
                    "emoji_sender_username": new_reaction.user.username # Stores The Emoji Sender's Username To The Event
                }
            )

        # Removes The Message Reaction Action
        elif action == "remove_reaction":
            chat_id = json_data["chat_id"] # Gets The Chat ID
            emoji = json_data["emoji"] # Gets The Emoji

            await self.remove_reaction_from_message(chat_id, emoji) # Removes The Reaction From Message

            # Sends Data Back To The Front-End
            await self.channel_layer.group_send(
                self.room_group_name,

                {
                    "type": "remove_reaction", # Calls The Function "Remove Reaction"
                    "chat_id": chat_id, # Stores The Chat ID To The Event
                    "emoji": emoji # Stores The Emoji To The Event
                }
            )

        # Mark As Read Message Action
        elif action == "mark_as_read":
            await self.mark_messages_as_read() # Mark Messages As Read
            
        # Send Attachment Action
        elif action == "send_attachment":
            attachment_ids = json_data["attachment_ids"] # Gets The Attachment IDs
            message = json_data["message"] or None # Gets The Message

            new_chat = await self.save_attachments(message, attachment_ids)

            receiver_id = self.receiver.id # Gets The Receiver ID
            receiver_group_name = f"user_{receiver_id}_notifications" # Gets The Receiver Group Name

            # Sends Data To The Notification Channel
            await self.channel_layer.group_send(
                receiver_group_name,
                
                {
                    "action": "new_message_notification",
                    "type": "new_message_notification", # Calls The Function "New Message Notification"
                    "chat_id": new_chat.id, # Stores The Chat ID To The Event
                    "message": message or str(_("Nové prílohy")), # Stores The Message To The Event
                    "sender_id": self.sender.id, # Stores The Sender's ID To The Event
                    "sender_username": self.sender.username, # Stores The Sender's Username To The Event
                    "sender_profile_picture_name": self.sender.profile_picture_name # Stores The Sender's Profile Picture Name To The Event
                }
            )

            attachments_data = await self.get_attachments_data(new_chat) # Gets The Attachments Data

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "new",
                    "chat_id": new_chat.id,
                    "message": message,
                    "attachments": attachments_data,
                    "formatted_time": new_chat.formatted_time,
                    "sender_id": self.sender.id,
                    "sender_profile_picture_name": self.sender.profile_picture_name
                }
            )

        # Share Post Action
        if action == "share_post":
            post_id = json_data["post_id"] # Gets The Post ID

            new_chat = await self.share_post(post_id) # Shares The Post

            receiver_id = self.receiver.id # Gets The Receiver ID
            receiver_group_name = f"user_{receiver_id}_notifications" # Gets The Receiver Group Name
            
            notification_message = str(_("Zdielaný príspevok od %(post_creator_username)s") % {"post_creator_username": new_chat["post"]["user"]["username"]})

            # Sends Data To The Notification Channel
            await self.channel_layer.group_send(
                receiver_group_name,

                {
                    "action": "new_message_notification",
                    "type": "new_message_notification", # Calls The Function "New Message Notification"
                    "chat_id": new_chat["id"], # Stores The Chat ID To The Event
                    "message": notification_message, # Stores The Message To The Event
                    "sender_id": self.sender.id, # Stores The Sender's ID To The Event
                    "sender_username": self.sender.username, # Stores The Sender's Username To The Event
                    "sender_profile_picture_name": self.sender.profile_picture_name # Stores The Sender's Profile Picture Name To The Event
                }
            )

            # Sends Data Back To The Front-End
            await self.channel_layer.group_send(
                self.room_group_name,

                {
                    "type": "new", # Calls The Function "New"
                    "chat_id": new_chat["id"], # Stores The Chat ID To The Event
                    "message": None, # Stores The Message To The Event
                    "attachments": [],
                    "post": new_chat["post"], # Stores The Post To The Event
                    "formatted_time": new_chat["formatted_time"], # Stores The Chat Formatted Time To The Event
                    "sender_id": self.sender.id, # Stores The Sender's ID To The Event
                    "sender_profile_picture_name": self.sender.profile_picture_name # Stores The Sender's Profile Picture Name To The Event
                }
            )

    @database_sync_to_async
    def get_attachments_data(self, chat):
        return [
            {
                "attachment_url": one_attachment.file.url,
                "attachment_thumbnail": one_attachment.thumbnail.url if one_attachment.thumbnail else None,
                "attachment_type": one_attachment.type,
                "original_filename": one_attachment.original_filename,
                "original_size": one_attachment.original_size,
                "compressed_size": one_attachment.compressed_size
            }

            for one_attachment in chat.attachments.all()
        ]

    # Function For Send Data Of The New Message To The Front-End
    async def new(self, event):
        await self.send(text_data=json.dumps({
            "action": "new",
            "chat_id": event["chat_id"],
            "message": event["message"],
            "attachments": event["attachments"],
            "post": event["post"],
            "formatted_time": event["formatted_time"],
            "sender_id": event["sender_id"],
            "sender_profile_picture_name": event["sender_profile_picture_name"]
        }))

    # Function For Send Data Of The Edited Message To The Front-End
    async def edit(self, event):
        await self.send(text_data=json.dumps({
            "action": "edit",
            "chat_id": event["chat_id"],
            "message": event["message"]
        }))

    # Function For Send Data Of The Deleted Message To The Front-End
    async def delete(self, event):
        await self.send(text_data=json.dumps({
            "action": "delete",
            "chat_id": event["chat_id"]
        }))

    # Function For Send Data Of The Added Message Reaction To The Front-End
    async def add_reaction(self, event):
        await self.send(text_data=json.dumps({
            "action": "add_reaction",
            "chat_id": event["chat_id"],
            "emoji": event["emoji"],
            "emoji_sender_username": event["emoji_sender_username"]
        }))

    # Function For Send Data Of The Removed Message Reaction To The Front-End
    async def remove_reaction(self, event):
        await self.send(text_data=json.dumps({
            "action": "remove_reaction",
            "chat_id": event["chat_id"],
            "emoji": event["emoji"]
        }))

    # Function For Get The Logged In User
    @database_sync_to_async
    def get_logged_in_user(self):
        try:
            session = self.scope.get("session", {}) # Gets The Session
            logged_in_user_id = session.get("logged_in_user_id") # Gets The Logged In User ID

            if logged_in_user_id:
                return Users.objects.get(id=logged_in_user_id) # Gets The Logged In User

        except:
            return None

        return None

    # Function For Get The User By Username
    @database_sync_to_async
    def get_user_by_username(self, username):
        try:
            return Users.objects.get(username=username) # Gets The User

        except Users.DoesNotExist:
            try:
                return Users.objects.get(username=f"@{username.lstrip('@')}") # Gets The User (Fallback)

            except Users.DoesNotExist:
                return None

    # Function For Save The New Message
    @database_sync_to_async
    def save_message(self, content):
        # Saves The New Message
        new_chat = Chat.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            content=content
        )

        return new_chat # Returns The New Chat

    # Function For Edit The Message
    @database_sync_to_async
    def edit_message(self, id, content):
        message_for_edit = Chat.objects.filter(id=id, sender=self.sender).first() # Gets The Message For Edit

        if not message_for_edit.is_older_than_15_minutes:
            # Edits The Message
            Chat.objects.filter(
                id=id,
                sender=self.sender
            ).update(
                content=content,
                is_edited=True
            )

    # Function For Delete The Message
    @database_sync_to_async
    def delete_message(self, id):
        message_for_deletion = Chat.objects.filter(id=id, sender=self.sender).first() # Gets The Message For Deletion

        if not message_for_deletion.is_older_than_1_day:
            message_for_deletion.delete() # Deletes The Message

    # Function For Add The Reaction To Message
    @database_sync_to_async
    def add_reaction_to_message(self, chat_id, emoji):
        with transaction.atomic():
            # Gets All Of The Logged In User's Reactions To The Message
            user_reactions = MessageReaction.objects.filter(
                chat_id=chat_id,
                user=self.sender
            ).order_by(
                "created_at"
            )

            # If The User Has Already Added Maximum Of 3 Reactions
            if user_reactions.count() >= 3:
                user_reactions.first().delete() # Deletes The Oldest Reaction

            # Creates The New Reaction
            new_reaction = MessageReaction.objects.create(
                chat_id=chat_id,
                user=self.sender,
                emoji=emoji
            )

            return new_reaction # Returns The New Reaction

    # Function For Remove The Reaction From Message
    @database_sync_to_async
    def remove_reaction_from_message(self, chat_id, emoji):
        # Removes The Reaction
        MessageReaction.objects.filter(
            chat_id=chat_id,
            user=self.sender,
            emoji=emoji
        ).delete()

    # Function For Mark Messages As Read
    @database_sync_to_async
    def mark_messages_as_read(self):
        # Marks Every Unread Message As Read
        Chat.objects.filter(
            sender=self.receiver,
            receiver=self.sender,
            is_read=False
        ).update(is_read=True)

    # Function For Save The Attachments
    @database_sync_to_async
    def save_attachments(self, content, attachment_ids):
        # Saves The New Message
        new_chat = Chat.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            content=content
        )

        if attachment_ids:
            chat_attachments = ChatAttachment.objects.filter(id__in=attachment_ids) # Gets The Chat Attachments
            chat_attachments.update(chat=new_chat) # Saves The Updated Chat Attachments

    # Function For Save The New Message With The Shared Post
    @database_sync_to_async
    def share_post(self, post_id):
        # Saves The New Message
        new_chat = Chat.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            post_id=post_id
        )

        # Gets The New Chat With Shared Post
        new_chat_with_shared_post = Chat.objects.select_related(
            "post",
            "post__user",
            "post__user__subscription"
        ).prefetch_related(
            "post__media"
        ).annotate(
            post_comments_amount=Count("post__comments", filter=~Q(post__comments__status="hidden"), distinct=True),
            post_likes_amount=Count("post__likes", distinct=True)
        ).get(id=new_chat.id)

        post_media_list = list(new_chat_with_shared_post.post.media.all()) if new_chat_with_shared_post.post else [] # Gets The Post Media List
        first_post_media = post_media_list[0] if post_media_list else None # Gets The First Post Media

        # Creates Valid Format Of New Chat With Shared Post For JSON Response
        new_chat_with_shared_post_data = {
            "id": new_chat_with_shared_post.id,
            "formatted_time": new_chat_with_shared_post.formatted_time,

            "post": {
                "id": new_chat_with_shared_post.post.id,
                
                "user": {
                    "id": new_chat_with_shared_post.post.user.id,
                    "username": new_chat_with_shared_post.post.user.username,
                    "profile_picture_name": new_chat_with_shared_post.post.user.profile_picture_name,

                    "subscription": {
                        "is_active": new_chat_with_shared_post.post.user.subscription.is_active
                    } if hasattr(new_chat_with_shared_post.post.user, "subscription") and new_chat_with_shared_post.post.user.subscription else None,
                },

                "description": new_chat_with_shared_post.post.description if new_chat_with_shared_post.post.description else None,
                "public_visibility": new_chat_with_shared_post.post.public_visibility,
                "allow_comments": new_chat_with_shared_post.post.allow_comments,
                "hide_likes": new_chat_with_shared_post.post.hide_likes,
                "likes": getattr(new_chat_with_shared_post, "post_likes_amount", 0),
                "comments": getattr(new_chat_with_shared_post, "post_comments_amount", 0),
                "created_at": new_chat_with_shared_post.post.created_at.isoformat(),

                "media": {
                    "id": first_post_media.id,
                    "file": first_post_media.file.name if first_post_media.file else None,
                    "thumbnail": first_post_media.thumbnail.name if first_post_media.thumbnail else None,
                    "is_video": first_post_media.is_video
                } if first_post_media else None           
            } if new_chat_with_shared_post.post else None
        }

        return new_chat_with_shared_post_data # Returns The New Chat With Shared Post Data

class NotificationConsumer(AsyncWebsocketConsumer):
    # Function For Get The User From The JWT Token (Native App)
    @database_sync_to_async
    def get_user_from_token(self, token_key):
        try:
            validated_token = AccessToken(token_key)
            user_id = validated_token["user_id"]
            return Users.objects.get(id=user_id)

        except Exception:
            return None

    # Function For Connect
    async def connect(self):
        self.user = self.scope.get("user") # Gets The User

        # Gets The User (Logged In User) From The JWT Token (Native App)
        if not self.user or not self.user.is_authenticated:
            # Gets The JWT Token (Native App)
            query_string = self.scope.get("query_string", b"").decode("utf-8")
            query_params = parse_qs(query_string)
            token_list = query_params.get("token")

            if token_list:
                self.user = await self.get_user_from_token(token_list[0]) # Gets The User (Logged In User) From The JWT Token (Native App)

        # Closes The Connection
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        self.user_group_name = f"user_{self.user.id}_notifications" # Creates The User Group Name


        # Adds The Group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        await self.accept()

    # Function For Disconnect
    async def disconnect(self, close_code):
        if hasattr(self, "user_group_name"):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

    # Function For Send Data Of The New Message Notification To The Front-End
    async def new_message_notification(self, event):
        await self.send(text_data=json.dumps({
            "action": "new_message_notification",
            "chat_id": event["chat_id"],
            "message": event["message"],
            "sender_id": event["sender_id"],
            "sender_username": event["sender_username"],
            "sender_profile_picture_name": event["sender_profile_picture_name"]
        }))
