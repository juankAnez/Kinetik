from unittest.mock import patch

import pytest
from rest_framework import status

from apps.orders.models import Order, OrderItem, OrderStatusLog
from apps.stores.models import Store
from apps.users.models import CommerceProfile, User


ORDER_DATA = {
    "payment_method": "CARD",
    "delivery_address": "Calle 50 # 40-1",
    "delivery_location": {"type": "Point", "coordinates": [-75.5658, 6.2476]},
    "items": [
        {
            "product_name": "Test Product",
            "product_price": "5000.00",
            "quantity": 2,
            "subtotal": "10000.00",
        },
    ],
    "subtotal": "10000.00",
    "delivery_fee": "1500.00",
    "total": "11500.00",
}

API = "/api/v1"


def _create_order(client, store, municipio, **overrides):
    data = dict(ORDER_DATA)
    data["store"] = store.id
    data["municipio"] = municipio.id
    data.update(overrides)
    return client.post(f"{API}/orders/", data, format="json")


def _extract_results(response):
    if isinstance(response.data, dict) and "results" in response.data:
        return response.data["results"]
    return response.data


class TestCreateOrder:
    def test_create_order(self, cliente_client, store, municipio):
        response = _create_order(cliente_client, store, municipio)
        assert response.status_code == status.HTTP_201_CREATED
        order = Order.objects.get()
        assert order.status == Order.Status.PENDING
        assert order.items.count() == 1
        assert order.items.first().product_name == "Test Product"
        assert OrderStatusLog.objects.filter(order=order).count() == 1

    def test_create_order_unauthenticated(self, api_client, store, municipio):
        response = _create_order(api_client, store, municipio)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_order_no_items(self, cliente_client, store, municipio):
        data = dict(ORDER_DATA)
        data["store"] = store.id
        data["municipio"] = municipio.id
        data["items"] = []
        response = cliente_client.post(f"{API}/orders/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        order = Order.objects.get()
        assert order.items.count() == 0

    def test_create_order_invalid_store(self, cliente_client, municipio):
        data = dict(ORDER_DATA)
        data["store"] = 99999
        data["municipio"] = municipio.id
        response = cliente_client.post(f"{API}/orders/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_order_sets_client(self, cliente_client, cliente_user, store, municipio):
        response = _create_order(cliente_client, store, municipio)
        assert response.status_code == status.HTTP_201_CREATED
        assert Order.objects.get().client == cliente_user


class TestListOrders:
    def test_list_own_orders(self, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        _create_order(cliente_client, store, municipio, delivery_address="Otra dirección")
        response = cliente_client.get(f"{API}/orders/")
        assert response.status_code == status.HTTP_200_OK
        results = _extract_results(response)
        assert len(results) == 2
        for item in results:
            assert "store_name" in item
            assert "status" in item
            assert "total" in item

    def test_list_orders_excludes_other_clients(self, cliente_client, store, municipio):
        other_user = User.objects.create_user(
            username="other", password="p", user_type="CLIENTE", municipio=municipio,
        )
        other_client = type(cliente_client)()
        other_client.force_authenticate(user=other_user)
        _create_order(other_client, store, municipio)
        response = cliente_client.get(f"{API}/orders/")
        assert response.status_code == status.HTTP_200_OK
        results = _extract_results(response)
        assert len(results) == 0

    def test_list_orders_by_comercio(self, comercio_client, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        response = comercio_client.get(f"{API}/orders/")
        assert response.status_code == status.HTTP_200_OK
        results = _extract_results(response)
        assert len(results) == 1

    def test_list_orders_comercio_isolation(self, cliente_client, municipio):
        Point = __import__("django.contrib.gis.geos", fromlist=["Point"]).Point
        loc = Point(-75.5658, 6.2476, srid=4326)
        store1 = Store.objects.create(name="S1", slug="s1-isolation", municipio=municipio, location=loc, is_active=True)
        user1 = User.objects.create_user(username="com1", password="p", phone="3000000001", user_type="COMERCIO", municipio=municipio)
        CommerceProfile.objects.create(user=user1, store=store1)
        client1 = type(cliente_client)()
        client1.force_authenticate(user=user1)

        store2 = Store.objects.create(name="S2", slug="s2-isolation", municipio=municipio, location=loc, is_active=True)
        user2 = User.objects.create_user(username="com2", password="p", phone="3000000002", user_type="COMERCIO", municipio=municipio)
        CommerceProfile.objects.create(user=user2, store=store2)
        client2 = type(cliente_client)()
        client2.force_authenticate(user=user2)

        _create_order(client1, store1, municipio)
        _create_order(client2, store2, municipio)

        response = client1.get(f"{API}/orders/")
        results = _extract_results(response)
        assert len(results) == 1
        assert results[0]["store_name"] == "S1"

    def test_list_orders_by_admin(self, admin_client, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        response = admin_client.get(f"{API}/orders/")
        assert response.status_code == status.HTTP_200_OK
        results = _extract_results(response)
        assert len(results) == 1

    def test_active_orders(self, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        active = Order.objects.latest("id")
        _create_order(cliente_client, store, municipio)
        delivered = Order.objects.latest("id")
        delivered.status = Order.Status.DELIVERED
        delivered.save()
        _create_order(cliente_client, store, municipio)
        cancelled = Order.objects.latest("id")
        cancelled.status = Order.Status.CANCELLED
        cancelled.save()

        response = cliente_client.get(f"{API}/orders/active/")
        assert response.status_code == status.HTTP_200_OK
        ids = [o["id"] for o in response.data]
        assert active.id in ids
        assert delivered.id not in ids
        assert cancelled.id not in ids


class TestOrderDetail:
    def test_order_detail(self, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id
        response = cliente_client.get(f"{API}/orders/{order_id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == order_id
        assert "items" in response.data
        assert len(response.data["items"]) == 1
        assert "store_name" in response.data

    def test_order_detail_other_client_forbidden(self, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id
        other_user = User.objects.create_user(
            username="other2", password="p", user_type="CLIENTE", municipio=municipio,
        )
        other_client = type(cliente_client)()
        other_client.force_authenticate(user=other_user)
        response = other_client.get(f"{API}/orders/{order_id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_order_detail_not_found(self, cliente_client):
        response = cliente_client.get(f"{API}/orders/99999/")
        assert response.status_code == status.HTTP_404_NOT_FOUND


STATUS_FLOW = [
    Order.Status.ACCEPTED,
    Order.Status.PREPARING,
    Order.Status.READY,
    Order.Status.ASSIGNED,
    Order.Status.PICKED_UP,
    Order.Status.DELIVERED,
]


class TestOrderStatusTransitions:
    @patch("apps.orders.views.dispatch_order_assignment")
    def test_full_lifecycle(self, mock_task, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id

        assert Order.objects.get(id=order_id).status == Order.Status.PENDING

        for new_status in STATUS_FLOW:
            response = cliente_client.post(
                f"{API}/orders/{order_id}/status/",
                {"status": new_status},
                format="json",
            )
            assert response.status_code == status.HTTP_200_OK, (
                f"Failed transition to {new_status}: {response.data}"
            )
            assert Order.objects.get(id=order_id).status == new_status

        assert OrderStatusLog.objects.filter(order_id=order_id).count() == 7

    def test_cancel_from_pending(self, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id

        response = cliente_client.post(
            f"{API}/orders/{order_id}/status/",
            {"status": Order.Status.CANCELLED, "cancel_reason": "Ya no lo quiero"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        order = Order.objects.get(id=order_id)
        assert order.status == Order.Status.CANCELLED
        assert order.cancel_reason == "Ya no lo quiero"

    def test_status_logs_created(self, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id

        cliente_client.post(f"{API}/orders/{order_id}/status/", {"status": "ACCEPTED"}, format="json")
        cliente_client.post(f"{API}/orders/{order_id}/status/", {"status": "PREPARING"}, format="json")

        logs = OrderStatusLog.objects.filter(order_id=order_id).order_by("created_at")
        assert logs.count() == 3
        assert logs[0].from_status is None
        assert logs[0].to_status == "PENDING"
        assert logs[1].from_status == "PENDING"
        assert logs[1].to_status == "ACCEPTED"
        assert logs[2].from_status == "ACCEPTED"
        assert logs[2].to_status == "PREPARING"

    @patch("apps.orders.views.dispatch_order_assignment")
    def test_ready_triggers_assignment_task(self, mock_task, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id

        cliente_client.post(f"{API}/orders/{order_id}/status/", {"status": "ACCEPTED"}, format="json")
        cliente_client.post(f"{API}/orders/{order_id}/status/", {"status": "PREPARING"}, format="json")
        cliente_client.post(f"{API}/orders/{order_id}/status/", {"status": "READY"}, format="json")

        mock_task.delay.assert_called_once_with(order_id)

    def test_status_invalid_value(self, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id
        response = cliente_client.post(
            f"{API}/orders/{order_id}/status/",
            {"status": "INVALID_STATUS"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_status_unauthenticated(self, api_client, store, municipio, cliente_client):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id
        response = api_client.post(f"{API}/orders/{order_id}/status/", {"status": "ACCEPTED"}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestOrderTimestamps:
    @patch("apps.orders.views.dispatch_order_assignment")
    def test_timestamps_set_on_transitions(self, mock_task, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id

        cliente_client.post(f"{API}/orders/{order_id}/status/", {"status": "ACCEPTED"}, format="json")
        assert Order.objects.get(id=order_id).accepted_at is not None

        cliente_client.post(f"{API}/orders/{order_id}/status/", {"status": "CANCELLED"}, format="json")
        assert Order.objects.get(id=order_id).cancelled_at is not None


class TestOrderPermissions:
    def test_comercio_cannot_see_other_comercio_orders(self, cliente_client, municipio):
        Point = __import__("django.contrib.gis.geos", fromlist=["Point"]).Point
        loc = Point(-75.5658, 6.2476, srid=4326)
        store1 = Store.objects.create(name="S1", slug="sc1", municipio=municipio, location=loc, is_active=True)
        user1 = User.objects.create_user(username="com_a", password="p", phone="3000000003", user_type="COMERCIO", municipio=municipio)
        CommerceProfile.objects.create(user=user1, store=store1)
        client1 = type(cliente_client)()
        client1.force_authenticate(user=user1)

        store2 = Store.objects.create(name="S2", slug="sc2", municipio=municipio, location=loc, is_active=True)
        user2 = User.objects.create_user(username="com_b", password="p", phone="3000000004", user_type="COMERCIO", municipio=municipio)
        CommerceProfile.objects.create(user=user2, store=store2)
        client2 = type(cliente_client)()
        client2.force_authenticate(user=user2)

        _create_order(client1, store1, municipio)
        _create_order(client2, store2, municipio)

        response = client1.get(f"{API}/orders/")
        results = _extract_results(response)
        assert len(results) == 1
        assert results[0]["store_name"] == "S1"

    def test_domiciliario_sees_only_assigned_orders(self, domiciliario_client, domiciliario_user, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id

        Order.objects.filter(id=order_id).update(courier=domiciliario_user)

        response = domiciliario_client.get(f"{API}/orders/")
        results = _extract_results(response)
        assert len(results) == 1

    def test_admin_sees_all(self, admin_client, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        response = admin_client.get(f"{API}/orders/")
        results = _extract_results(response)
        assert len(results) == 1
