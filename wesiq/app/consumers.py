import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Users, Post, Chat, MessageReaction, ChatAttachment, VoiceMessage, MutedUser, Articles
from django.db import transaction
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs
from django.utils.translation import gettext as _
from django.db.models import Count, Q
from django.conf import settings
from django.http.request import validate_host
from urllib.parse import urlparse
from .security import visible_posts_q
from django.db.models import Avg

MAX_MESSAGE_LENGTH = 250 # Mirrors Chat.content max_length
MAX_EMOJI_LENGTH = 10 # Mirrors MessageReaction.emoji max_length
MAX_ATTACHMENTS_PER_MESSAGE = 10

# Function For Check The Origin Of A Cookie-Authenticated WebSocket (Cross-Site WebSocket Hijacking Protection)
def is_same_site_origin(scope):
    headers = dict(scope.get("headers", []))
    origin = headers.get(b"origin")

    if not origin:
        return False

    host = urlparse(origin.decode("latin1")).hostname or ""
    return validate_host(host, settings.ALLOWED_HOSTS)

# Function For Get The JWT Token From The Query String (Native App)
def get_query_token(scope):
    query_params = parse_qs(scope.get("query_string", b"").decode("utf-8"))
    token_list = query_params.get("token")
    return token_list[0] if token_list else None

# Function For Get An Active User From The JWT Access Token (Native App)
@database_sync_to_async
def get_user_from_token(token_key):
    try:
        validated_token = AccessToken(token_key) # Validates Signature And Expiration
        return Users.objects.get(id = validated_token["user_id"], account_status = "OK")

    except Exception:
        return None

def clean_text(value):
    if not isinstance(value, str):
        return None

    value = value.strip()

    if not value or len(value) > MAX_MESSAGE_LENGTH:
        return None

    return value

