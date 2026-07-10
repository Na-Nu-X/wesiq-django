import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Users, Chat, MessageReaction
from django.db import transaction

class ChatConsumer(AsyncWebsocketConsumer):
    # Function For Connect
    async def connect(self):
        self.receiver_username = self.scope["url_route"]["kwargs"]["username"] # Gets The Receiver's Username
        self.sender = await self.get_logged_in_user() # Gets The Sender (Logged In User)

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

            new_chat_id = await self.save_message(message) # Saves The Message

            # Sends Data Back To The Front-End
            await self.channel_layer.group_send(
                self.room_group_name,

                {
                    "type": "new", # Calls The Function "New"
                    "chat_id": new_chat_id, # Stores The Chat ID To The Event
                    "message": message, # Stores The Message To The Event
                    "sender_id": self.sender.id, # Stores The Sender's ID To The Event
                    "sender_username": self.sender.username, # Stores The Sender's Username To The Event
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

            await self.add_reaction_to_message(chat_id, emoji) # Adds The Reaction To Message

            # Sends Data Back To The Front-End
            await self.channel_layer.group_send(
                self.room_group_name,

                {
                    "type": "add_reaction", # Calls The Function "Add Reaction"
                    "chat_id": chat_id, # Stores The Chat ID To The Event
                    "emoji": emoji # Stores The Emoji To The Event
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
            await self.mark_messages_as_read() 

    # Function For Send Data Of The New Message To The Front-End
    async def new(self, event):
        await self.send(text_data=json.dumps({
            "action": "new",
            "chat_id": event["chat_id"],
            "message": event["message"],
            "sender_id": event["sender_id"],
            "sender_username": event["sender_username"],
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
            "emoji": event["emoji"]
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

        return new_chat.id # Returns The ID Of The New Chat

    # Function For Edit The Message
    @database_sync_to_async
    def edit_message(self, id, content):
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
        # Deletes The Message
        Chat.objects.filter(
            id=id,
            sender=self.sender
        ).delete()

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
            MessageReaction.objects.create(
                chat_id=chat_id,
                user=self.sender,
                emoji=emoji
            )

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