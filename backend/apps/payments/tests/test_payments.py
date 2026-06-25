from unittest.mock import patch

import pytest
from rest_framework import status

from apps.orders.models import Order
from apps.payments.models import PaymentMethod, Transaction, Wallet
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


def _extract_results(response):
    if isinstance(response.data, dict) and "results" in response.data:
        return response.data["results"]
    return response.data


class TestPaymentMethod:
    def test_create_card(self, cliente_client):
        response = cliente_client.post(
            f"{API}/payments/methods/",
            {"method_type": "CARD", "token": "tok_test_1234"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["method_type"] == "CARD"

    def test_create_separates_users(self, cliente_client, cliente_user):
        other = User.objects.create_user(
            username="other_pm", password="p", phone="3000000005",
            user_type="CLIENTE", municipio=cliente_user.municipio,
        )
        other_client = type(cliente_client)()
        other_client.force_authenticate(user=other)

        cliente_client.post(
            f"{API}/payments/methods/",
            {"method_type": "CARD", "token": "tok_a"},
            format="json",
        )
        other_client.post(
            f"{API}/payments/methods/",
            {"method_type": "PSE", "token": "tok_b"},
            format="json",
        )

        assert PaymentMethod.objects.count() == 2
        response = cliente_client.get(f"{API}/payments/methods/")
        results = _extract_results(response)
        assert len(results) == 1

    def test_list_payment_methods(self, cliente_client):
        cliente_client.post(
            f"{API}/payments/methods/",
            {"method_type": "CARD", "token": "tok_1"},
            format="json",
        )
        cliente_client.post(
            f"{API}/payments/methods/",
            {"method_type": "NEQUI", "token": "tok_2"},
            format="json",
        )
        response = cliente_client.get(f"{API}/payments/methods/")
        results = _extract_results(response)
        assert len(results) == 2

    def test_create_unauthenticated(self, api_client):
        response = api_client.post(
            f"{API}/payments/methods/",
            {"method_type": "CARD", "token": "tok_test"},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestPaymentIntent:
    def test_create_intent(self, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id

        response = cliente_client.post(
            f"{API}/payments/intent/intent/",
            {"order_id": order_id},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert "client_secret" in response.data
        assert "transaction_id" in response.data

        txn = Transaction.objects.get(id=response.data["transaction_id"])
        assert txn.order_id == order_id
        assert txn.status == Transaction.Status.PENDING
        assert txn.gateway == "simulated"
        assert txn.amount == 11500.00

    def test_intent_invalid_order(self, cliente_client, store, municipio):
        response = cliente_client.post(
            f"{API}/payments/intent/intent/",
            {"order_id": 99999},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "error" in response.data

    def test_intent_other_client_order(self, cliente_client, store, municipio, cliente_user):
        other = User.objects.create_user(
            username="other_intent", password="p", user_type="CLIENTE",
            municipio=cliente_user.municipio,
        )
        other_client = type(cliente_client)()
        other_client.force_authenticate(user=other)

        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id

        response = other_client.post(
            f"{API}/payments/intent/intent/",
            {"order_id": order_id},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_intent_unauthenticated(self, api_client, store, municipio, cliente_client):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id
        response = api_client.post(
            f"{API}/payments/intent/intent/",
            {"order_id": order_id},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestPaymentWebhook:
    def test_webhook_completed(self, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id

        intent_resp = cliente_client.post(
            f"{API}/payments/intent/intent/",
            {"order_id": order_id},
            format="json",
        )
        txn_id = intent_resp.data["transaction_id"]
        txn = Transaction.objects.get(id=txn_id)

        response = cliente_client.post(
            f"{API}/payments/intent/webhook/",
            {"transaction_id": txn.gateway_transaction_id, "status": "COMPLETED"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "ok"

        txn.refresh_from_db()
        assert txn.status == "COMPLETED"

        order = Order.objects.get(id=order_id)
        assert order.status == Order.Status.ACCEPTED
        assert order.accepted_at is not None

    def test_webhook_failed(self, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id

        intent_resp = cliente_client.post(
            f"{API}/payments/intent/intent/",
            {"order_id": order_id},
            format="json",
        )
        txn = Transaction.objects.get(id=intent_resp.data["transaction_id"])

        response = cliente_client.post(
            f"{API}/payments/intent/webhook/",
            {"transaction_id": txn.gateway_transaction_id, "status": "FAILED"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

        txn.refresh_from_db()
        assert txn.status == "FAILED"

        order = Order.objects.get(id=order_id)
        assert order.status == Order.Status.PENDING

    def test_webhook_unknown_transaction(self, cliente_client):
        response = cliente_client.post(
            f"{API}/payments/intent/webhook/",
            {"transaction_id": "non_existent", "status": "COMPLETED"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "ok"

    def test_webhook_allows_any(self, api_client, store, municipio, cliente_client):
        _create_order(cliente_client, store, municipio)
        intent_resp = cliente_client.post(
            f"{API}/payments/intent/intent/",
            {"order_id": Order.objects.latest("id").id},
            format="json",
        )
        txn = Transaction.objects.get(id=intent_resp.data["transaction_id"])

        response = api_client.post(
            f"{API}/payments/intent/webhook/",
            {"transaction_id": txn.gateway_transaction_id, "status": "COMPLETED"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK


class TestTransactions:
    def test_list_transactions(self, cliente_client, store, municipio):
        _create_order(cliente_client, store, municipio)
        order_id = Order.objects.latest("id").id

        cliente_client.post(
            f"{API}/payments/intent/intent/",
            {"order_id": order_id},
            format="json",
        )

        response = cliente_client.get(f"{API}/payments/transactions/")
        results = _extract_results(response)
        assert len(results) == 1
        assert results[0]["order"] == order_id
        assert results[0]["status"] == "PENDING"

    def test_transactions_isolated_per_user(self, cliente_client, store, municipio, cliente_user):
        other = User.objects.create_user(
            username="other_txn", password="p", user_type="CLIENTE",
            municipio=cliente_user.municipio,
        )
        other_client = type(cliente_client)()
        other_client.force_authenticate(user=other)

        _create_order(cliente_client, store, municipio)
        cliente_client.post(
            f"{API}/payments/intent/intent/",
            {"order_id": Order.objects.latest("id").id},
            format="json",
        )

        response = other_client.get(f"{API}/payments/transactions/")
        results = _extract_results(response)
        assert len(results) == 0


class TestWallet:
    def test_create_wallet_for_domiciliario(self, domiciliario_user):
        wallet = Wallet.objects.create(user=domiciliario_user)
        assert wallet.balance == 0
        assert wallet.blocked_balance == 0
        assert wallet.user == domiciliario_user

    def test_wallet_one_to_one_relation(self, domiciliario_user):
        Wallet.objects.create(user=domiciliario_user)
        assert hasattr(domiciliario_user, "wallet")
        assert domiciliario_user.wallet.balance == 0

    def test_wallet_can_be_queried(self, domiciliario_user):
        Wallet.objects.create(user=domiciliario_user)
        wallet = Wallet.objects.get(user=domiciliario_user)
        assert wallet.balance == 0
        assert wallet.blocked_balance == 0
