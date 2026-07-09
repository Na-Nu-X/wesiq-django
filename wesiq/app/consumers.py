import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Users, Chat

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

    # Function For Receive The Message
    async def receive(self, text_data):
        json_data = json.loads(text_data) # Gets The JSON Data

        action = json_data.get("action", "new") # Gets The Action

        # New Message Action
        if action == "new":
            message = json_data["message"] # Gets The Message

            await self.save_message(message) # Saves The Message

            # Sends Data Back To The Front-End
            await self.channel_layer.group_send(
                self.room_group_name,

                {
                    "type": "new",
                    "message": message,
                    "sender_username": self.sender.username,
                    "sender_id": self.sender.id,
                    "sender_profile_picture_name": self.sender.profile_picture_name
                }
            )

        # Edit Message Action
        if action == "edit":
            chat_id = json_data["chat_id"] # Gets The Chat ID
            message = json_data["message"] # Gets The Message

            await self.edit_message(chat_id, message) # Edits The Message

            # Sends Data Back To The Front-End
            await self.channel_layer.group_send(
                self.room_group_name,

                {
                    "type": "edit",
                    "chat_id": chat_id,
                    "message": message
                }
            )

        # Mark As Read Action
        elif action == "mark_as_read":
            await self.mark_messages_as_read() 

        elif action == "delete":
            chat_id = json_data["chat_id"] # Gets The Chat ID

            await self.delete_message(chat_id) # Deletes The Message

    # Function For Send Data Of The New Message To The Front-End
    async def new(self, event):
        await self.send(text_data=json.dumps({
            "action": "new",
            "message": event["message"],
            "sender_username": event["sender_username"],
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
        Chat.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            content=content
        )

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

    # Function For Mark Messages As Read
    @database_sync_to_async
    def mark_messages_as_read(self):
        # Marks Every Message As Read
        Chat.objects.filter(
            sender=self.receiver,
            receiver=self.sender,
            is_read=False
        ).update(is_read=True)

    # Function For Delete The Message
    @database_sync_to_async
    def delete_message(self, id):
        # Deletes The Message
        Chat.objects.filter(
            id=id,
            sender=self.sender
        ).delete()