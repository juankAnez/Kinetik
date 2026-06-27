"""End-to-end integration test: full order lifecycle.

Simulates the complete flow:
  Store with products → Client creates order → Payment →
  Status transitions → Courier assignment → Chat → Tracking → Delivery → Wallet
"""
import json
from unittest.mock import patch
import pytest
from asgiref.sync import sync_to_async
from django.urls import reverse
from channels.testing import WebsocketCommunicator
from core.asgi import application
from rest_framework import status
from django.utils import timezone
from django.contrib.gis.geos import Point

from apps.orders.models import Order, OrderItem, OrderStatusLog
from apps.chat.models import Conversation, Message
from apps.payments.models import Transaction, Wallet
from apps.users.models import User, CourierProfile
from apps.couriers.models import CourierLocation


API = "/api/v1"
LOCATION = Point(-75.5658, 6.2476, srid=4326)


# ═══════════════════════════════════════════════════════════════════════════
#  SYNC FLOW — Full REST lifecycle in a single test
# ═══════════════════════════════════════════════════════════════════════════

class TestFullOrderFlow:
    """E2E: store → client → order → payment → status → courier → delivery → wallet."""

    @patch("apps.orders.views.dispatch_order_assignment.delay")
    def test_complete_order_lifecycle(
        self, mock_dispatch, cliente_client, comercio_client,
        store, municipio, product,
        cliente_user, comercio_user, domiciliario_user,
    ):
        # ── 1. Store has products visible via API ──────────────────────
        prod_url = reverse("product-list")
        prod_resp = comercio_client.get(prod_url, {"store": store.id})
        assert prod_resp.status_code == 200
        results = prod_resp.data.get("results", prod_resp.data)
        assert len(results) >= 1

        # ── 2. Client creates order with 3 items ───────────────────────
        order_data = {
            "payment_method": "CARD",
            "delivery_address": "Cra 43A # 23-45, Medell\u00edn",
            "delivery_location": {"type": "Point", "coordinates": [-75.5658, 6.2476]},
            "items": [
                {"product_name": "Hamburguesa Cl\u00e1sica", "product_price": "15000.00",
                 "quantity": 2, "subtotal": "30000.00"},
                {"product_name": "Papas Fritas", "product_price": "5000.00",
                 "quantity": 1, "subtotal": "5000.00"},
                {"product_name": "Gaseosa", "product_price": "3000.00",
                 "quantity": 2, "subtotal": "6000.00"},
            ],
            "subtotal": "41000.00",
            "delivery_fee": "3500.00",
            "total": "44500.00",
            "store": store.id,
            "municipio": municipio.id,
        }
        create_resp = cliente_client.post(f"{API}/orders/", order_data, format="json")
        assert create_resp.status_code == status.HTTP_201_CREATED, create_resp.data
        order = Order.objects.latest("id")
        order_id = order.id
        assert order.status == Order.Status.PENDING
        assert order.items.count() == 3
        assert order.total == 44500.00
        assert order.client == cliente_user

        # ── 3. Commerce sees the order ──────────────────────────────────
        list_resp = comercio_client.get(f"{API}/orders/")
        assert list_resp.status_code == 200
        all_ids = [o["id"] for o in list_resp.data.get("results", list_resp.data)]
        assert order_id in all_ids

        # ── 4. Payment flow: intent → webhook completed ─────────────────
        intent_resp = cliente_client.post(
            f"{API}/payments/intent/intent/",
            {"order_id": order_id},
            format="json",
        )
        assert intent_resp.status_code == status.HTTP_200_OK, intent_resp.data
        txn_id = intent_resp.data["transaction_id"]
        txn = Transaction.objects.get(id=txn_id)
        assert txn.amount == 44500.00
        assert txn.status == Transaction.Status.PENDING

        webhook_resp = cliente_client.post(
            f"{API}/payments/intent/webhook/",
            {"transaction_id": txn.gateway_transaction_id, "status": "COMPLETED"},
            format="json",
        )
        assert webhook_resp.status_code == status.HTTP_200_OK
        txn.refresh_from_db()
        assert txn.status == "COMPLETED"
        order.refresh_from_db()
        assert order.status == Order.Status.ACCEPTED
        assert order.accepted_at is not None

        # ── 5. Store prepares the order ─────────────────────────────────
        prep_resp = comercio_client.post(
            f"{API}/orders/{order_id}/status/",
            {"status": Order.Status.PREPARING},
            format="json",
        )
        assert prep_resp.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.status == Order.Status.PREPARING

        # ── 6. Store marks order READY ──────────────────────────────────
        ready_resp = comercio_client.post(
            f"{API}/orders/{order_id}/status/",
            {"status": Order.Status.READY},
            format="json",
        )
        assert ready_resp.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.status == Order.Status.READY
        assert order.ready_at is not None

        # ── 7. Courier assignment ───────────────────────────────────────
        order.courier = domiciliario_user
        order.status = Order.Status.ASSIGNED
        order.assigned_at = timezone.now()
        order.save(update_fields=["courier", "status", "assigned_at"])
        order.refresh_from_db()
        assert order.courier == domiciliario_user
        assert order.status == Order.Status.ASSIGNED

        # ── 8. Courier picks up the order ───────────────────────────────
        from rest_framework.test import APIClient
        courier_client = APIClient()
        courier_client.force_authenticate(user=domiciliario_user)

        pickup_resp = courier_client.post(
            f"{API}/orders/{order_id}/status/",
            {"status": Order.Status.PICKED_UP},
            format="json",
        )
        assert pickup_resp.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.status == Order.Status.PICKED_UP
        assert order.picked_up_at is not None

        # ── 9. Courier delivers the order ───────────────────────────────
        deliver_resp = courier_client.post(
            f"{API}/orders/{order_id}/status/",
            {"status": Order.Status.DELIVERED},
            format="json",
        )
        assert deliver_resp.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.status == Order.Status.DELIVERED
        assert order.delivered_at is not None

        # ── 10. Wallet credited, profile updated ───────────────────────
        wallet = Wallet.objects.get(user=domiciliario_user)
        assert wallet.balance == order.courier_earnings

        profile = CourierProfile.objects.get(user=domiciliario_user)
        assert profile.total_deliveries >= 1
        assert profile.total_earned >= order.courier_earnings

        # ── 11. Status transitions logged ──────────────────────────────
        # Note: PENDING→ACCEPTED (via payment webhook) and READY→ASSIGNED
        # (via direct save) don't hit OrderViewSet.status, so no logs for them.
        logs = OrderStatusLog.objects.filter(order=order).order_by("created_at")
        expected = [None, "ACCEPTED", "PREPARING",
                    "ASSIGNED", "PICKED_UP"]
        assert logs.count() == 5
        for i, exp in enumerate(expected):
            assert logs[i].from_status == exp, (
                f"Log {i}: expected from_status={exp}, got {logs[i].from_status}"
            )

        # ── 12. Tracking history available via REST ─────────────────────
        track_url = reverse("tracking-order-history")
        track_resp = cliente_client.get(track_url, {"order_id": order_id})
        assert track_resp.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════
