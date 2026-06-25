import json
import pytest
from asgiref.sync import sync_to_async
from django.urls import reverse
from django.utils import timezone
from django.contrib.gis.geos import Point
from channels.testing import WebsocketCommunicator
from core.asgi import application
from apps.orders.models import Order, OrderItem
from apps.chat.models import Conversation, Message


@pytest.fixture
def order(cliente_user, store, municipio, product):
    order = Order.objects.create(
        client=cliente_user,
        store=store,
        municipio=municipio,
        status="PENDING",
        payment_method="CARD",
        delivery_address="Test Address",
        delivery_location=Point(-75.5658, 6.2476, srid=4326),
        subtotal=10000,
        delivery_fee=1500,
        total=11500,
    )
    OrderItem.objects.create(order=order, product_name="Test", product_price=5000, quantity=2, subtotal=10000)
    return order


@pytest.fixture
def conversation(order, cliente_user, comercio_user):
    conv = Conversation.objects.create(order=order)
    conv.participants.add(cliente_user, comercio_user)
    return conv


@pytest.fixture
def conversation_with_messages(conversation, cliente_user, comercio_user):
    Message.objects.create(conversation=conversation, sender=cliente_user, content="Hola")
    Message.objects.create(conversation=conversation, sender=comercio_user, content="Buenos días")
    return conversation


class TestConversationList:
    def test_list_conversations(self, cliente_client, conversation):
        url = reverse("conversation-list")
        response = cliente_client.get(url)
        assert response.status_code == 200
        assert len(response.data["results"]) == 1

    def test_other_users_conversation_not_shown(self, cliente_client, cliente_user, order, domiciliario_user):
        other_conv = Conversation.objects.create(order=order)
        other_conv.participants.add(domiciliario_user)
        url = reverse("conversation-list")
        response = cliente_client.get(url)
        assert response.status_code == 200
        assert len(response.data["results"]) == 0

    def test_unauthenticated_fails(self, api_client):
        url = reverse("conversation-list")
        response = api_client.get(url)
        assert response.status_code == 401


class TestConversationMessages:
    def test_conversation_messages_returns_messages(self, cliente_client, conversation_with_messages):
        url = reverse("conversation-messages", args=[conversation_with_messages.id])
        response = cliente_client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["content"] == "Hola"

    def test_conversation_messages_marks_as_read(self, cliente_client, cliente_user, conversation):
        msg = Message.objects.create(conversation=conversation, sender=conversation.participants.exclude(id=cliente_user.id).first(), content="Unread")
        assert Message.objects.get(id=msg.id).is_read is False
        url = reverse("conversation-messages", args=[conversation.id])
        cliente_client.get(url)
        assert Message.objects.get(id=msg.id).is_read is True

    def test_conversation_messages_unauthorized(self, api_client, conversation):
        url = reverse("conversation-messages", args=[conversation.id])
        response = api_client.get(url)
        assert response.status_code == 401

    def test_conversation_messages_not_participant(self, domiciliario_client, conversation):
        url = reverse("conversation-messages", args=[conversation.id])
        response = domiciliario_client.get(url)
        assert response.status_code == 404


class TestChatWebSocket:
    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_connect_and_send_message(self, conversation, cliente_user):
        communicator = WebsocketCommunicator(application, f"/ws/chat/{conversation.id}/")
        communicator.scope["user"] = cliente_user
        connected, _ = await communicator.connect()
        assert connected

        await communicator.send_json_to({"content": "Hello from test"})
        response = await communicator.receive_json_from(timeout=5)
        assert response["content"] == "Hello from test"
        assert response["sender_id"] == cliente_user.id
        exists = await sync_to_async(Message.objects.filter(conversation=conversation, content="Hello from test").exists)()
        assert exists

        await communicator.disconnect()

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_reject_anonymous(self, conversation):
        from django.contrib.auth.models import AnonymousUser
        communicator = WebsocketCommunicator(application, f"/ws/chat/{conversation.id}/")
        communicator.scope["user"] = AnonymousUser()
        connected, _ = await communicator.connect()
        assert not connected

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_reject_non_participant(self, conversation, domiciliario_user):
        communicator = WebsocketCommunicator(application, f"/ws/chat/{conversation.id}/")
        communicator.scope["user"] = domiciliario_user
        connected, _ = await communicator.connect()
        assert not connected

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_empty_content_not_saved(self, conversation, cliente_user):
        communicator = WebsocketCommunicator(application, f"/ws/chat/{conversation.id}/")
        communicator.scope["user"] = cliente_user
        connected, _ = await communicator.connect()
        assert connected

        await communicator.send_json_to({"content": ""})
        msg_count = await sync_to_async(Message.objects.filter(conversation=conversation).count)()
        assert msg_count == 0

        await communicator.disconnect()
