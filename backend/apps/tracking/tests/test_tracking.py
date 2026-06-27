import json
import pytest
from asgiref.sync import sync_to_async
from django.urls import reverse
from django.contrib.gis.geos import Point
from channels.testing import WebsocketCommunicator
from core.asgi import application
from apps.orders.models import Order, OrderItem
from apps.tracking.models import TrackingPoint, Route


@pytest.fixture
def order(cliente_user, store, municipio, product):
    order = Order.objects.create(
        client=cliente_user,
        store=store,
        municipio=municipio,
        status="PENDING",
        payment_method="CARD",
        delivery_address="Calle 50 # 40-1",
        delivery_location=Point(-75.5658, 6.2476, srid=4326),
        subtotal=10000,
        delivery_fee=1500,
        total=11500,
    )
    OrderItem.objects.create(
        order=order, product_name="Test", product_price=5000, quantity=2, subtotal=10000
    )
    return order


@pytest.fixture
def tracking_points(order, domiciliario_user):
    points = []
    for i in range(3):
        pt = TrackingPoint.objects.create(
            courier=domiciliario_user,
            order=order,
            location=Point(-75.5658 + i * 0.001, 6.2476 + i * 0.001, srid=4326),
            speed=10.0 + i,
            heading=90.0,
        )
        points.append(pt)
    return points


@pytest.fixture
def route(order):
    return Route.objects.create(
        order=order,
        start_location=Point(-75.5658, 6.2476, srid=4326),
        end_location=Point(-75.5600, 6.2500, srid=4326),
        distance_km=2.5,
        estimated_duration_min=10,
        polyline="abc123",
    )


# ─── REST Tests: Tracking Points ────────────────────────────────────────────


class TestTrackingPointsREST:
    def test_list_points(self, order, tracking_points, cliente_client):
        url = reverse("tracking-list")
        response = cliente_client.get(url)
        assert response.status_code == 200
        results = response.data.get("results", response.data)
        assert len(results) == 3

    def test_list_points_unauthorized(self, api_client):
        url = reverse("tracking-list")
        response = api_client.get(url)
        assert response.status_code == 401

    def test_order_history(self, order, tracking_points, cliente_client):
        url = reverse("tracking-order-history")
        response = cliente_client.get(f"{url}?order_id={order.id}")
        assert response.status_code == 200
        assert len(response.data) == 3

    def test_order_history_missing_order_id(self, cliente_client):
        url = reverse("tracking-order-history")
        response = cliente_client.get(url)
        assert response.status_code == 400

    def test_order_history_unauthorized(self, api_client, order):
        url = reverse("tracking-order-history")
        response = api_client.get(f"{url}?order_id={order.id}")
        assert response.status_code == 401


# ─── REST Tests: Routes ─────────────────────────────────────────────────────


class TestRoutesREST:
    def test_list_routes(self, order, route, cliente_client):
        url = reverse("route-list")
        response = cliente_client.get(url)
        assert response.status_code == 200
        results = response.data.get("results", response.data)
        assert len(results) == 1
        assert results[0]["distance_km"] == 2.5

    def test_routes_isolation(self, order, route, cliente_client, cliente_user, store, municipio):
        from apps.users.models import User
        other_user = User.objects.create_user(
            username="other_route_client", password="p", user_type="CLIENTE", municipio=municipio,
        )
        from rest_framework.test import APIClient
        other_client = APIClient()
        other_client.force_authenticate(user=other_user)

        other_order = Order.objects.create(
            client=other_user,
            store=store,
            municipio=municipio,
            status="PENDING",
            payment_method="CARD",
            delivery_address="Otra direcci\u00f3n",
            delivery_location=Point(-75.5600, 6.2500, srid=4326),
            subtotal=5000,
            delivery_fee=1000,
            total=6000,
        )
        Route.objects.create(
            order=other_order,
            start_location=Point(-75.5658, 6.2476, srid=4326),
            end_location=Point(-75.5600, 6.2500, srid=4326),
            distance_km=1.0,
            estimated_duration_min=5,
        )
        url = reverse("route-list")
        response = cliente_client.get(url)
        results = response.data.get("results", response.data)
        assert len(results) == 1


# ─── WebSocket Tests ────────────────────────────────────────────────────────