#  CHAT — WebSocket communication during an active order
# ═══════════════════════════════════════════════════════════════════════════

@pytest.fixture
def order_for_chat(cliente_user, comercio_user, domiciliario_user, store, municipio):
    order = Order.objects.create(
        client=cliente_user,
        store=store,
        municipio=municipio,
        status=Order.Status.ASSIGNED,
        payment_method="CARD",
        delivery_address="Cra 43A # 23-45, Medell\u00edn",
        delivery_location=LOCATION,
        subtotal=41000.00,
        delivery_fee=3500.00,
        total=44500.00,
        courier=domiciliario_user,
    )
    return order


@pytest.fixture
def conversation(order_for_chat, cliente_user, comercio_user, domiciliario_user):
    conv = Conversation.objects.create(order=order_for_chat)
    conv.participants.add(cliente_user, comercio_user, domiciliario_user)
    return conv


class TestChatInOrderFlow:
    """Client-courier real-time chat during delivery."""

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_client_sends_courier_receives(self, conversation, cliente_user, domiciliario_user):
        courier_comm = WebsocketCommunicator(application, f"/ws/chat/{conversation.id}/")
        courier_comm.scope["user"] = domiciliario_user
        connected, _ = await courier_comm.connect()
        assert connected

        client_comm = WebsocketCommunicator(application, f"/ws/chat/{conversation.id}/")
        client_comm.scope["user"] = cliente_user
        connected2, _ = await client_comm.connect()
        assert connected2

        msg_text = "Hola domiciliario, estoy en la direcci\u00f3n indicada"
        await client_comm.send_json_to({"content": msg_text})
        response = await courier_comm.receive_json_from(timeout=5)
        assert response["content"] == msg_text
        assert response["sender_id"] == cliente_user.id

        exists = await sync_to_async(
            Message.objects.filter(conversation=conversation, sender=cliente_user, content=msg_text).exists
        )()
        assert exists

        await courier_comm.disconnect()
        await client_comm.disconnect()

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_courier_replies_client_receives(self, conversation, cliente_user, domiciliario_user):
        courier_comm = WebsocketCommunicator(application, f"/ws/chat/{conversation.id}/")
        courier_comm.scope["user"] = domiciliario_user
        await courier_comm.connect()

        client_comm = WebsocketCommunicator(application, f"/ws/chat/{conversation.id}/")
        client_comm.scope["user"] = cliente_user
        await client_comm.connect()

        await courier_comm.send_json_to({"content": "Ya llegu\u00e9, salgo en 2 minutos"})
        response = await client_comm.receive_json_from(timeout=5)
        assert "Ya llegu\u00e9" in response["content"]
        assert response["sender_id"] == domiciliario_user.id

        count = await sync_to_async(Message.objects.filter(conversation=conversation).count)()
        assert count >= 1

        await courier_comm.disconnect()
        await client_comm.disconnect()

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_messages_readable_via_rest(self, conversation, cliente_user):
        from rest_framework.test import APIClient
        client_rest = APIClient()
        client_rest.force_authenticate(user=cliente_user)

        await sync_to_async(Message.objects.create)(
            conversation=conversation, sender=cliente_user, content="Mensaje de prueba",
        )

        url = reverse("conversation-messages", args=[conversation.id])
        response = await sync_to_async(client_rest.get)(url)
        assert response.status_code == 200
        assert any(m["content"] == "Mensaje de prueba" for m in response.data)


