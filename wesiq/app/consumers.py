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
        message = json_data["message"] # Gets The Message

        await self.save_message(message) # Saves The Message

        await self.channel_layer.group_send(
            self.room_group_name,

            {
                "type": "chat_message",
                "message": message,
                "sender": self.sender.username
            }
        )

    # Function For Chat The Message
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "sender": event["sender"]
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

    # Function For Save The Message
    @database_sync_to_async
    def save_message(self, content):
        try:
            receiver = Users.objects.get(username=self.receiver_username) # Gets The Receiver

            # Creates The New Chat (Saves The New Message)
            Chat.objects.create(
                sender=self.sender,
                receiver=receiver,
                content=content
            )

        except Users.DoesNotExist:
            pass