class ChatConsumer(AsyncWebsocketConsumer):

    # Function For Connect
    async def connect(self):
        self.receiver_username = self.scope["url_route"]["kwargs"]["username"] # Gets The Receiver's Username

        self.sender = None

        # Cookie (Session) Auth Is Only Accepted From Our Own Origin, Otherwise Any Website Could Open The Socket With The Victim's Cookies
        if is_same_site_origin(self.scope):
            self.sender = await self.get_logged_in_user() # Gets The Sender (Logged In User) From The Session (Only On Web)

        # Gets The Sender (Logged In User) From The JWT Token (Native App)
        if not self.sender:
            token = get_query_token(self.scope) # Gets The JWT Token (Native App)

            if token:
                self.sender = await get_user_from_token(token) # Gets The Sender (Logged In User) From The JWT Token (Native App)

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
    async def receive(self, text_data = None, bytes_data = None):
        # Malformed Input Must Not Crash The Consumer (An Unhandled Exception Closes The Socket)
        try:
            json_data = json.loads(text_data or "") # Gets The Received JSON Data

            if not isinstance(json_data, dict):
                return

            await self.handle_action(json_data)

        except (json.JSONDecodeError, KeyError, TypeError, ValueError):
            await self.send_error("invalid_payload")

        except (Post.DoesNotExist, Chat.DoesNotExist, PermissionError):
            await self.send_error("not_allowed")

    async def send_error(self, code):
        await self.send(text_data = json.dumps({"action": "error", "error": code}))

    async def handle_action(self, json_data):
        action = json_data.get("action", "new") # Gets The Action (New By Default)

        # New Message Action
        if action == "new":
            message = clean_text(json_data.get("message")) # Gets The Message (Non-Empty, Max 250 Characters)

            if message is None:
                return await self.send_error("invalid_message")

            new_chat = await self.save_message(message) # Saves The Message

            receiver_id = self.receiver.id # Gets The Receiver ID
            receiver_group_name = f"user_{receiver_id}_notifications" # Gets The Receiver Group Name

            is_muted = await self.is_user_muted(user = self.receiver, muted_user = self.sender) # Gets The Information If The User Is Muted

            if not is_muted:
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
                    "post": None, # No Shared Post (Plain Message)
                    "formatted_time": new_chat.formatted_time, # Stores The Chat Formatted Time To The Event
                    "sender_id": self.sender.id, # Stores The Sender's ID To The Event
                    "sender_profile_picture_name": self.sender.profile_picture_name # Stores The Sender's Profile Picture Name To The Event
                }
            )

        # Edit Message Action
        elif action == "edit":
            chat_id = int(json_data["chat_id"]) # Gets The Chat ID
            message = clean_text(json_data.get("message")) # Gets The Message

            if message is None:
                return await self.send_error("invalid_message")

            # Only Broadcasts When The Sender Really Edited Their Own Message (Otherwise Anyone Could Spoof An Edit Event)
            if not await self.edit_message(chat_id, message):
                return await self.send_error("not_allowed")

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
            chat_id = int(json_data["chat_id"]) # Gets The Chat ID

            if not await self.delete_message(chat_id):
                return await self.send_error("not_allowed")

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
            chat_id = int(json_data["chat_id"]) # Gets The Chat ID
            emoji = json_data.get("emoji") # Gets The Emoji

            if not isinstance(emoji, str) or not emoji.strip() or len(emoji) > MAX_EMOJI_LENGTH:
                return await self.send_error("invalid_emoji")

            new_reaction = await self.add_reaction_to_message(chat_id, emoji) # Adds The Reaction To Message

            if not new_reaction:
                return await self.send_error("not_allowed")

            # Sends Data Back To The Front-End
            await self.channel_layer.group_send(
                self.room_group_name,

                {
                    "type": "add_reaction", # Calls The Function "Add Reaction"
                    "chat_id": chat_id, # Stores The Chat ID To The Event
                    "emoji": emoji, # Stores The Emoji To The Event
                    "emoji_sender_username": self.sender.username # Stores The Emoji Sender's Username To The Event
                }
            )

        # Removes The Message Reaction Action
        elif action == "remove_reaction":
            chat_id = int(json_data["chat_id"]) # Gets The Chat ID
            emoji = json_data.get("emoji") # Gets The Emoji

            if not isinstance(emoji, str):
                return await self.send_error("invalid_emoji")

            if not await self.remove_reaction_from_message(chat_id, emoji): # Removes The Reaction From Message
                return

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
            attachment_ids = json_data.get("attachment_ids") # Gets The Attachment IDs

            if not isinstance(attachment_ids, list) or not attachment_ids or len(attachment_ids) > MAX_ATTACHMENTS_PER_MESSAGE:
                return await self.send_error("invalid_attachments")

            attachment_ids = [int(one_id) for one_id in attachment_ids]

            raw_message = json_data.get("message") # Gets The Message
            message = clean_text(raw_message) if raw_message else None

            if raw_message and message is None:
                return await self.send_error("invalid_message")

            new_chat = await self.save_attachments(message, attachment_ids)

            if not new_chat:
                return await self.send_error("not_allowed")

            receiver_id = self.receiver.id # Gets The Receiver ID
            receiver_group_name = f"user_{receiver_id}_notifications" # Gets The Receiver Group Name

            is_muted = await self.is_user_muted(user = self.receiver, muted_user = self.sender) # Gets The Information If The User Is Muted

            if not is_muted:
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
                    "type": "new", # Calls The Function "New"
                    "chat_id": new_chat.id, # Stores The Chat ID To The Event
                    "message": message, # Stores The Message To The Event
                    "attachments": attachments_data, # Stores The Attachments To The Event
                    "post": None, # No Shared Post (Plain Message)
                    "formatted_time": new_chat.formatted_time, # Stores The Chat Formatted Time To The Event
                    "sender_id": self.sender.id, # Stores The Sender's ID To The Event
                    "sender_profile_picture_name": self.sender.profile_picture_name # Stores The Sender's Profile Picture Name To The Event
                }
            )

        # Share Post Action
        elif action == "share_post":
            post_id = str(json_data["post_id"]) # Gets The Post ID (Public ID)

            new_chat = await self.share_post(post_id) # Shares The Post (Raises Post.DoesNotExist If The Sender Can't See It)

            receiver_id = self.receiver.id # Gets The Receiver ID
            receiver_group_name = f"user_{receiver_id}_notifications" # Gets The Receiver Group Name
            
            notification_message = str(_("Zdielaný príspevok od %(post_creator_username)s") % {"post_creator_username": new_chat["post"]["user"]["username"]})

            is_muted = await self.is_user_muted(user = self.receiver, muted_user = self.sender) # Gets The Information If The User Is Muted

            if not is_muted:
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

        # Send Voice Message
        elif action == "send_voice_message":
            voice_message_id = json_data.get("voice_message_id") # Gets The Voice Message ID

            if not voice_message_id:
                return await self.send_error("invalid_attachments")

            new_chat = await self.save_voice_message(voice_message_id)

            if not new_chat:
                return await self.send_error("not_allowed")

            receiver_id = self.receiver.id # Gets The Receiver ID
            receiver_group_name = f"user_{receiver_id}_notifications" # Gets The Receiver Group Name

            is_muted = await self.is_user_muted(user = self.receiver, muted_user = self.sender) # Gets The Information If The User Is Muted

            if not is_muted:
                # Sends Data To The Notification Channel
                await self.channel_layer.group_send(
                    receiver_group_name,
                    
                    {
                        "action": "new_message_notification",
                        "type": "new_message_notification", # Calls The Function "New Message Notification"
                        "chat_id": new_chat.id, # Stores The Chat ID To The Event
                        "message": str(_("Nová hlasová správa")), # Stores The Message To The Event
                        "sender_id": self.sender.id, # Stores The Sender's ID To The Event
                        "sender_username": self.sender.username, # Stores The Sender's Username To The Event
                        "sender_profile_picture_name": self.sender.profile_picture_name # Stores The Sender's Profile Picture Name To The Event
                    }
                )

            voice_message_data = await self.get_voice_message_data(new_chat) # Gets The Voice Message Data

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "new", # Calls The Function "New"
                    "chat_id": new_chat.id, # Stores The Chat ID To The Event
                    "message": "", # Stores The Message To The Event
                    "attachments": [],
                    "post": None, # No Shared Post (Plain Message)
                    "voice_message": voice_message_data, # Stores The Attachments To The Event
                    "formatted_time": new_chat.formatted_time, # Stores The Chat Formatted Time To The Event
                    "sender_id": self.sender.id, # Stores The Sender's ID To The Event
                    "sender_profile_picture_name": self.sender.profile_picture_name # Stores The Sender's Profile Picture Name To The Event
                }
            )

        # Share Article Action
        elif action == "share_article":
            article_id = str(json_data["article_id"]) # Gets The Article ID (Public ID)

            new_chat = await self.share_article(article_id) # Shares The Article (Raises Article.DoesNotExist If The Sender Can't See It)

            receiver_id = self.receiver.id # Gets The Receiver ID
            receiver_group_name = f"user_{receiver_id}_notifications" # Gets The Receiver Group Name
            
            notification_message = str(_("Zdielaný článok: %(article_title)s") % {"article_title": new_chat["article"]["title"]})

            is_muted = await self.is_user_muted(user = self.receiver, muted_user = self.sender) # Gets The Information If The User Is Muted

            if not is_muted:
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
                    "article": new_chat["article"], # Stores The Article To The Event
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

    @database_sync_to_async
    def get_voice_message_data(self, chat):
        voice_message = chat.voice_message.first() # Gets The Voice Message

        if not voice_message or not voice_message.file:
            return None

        return {
            "id": voice_message.id,
            "file": voice_message.file.name if voice_message.file else None,
            "duration": voice_message.duration,
            "waveform": voice_message.waveform or []
        }

    # Function For Send Data Of The New Message To The Front-End
    async def new(self, event):
        await self.send(text_data = json.dumps({
            "action": "new",
            "chat_id": event["chat_id"],
            "message": event["message"],
            "attachments": event.get("attachments", []),
            "post": event.get("post", None),
            "voice_message": event.get("voice_message", None),
            "article": event.get("article", None),
            "formatted_time": event["formatted_time"],
            "sender_id": event["sender_id"],
            "sender_profile_picture_name": event["sender_profile_picture_name"]
        }))

    # Function For Send Data Of The Edited Message To The Front-End
    async def edit(self, event):
        await self.send(text_data = json.dumps({
            "action": "edit",
            "chat_id": event["chat_id"],
            "message": event["message"]
        }))

    # Function For Send Data Of The Deleted Message To The Front-End
    async def delete(self, event):
        await self.send(text_data = json.dumps({
            "action": "delete",
            "chat_id": event["chat_id"]
        }))

    # Function For Send Data Of The Added Message Reaction To The Front-End
    async def add_reaction(self, event):
        await self.send(text_data = json.dumps({
            "action": "add_reaction",
            "chat_id": event["chat_id"],
            "emoji": event["emoji"],
            "emoji_sender_username": event["emoji_sender_username"]
        }))

    # Function For Send Data Of The Removed Message Reaction To The Front-End
    async def remove_reaction(self, event):
        await self.send(text_data = json.dumps({
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
                return Users.objects.get(id = logged_in_user_id, account_status = "OK") # Gets The Logged In User

        except Exception:
            return None

        return None

    # Function For Get The User By Username
    @database_sync_to_async
    def get_user_by_username(self, username):
        try:
            return Users.objects.get(username = username) # Gets The User

        except Users.DoesNotExist:
            try:
                return Users.objects.get(username = f"@{username.lstrip('@')}") # Gets The User (Fallback)

            except Users.DoesNotExist:
                return None

    # Function For Save The New Message
    @database_sync_to_async
    def save_message(self, content):
        # Saves The New Message
        new_chat = Chat.objects.create(
            sender = self.sender,
            receiver = self.receiver,
            content = content
        )

        return new_chat # Returns The New Chat

    # Function For Edit The Message
    @database_sync_to_async
    def edit_message(self, id, content):
        message_for_edit = self.conversation_messages().filter(id = id, sender = self.sender, post__isnull = True).first() # Gets The Message For Edit (Own Text Message In This Conversation)

        if not message_for_edit or message_for_edit.is_older_than_15_minutes:
            return False

        # Edits The Message
        Chat.objects.filter(
            id = id,
            sender = self.sender
        ).update(
            content = content,
            is_edited = True
        )

        return True

    # Function For Delete The Message
    @database_sync_to_async
    def delete_message(self, id):
        message_for_deletion = self.conversation_messages().filter(id = id, sender = self.sender).first() # Gets The Message For Deletion

        if not message_for_deletion or message_for_deletion.is_older_than_1_day:
            return False

        message_for_deletion.delete() # Deletes The Message
        return True

    # Function For Get The Messages Of This Conversation Only (Both Directions)
    def conversation_messages(self):
        return Chat.objects.filter(
            Q(sender = self.sender, receiver = self.receiver) |
            Q(sender = self.receiver, receiver = self.sender)
        )

    # Function For Add The Reaction To Message
    @database_sync_to_async
    def add_reaction_to_message(self, chat_id, emoji):
        # Reactions Are Only Allowed On Messages Of This Conversation
        if not self.conversation_messages().filter(id = chat_id).exists():
            return None

        with transaction.atomic():
            # Gets All Of The Logged In User's Reactions To The Message
            user_reactions = MessageReaction.objects.filter(
                chat_id = chat_id,
                user = self.sender
            ).order_by(
                "created_at"
            )

            # If The User Has Already Added Maximum Of 3 Reactions
            if user_reactions.count() >= 3:
                user_reactions.first().delete() # Deletes The Oldest Reaction

            # Creates The New Reaction
            new_reaction = MessageReaction.objects.create(
                chat_id = chat_id,
                user = self.sender,
                emoji = emoji
            )

            return new_reaction # Returns The New Reaction

    # Function For Remove The Reaction From Message
    @database_sync_to_async
    def remove_reaction_from_message(self, chat_id, emoji):
        if not self.conversation_messages().filter(id = chat_id).exists():
            return False

        # Removes The Reaction
        deleted, _deleted_per_model = MessageReaction.objects.filter(
            chat_id = chat_id,
            user = self.sender,
            emoji = emoji
        ).delete()

        return deleted > 0

    # Function For Mark Messages As Read
    @database_sync_to_async
    def mark_messages_as_read(self):
        # Marks Every Unread Message As Read
        Chat.objects.filter(
            sender = self.receiver,
            receiver = self.sender,
            is_read = False
        ).update(is_read = True)

    # Function For Save The Attachments
    @database_sync_to_async
    def save_attachments(self, content, attachment_ids):
        with transaction.atomic():
            # Only The Sender's Own, Not Yet Sent Attachments (Previously Any Attachment ID Could Be Pulled Into Any Chat)
            chat_attachments = ChatAttachment.objects.select_for_update().filter(
                id__in = attachment_ids,
                sent_by = self.sender,
                chat__isnull = True
            )

            if chat_attachments.count() != len(set(attachment_ids)):
                return None

            # Saves The New Message
            new_chat_with_attachments = Chat.objects.create(
                sender = self.sender,
                receiver = self.receiver,
                content = content
            )

            chat_attachments.update(chat = new_chat_with_attachments) # Saves The Updated Chat Attachments
            
        return new_chat_with_attachments # Returns The New Chat With Attachments

    # Function For Save The New Message With The Shared Post
    @database_sync_to_async
    def share_post(self, post_id):
        # The Sender Can Only Share Posts They Are Allowed To See (Followers-Only / Private Accounts)
        post = Post.objects.filter(visible_posts_q(self.sender.id)).distinct().get(public_id = post_id) # Gets The Post
    
        # Saves The New Message
        new_chat = Chat.objects.create(
            sender = self.sender,
            receiver = self.receiver,
            post = post
        )

        # Gets The New Chat With Shared Post
        new_chat_with_shared_post = Chat.objects.select_related(
            "post",
            "post__user",
            "post__user__subscription"
        ).prefetch_related(
            "post__media"
        ).annotate(
            post_comments_amount = Count("post__comments", filter=~Q(post__comments__status = "hidden"), distinct = True),
            post_likes_amount = Count("post__likes", distinct = True)
        ).get(id = new_chat.id)

        post_media_list = list(new_chat_with_shared_post.post.media.all()) if new_chat_with_shared_post.post else [] # Gets The Post Media List
        first_post_media = post_media_list[0] if post_media_list else None # Gets The First Post Media

        # Creates Valid Format Of New Chat With Shared Post For JSON Response
        new_chat_with_shared_post_data = {
            "id": new_chat_with_shared_post.id,
            "formatted_time": new_chat_with_shared_post.formatted_time,

            "post": {
                "id": new_chat_with_shared_post.post.public_id, # Public ID (Same As The REST API), Never The Internal Database ID
                
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

    # Function For Save The Voice Message
    @database_sync_to_async
    def save_voice_message(self, voice_message_id):
        # Gets The Voice Message
        voice_message = VoiceMessage.objects.filter(
            id = voice_message_id,
            sent_by = self.sender,
            chat__isnull = True
        ).first()

        if not voice_message:
            return None

        # Saves The New Message
        new_chat_voice_message = Chat.objects.create(
            sender = self.sender,
            receiver = self.receiver
        )

        voice_message.chat = new_chat_voice_message
        voice_message.save(update_fields = ["chat"]) # Saves The Updated Voice Message
            
        return new_chat_voice_message # Returns The New Chat With Voice Message

    # Function For Save The New Message With The Shared Article
    @database_sync_to_async
    def share_article(self, article_id):
        article = Articles.objects.get(id = article_id) # Gets The Article
    
        # Saves The New Message
        new_chat = Chat.objects.create(
            sender = self.sender,
            receiver = self.receiver,
            article = article
        )

        # Gets The New Chat With Shared Article
        new_chat_with_shared_article = Chat.objects.filter(
            id = new_chat.id
        ).select_related(
            "article"
        ).annotate(
            average_rating = Avg("article__articlerating__rating"),
        ).first()
        
        shared_article = new_chat_with_shared_article.article

        # Creates Valid Format Of New Chat With Shared Article For JSON Response
        new_chat_with_shared_article_data = {
            "id": new_chat_with_shared_article.id,
            "formatted_time": new_chat_with_shared_article.formatted_time,
            
            "article": {
                "id": shared_article.id, 
                "title": shared_article.title, 
                "description": shared_article.description,
                "image_name": shared_article.image_name, 
                "html_filename": shared_article.html_filename,
                "link": shared_article.link,
                "categories": shared_article.categories,
                "visitors": shared_article.visitors,
                "creation_time": shared_article.creation_time.isoformat() if shared_article.creation_time else None,
                "average_rating": new_chat_with_shared_article.average_rating
            }
        }

        return new_chat_with_shared_article_data # Returns The New Chat With Shared Article Data

    # Function For Get The Information If The User Is Muted
    @database_sync_to_async
    def is_user_muted(self, user, muted_user):
        return MutedUser.objects.filter(user = user, muted_user = muted_user).exists() # Checks If The Muted User Exists

class NotificationConsumer(AsyncWebsocketConsumer):
    # Function For Connect
    async def connect(self):
        self.user = None

        # Cookie (Session) Auth Is Only Accepted From Our Own Origin (Cross-Site WebSocket Hijacking Protection)
        if is_same_site_origin(self.scope):
            self.user = self.scope.get("user") # Gets The User

        # Gets The User (Logged In User) From The JWT Token (Native App)
        if not self.user or not self.user.is_authenticated:
            token = get_query_token(self.scope) # Gets The JWT Token (Native App)

            if token:
                self.user = await get_user_from_token(token) # Gets The User (Logged In User) From The JWT Token (Native App)

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
        await self.send(text_data = json.dumps({
            "action": "new_message_notification",
            "chat_id": event["chat_id"],
            "message": event["message"],
            "sender_id": event["sender_id"],
            "sender_username": event["sender_username"],
            "sender_profile_picture_name": event["sender_profile_picture_name"]
        }))