# ═══════════════════════════════════════════════════════════════════════════
#  TRACKING — Real-time GPS during delivery
# ═══════════════════════════════════════════════════════════════════════════

@pytest.fixture
def order_for_tracking(cliente_user, domiciliario_user, store, municipio):
    order = Order.objects.create(
        client=cliente_user,
        store=store,
        municipio=municipio,
        status=Order.Status.PICKED_UP,
        payment_method="CARD",
        delivery_address="Cra 43A # 23-45, Medell\u00edn",
        delivery_location=LOCATION,
        subtotal=41000.00,
        delivery_fee=3500.00,
        total=44500.00,
        courier=domiciliario_user,
    )
    return order


class TestTrackingInOrderFlow:
    """Real-time GPS tracking: courier sends → client receives."""

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_courier_gps_updates_client_receives(self, order_for_tracking, cliente_user, domiciliario_user):
        courier_comm = WebsocketCommunicator(application, f"/ws/tracking/{order_for_tracking.id}/")
        courier_comm.scope["user"] = domiciliario_user
        connected, _ = await courier_comm.connect()
        assert connected

        client_comm = WebsocketCommunicator(application, f"/ws/tracking/{order_for_tracking.id}/")
        client_comm.scope["user"] = cliente_user
        connected2, _ = await client_comm.connect()
        assert connected2

        waypoints = [
            {"lat": 6.2476, "lng": -75.5658, "speed": 0, "heading": 0},
            {"lat": 6.2480, "lng": -75.5650, "speed": 15, "heading": 45},
            {"lat": 6.2485, "lng": -75.5640, "speed": 20, "heading": 50},
            {"lat": 6.2490, "lng": -75.5630, "speed": 10, "heading": 90},
            {"lat": 6.2500, "lng": -75.5600, "speed": 0, "heading": 0},
        ]
        for wp in waypoints:
            await courier_comm.send_json_to({"action": "update_location", **wp})
            response = await client_comm.receive_json_from(timeout=5)
            assert response["type"] == "location"
            assert response["lat"] == wp["lat"]
            assert response["lng"] == wp["lng"]

        saved = await sync_to_async(
            CourierLocation.objects.filter(courier=domiciliario_user).count
        )()
        assert saved == len(waypoints)

        await courier_comm.disconnect()
        await client_comm.disconnect()

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_assigned_event(self, order_for_tracking, cliente_user, domiciliario_user):
        client_comm = WebsocketCommunicator(application, f"/ws/tracking/{order_for_tracking.id}/")
        client_comm.scope["user"] = cliente_user
        connected, _ = await client_comm.connect()
        assert connected

        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f"order_{order_for_tracking.id}",
            {"type": "order.assigned", "order_id": order_for_tracking.id, "courier_id": domiciliario_user.id},
        )
        response = await client_comm.receive_json_from(timeout=5)
        assert response["type"] == "assigned"
        assert response["order_id"] == order_for_tracking.id

        await client_comm.disconnect()


# ═══════════════════════════════════════════════════════════════════════════
#  NOTIFICATIONS — Generated during order lifecycle
# ═══════════════════════════════════════════════════════════════════════════

@pytest.fixture
def order_for_notifications(cliente_user, domiciliario_user, store, municipio):
    order = Order.objects.create(
        client=cliente_user,
        store=store,
        municipio=municipio,
        status=Order.Status.ASSIGNED,
        payment_method="CARD",
        delivery_address="Cra 43A # 23-45, Medell\u00edn",
        delivery_location=LOCATION,
        subtotal=41000.00,
        delivery_fee=3500.00,
        total=44500.00,
        courier=domiciliario_user,
    )
    return order


class TestNotificationsInOrderFlow:
    """Notifications can be queried during/after an order."""

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_notifications_during_order(self, order_for_notifications, cliente_user):
        from apps.notifications.models import Notification
        await sync_to_async(Notification.objects.create)(
            user=cliente_user, type="ORDER_UPDATE",
            title="Pedido en camino", body="Tu domiciliario ha recogido el pedido",
        )
        await sync_to_async(Notification.objects.create)(
            user=cliente_user, type="ORDER_UPDATE",
            title="Pedido entregado", body="Tu pedido ha sido entregado",
        )

        from rest_framework.test import APIClient
        client_rest = APIClient()
        client_rest.force_authenticate(user=cliente_user)

        list_resp = await sync_to_async(client_rest.get)(reverse("notification-list"))
        assert list_resp.status_code == 200
        results = list_resp.data.get("results", list_resp.data)
        assert len(results) >= 2

        unread_resp = await sync_to_async(client_rest.get)(reverse("notification-unread-count"))
        assert unread_resp.status_code == 200
        assert unread_resp.data["unread_count"] >= 2
