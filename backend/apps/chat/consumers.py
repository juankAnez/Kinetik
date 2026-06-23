import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Conversation, Message


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group = f"chat_{self.conversation_id}"

        if not await self._can_access():
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data.get("content", "").strip()
        if not content:
            return

        message = await self._save_message(content)

        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "chat_message",
                "message_id": message.id,
                "sender_id": self.scope["user"].id,
                "sender_name": self.scope["user"].get_full_name(),
                "content": content,
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def _save_message(self, content):
        return Message.objects.create(
            conversation_id=self.conversation_id,
            sender=self.scope["user"],
            content=content,
        )

    @database_sync_to_async
    def _can_access(self):
        user = self.scope["user"]
        if user.is_anonymous:
            return False
        return Conversation.objects.filter(
            id=self.conversation_id, participants=user
        ).exists()
