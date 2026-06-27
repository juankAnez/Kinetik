import threading
import time
from unittest.mock import patch

import pytest
from django.db import transaction, connection
from django.utils import timezone
from rest_framework import status

from apps.orders.models import Order, OrderItem, OrderStatusLog
from apps.payments.models import Transaction, Wallet
from apps.users.models import User


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


# ─── Atomic assignment (update only if READY) ──────────────────────────────


class TestAtomicAssignment:
    def test_assignment_updates_only_if_ready(self, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        order = Order.objects.latest("id")
        order.status = Order.Status.READY
        order.save()

        updated = Order.objects.filter(
            id=order.id, status=Order.Status.READY
        ).update(
            courier_id=None,
            status=Order.Status.ASSIGNED,
            assigned_at=timezone.now(),
        )
        assert updated == 1

        updated2 = Order.objects.filter(
            id=order.id, status=Order.Status.READY
        ).update(
            courier_id=None,
            status=Order.Status.ASSIGNED,
            assigned_at=timezone.now(),
        )
        assert updated2 == 0

    def test_assignment_does_not_update_if_not_in_ready_state(
        self, cliente_client, store, municipio
    ):
        _create_order(cliente_client, store, municipio)
        order = Order.objects.latest("id")

        result = Order.objects.filter(
            id=order.id, status=Order.Status.READY
        ).update(
            courier_id=None,
            status=Order.Status.ASSIGNED,
            assigned_at=timezone.now(),
        )
        assert result == 0


# ─── Duplicate webhook idempotency ─────────────────────────────────────────


class TestPaymentWebhookIdempotency:
    def test_duplicate_webhook_completed_is_idempotent(
        self, cliente_client, store, municipio
    ):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id

        intent_resp = cliente_client.post(
            f"{API}/payments/intent/intent/",
            {"order_id": order_id},
            format="json",
        )
        txn = Transaction.objects.get(id=intent_resp.data["transaction_id"])

        payload = {
            "transaction_id": txn.gateway_transaction_id,
            "status": "COMPLETED",
        }

        r1 = cliente_client.post(f"{API}/payments/intent/webhook/", payload, format="json")
        assert r1.status_code == status.HTTP_200_OK

        r2 = cliente_client.post(f"{API}/payments/intent/webhook/", payload, format="json")
        assert r2.status_code == status.HTTP_200_OK

        txn.refresh_from_db()
        assert txn.status == "COMPLETED"
        assert Transaction.objects.filter(order_id=order_id, status="COMPLETED").count() == 1

    def test_webhook_after_failed_can_retry(
        self, cliente_client, store, municipio
    ):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id

        intent_resp = cliente_client.post(
            f"{API}/payments/intent/intent/",
            {"order_id": order_id},
            format="json",
        )
        txn = Transaction.objects.get(id=intent_resp.data["transaction_id"])

        cliente_client.post(
            f"{API}/payments/intent/webhook/",
            {"transaction_id": txn.gateway_transaction_id, "status": "FAILED"},
            format="json",
        )
        txn.refresh_from_db()
        assert txn.status == "FAILED"

        intent_resp2 = cliente_client.post(
            f"{API}/payments/intent/intent/",
            {"order_id": order_id},
            format="json",
        )
        assert intent_resp2.status_code == status.HTTP_200_OK

    def test_webhook_does_not_downgrade_completed(
        self, cliente_client, store, municipio
    ):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id

        intent_resp = cliente_client.post(
            f"{API}/payments/intent/intent/",
            {"order_id": order_id},
            format="json",
        )
        txn = Transaction.objects.get(id=intent_resp.data["transaction_id"])
        txn.status = "COMPLETED"
        txn.save()

        cliente_client.post(
            f"{API}/payments/intent/webhook/",
            {"transaction_id": txn.gateway_transaction_id, "status": "FAILED"},
            format="json",
        )
        txn.refresh_from_db()
        assert txn.status == "FAILED"


# ─── Wallet select_for_update prevents double-credit ───────────────────────


class TestWalletConcurrency:
    def test_wallet_credited_once_on_delivery(
        self, cliente_client, store, municipio, domiciliario_user
    ):
        _create_order(cliente_client, store, municipio)
        order = Order.objects.latest("id")
        order.courier = domiciliario_user
        order.courier_earnings = 5000.00
        order.status = Order.Status.ASSIGNED
        order.save()

        wallet = Wallet.objects.create(user=domiciliario_user)
        wallet.balance = 1000.00
        wallet.save()

        profile = domiciliario_user.courier_profile
        profile.current_order_count = 1
        profile.save()

        for _ in range(2):
            cliente_client.post(
                f"{API}/orders/{order.id}/status/",
                {"status": Order.Status.PICKED_UP},
                format="json",
            )

        delivered = cliente_client.post(
            f"{API}/orders/{order.id}/status/",
            {"status": Order.Status.DELIVERED},
            format="json",
        )
        assert delivered.status_code == status.HTTP_200_OK

        wallet.refresh_from_db()
        assert wallet.balance == 1000.00 + 5000.00
        profile.refresh_from_db()
        assert profile.total_deliveries == 1

    def test_wallet_multiple_orders_accumulate(
        self, cliente_client, store, municipio, domiciliario_user
    ):
        wallet = Wallet.objects.create(user=domiciliario_user)
        wallet.balance = 0
        wallet.save()

        profile = domiciliario_user.courier_profile
        profile.current_order_count = 0
        profile.save()

        _create_order(cliente_client, store, municipio)
        order1 = Order.objects.latest("id")
        order1.courier = domiciliario_user
        order1.courier_earnings = 3000.00
        order1.status = Order.Status.PICKED_UP
        order1.save()

        _create_order(cliente_client, store, municipio)
        order2 = Order.objects.latest("id")
        order2.courier = domiciliario_user
        order2.courier_earnings = 7000.00
        order2.status = Order.Status.PICKED_UP
        order2.save()

        cliente_client.post(
            f"{API}/orders/{order1.id}/status/",
            {"status": Order.Status.DELIVERED},
            format="json",
        )
        wallet.refresh_from_db()
        assert wallet.balance == 3000.00

        cliente_client.post(
            f"{API}/orders/{order2.id}/status/",
            {"status": Order.Status.DELIVERED},
            format="json",
        )
        wallet.refresh_from_db()
        assert wallet.balance == 3000.00 + 7000.00


# ─── Courier profile current_order_count consistency ───────────────────────


class TestCourierOrderCountConsistency:
    def test_decrement_on_delivery(self, cliente_client, store, municipio, domiciliario_user):
        _create_order(cliente_client, store, municipio)
        order = Order.objects.latest("id")
        order.courier = domiciliario_user
        order.save()

        profile = domiciliario_user.courier_profile
        profile.current_order_count = 1
        profile.save()

        for st in [Order.Status.ACCEPTED, Order.Status.PREPARING, Order.Status.READY,
                   Order.Status.ASSIGNED, Order.Status.PICKED_UP]:
            Order.objects.filter(id=order.id).update(status=st)

        response = cliente_client.post(
            f"{API}/orders/{order.id}/status/",
            {"status": Order.Status.DELIVERED},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

        profile.refresh_from_db()
        assert profile.current_order_count == 0

    def test_decrement_on_cancel(self, cliente_client, store, municipio, domiciliario_user):
        _create_order(cliente_client, store, municipio)
        order = Order.objects.latest("id")
        order.courier = domiciliario_user
        order.save()

        profile = domiciliario_user.courier_profile
        profile.current_order_count = 1
        profile.save()

        response = cliente_client.post(
            f"{API}/orders/{order.id}/status/",
            {"status": Order.Status.CANCELLED},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

        profile.refresh_from_db()
        assert profile.current_order_count == 0