class TestTrackingWebSocket:
    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_connect_as_client(self, order, cliente_user):
        communicator = WebsocketCommunicator(
            application, f"/ws/tracking/{order.id}/"
        )
        communicator.scope["user"] = cliente_user
        connected, _ = await communicator.connect()
        assert connected
        await communicator.disconnect()

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_connect_as_courier(self, order, domiciliario_user):
        order.courier = domiciliario_user
        await sync_to_async(order.save)()
        communicator = WebsocketCommunicator(
            application, f"/ws/tracking/{order.id}/"
        )
        communicator.scope["user"] = domiciliario_user
        connected, _ = await communicator.connect()
        assert connected
        await communicator.disconnect()

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_connect_as_comercio(self, order, comercio_user):
        communicator = WebsocketCommunicator(
            application, f"/ws/tracking/{order.id}/"
        )
        communicator.scope["user"] = comercio_user
        connected, _ = await communicator.connect()
        assert connected
        await communicator.disconnect()

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_reject_anonymous(self, order):
        from django.contrib.auth.models import AnonymousUser
        communicator = WebsocketCommunicator(
            application, f"/ws/tracking/{order.id}/"
        )
        communicator.scope["user"] = AnonymousUser()
        connected, _ = await communicator.connect()
        assert not connected

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_reject_non_participant(self, order, municipio):
        from apps.users.models import User
        stranger = await sync_to_async(User.objects.create_user)(
            username="stranger", password="p", user_type="CLIENTE", municipio=municipio,
        )
        communicator = WebsocketCommunicator(
            application, f"/ws/tracking/{order.id}/"
        )
        communicator.scope["user"] = stranger
        connected, _ = await communicator.connect()
        assert not connected

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_reject_nonexistent_order(self, cliente_user):
        communicator = WebsocketCommunicator(
            application, "/ws/tracking/99999/"
        )
        communicator.scope["user"] = cliente_user
        connected, _ = await communicator.connect()
        assert not connected

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_update_location_as_courier(self, order, domiciliario_user):
        order.courier = domiciliario_user
        await sync_to_async(order.save)()
        communicator = WebsocketCommunicator(
            application, f"/ws/tracking/{order.id}/"
        )
        communicator.scope["user"] = domiciliario_user
        connected, _ = await communicator.connect()
        assert connected

        await communicator.send_json_to({
            "action": "update_location",
            "lat": 6.2500,
            "lng": -75.5600,
            "speed": 15.0,
            "heading": 180.0,
        })
        response = await communicator.receive_json_from(timeout=5)
        assert response["type"] == "location"
        assert response["lat"] == 6.2500
        assert response["lng"] == -75.5600
        assert response["speed"] == 15.0
        assert response["heading"] == 180.0

        location_exists = await sync_to_async(
            lambda: type(order).objects.filter(id=order.id, courier=domiciliario_user).exists()
        )()
        # CourierLocation should have been created
        from apps.couriers.models import CourierLocation
        loc_count = await sync_to_async(
            CourierLocation.objects.filter(courier=domiciliario_user).count
        )()
        assert loc_count == 1

        await communicator.disconnect()

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_update_location_rejected_for_client(self, order, cliente_user):
        communicator = WebsocketCommunicator(
            application, f"/ws/tracking/{order.id}/"
        )
        communicator.scope["user"] = cliente_user
        connected, _ = await communicator.connect()
        assert connected

        await communicator.send_json_to({
            "action": "update_location",
            "lat": 6.2500,
            "lng": -75.5600,
        })

        from apps.couriers.models import CourierLocation
        loc_count = await sync_to_async(
            CourierLocation.objects.filter(courier=cliente_user).count
        )()
        assert loc_count == 0

        await communicator.disconnect()

    @pytest.mark.django_db(transaction=True)
    @pytest.mark.asyncio
    async def test_order_assigned_event(self, order, cliente_user):
        communicator = WebsocketCommunicator(
            application, f"/ws/tracking/{order.id}/"
        )
        communicator.scope["user"] = cliente_user
        connected, _ = await communicator.connect()
        assert connected

        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f"order_{order.id}",
            {
                "type": "order.assigned",
                "order_id": order.id,
                "courier_id": 1,
            },
        )
        response = await communicator.receive_json_from(timeout=5)
        assert response["type"] == "assigned"
        assert response["order_id"] == order.id
        assert response["courier_id"] == 1

        await communicator.disconnect()
