import pytest
from django.urls import reverse
from django.utils import timezone
from django.contrib.gis.geos import Point
from apps.orders.models import Order, OrderItem, OrderStatusLog
from apps.reviews.models import Review, Dispute


@pytest.fixture
def delivered_order(cliente_user, store, municipio, product):
    order = Order.objects.create(
        client=cliente_user,
        store=store,
        municipio=municipio,
        status="DELIVERED",
        payment_method="CARD",
        delivery_address="Test Address",
        delivery_location=Point(-75.5658, 6.2476, srid=4326),
        subtotal=10000,
        delivery_fee=1500,
        total=11500,
        delivered_at=timezone.now(),
    )
    OrderItem.objects.create(order=order, product_name="Test", product_price=5000, quantity=2, subtotal=10000)
    OrderStatusLog.objects.create(order=order, to_status="DELIVERED", changed_by=cliente_user)
    return order


class TestReviewCreate:
    def test_create_review(self, cliente_client, delivered_order):
        url = reverse("review-list")
        data = {"order": delivered_order.id, "rating": 5, "comment": "Excelente"}
        response = cliente_client.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["rating"] == 5
        assert Review.objects.filter(order=delivered_order, client=delivered_order.client).exists()

    def test_create_review_updates_store_rating(self, cliente_client, delivered_order):
        url = reverse("review-list")
        data = {"order": delivered_order.id, "rating": 4, "comment": "Bueno"}
        cliente_client.post(url, data, format="json")
        delivered_order.store.refresh_from_db()
        assert delivered_order.store.avg_rating == 4.0

    def test_create_review_duplicate_fails(self, cliente_client, delivered_order):
        Review.objects.create(order=delivered_order, client=delivered_order.client, store=delivered_order.store, rating=5)
        url = reverse("review-list")
        data = {"order": delivered_order.id, "rating": 3, "comment": "Duplicada"}
        response = cliente_client.post(url, data, format="json")
        assert response.status_code == 400

    def test_create_review_unauthenticated(self, api_client, delivered_order):
        url = reverse("review-list")
        data = {"order": delivered_order.id, "rating": 5}
        response = api_client.post(url, data, format="json")
        assert response.status_code == 401


class TestReviewList:
    def test_list_reviews(self, cliente_client, cliente_user, delivered_order):
        Review.objects.create(order=delivered_order, client=cliente_user, store=delivered_order.store, rating=4)
        url = reverse("review-list")
        response = cliente_client.get(url)
        assert response.status_code == 200
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["rating"] == 4

    def test_list_reviews_other_users_not_shown(self, cliente_client, cliente_user, comercio_user, delivered_order):
        from apps.stores.models import Store
        other_store = Store.objects.create(name="Other", slug="other", category=delivered_order.store.category, municipio=delivered_order.municipio, location=Point(-75.5, 6.2, srid=4326))
        other_order = Order.objects.create(client=comercio_user, store=other_store, municipio=delivered_order.municipio, status="DELIVERED", payment_method="CASH", delivery_address="Other", delivery_location=Point(-75.5, 6.2, srid=4326), subtotal=5000, delivery_fee=1000, total=6000, delivered_at=timezone.now())
        Review.objects.create(order=delivered_order, client=cliente_user, store=delivered_order.store, rating=4)
        Review.objects.create(order=other_order, client=comercio_user, store=other_store, rating=3)
        url = reverse("review-list")
        response = cliente_client.get(url)
        assert response.status_code == 200
        assert len(response.data["results"]) == 1


class TestDisputeCreate:
    def test_create_dispute(self, cliente_client, delivered_order):
        url = reverse("dispute-list")
        data = {"order": delivered_order.id, "reason": "Producto equivocado", "description": "Llegó otro producto"}
        response = cliente_client.post(url, data, format="json")
        assert response.status_code == 201
        assert Dispute.objects.filter(order=delivered_order, client=delivered_order.client).exists()

    def test_create_dispute_sets_default_status(self, cliente_client, delivered_order):
        url = reverse("dispute-list")
        data = {"order": delivered_order.id, "reason": "Mal servicio", "description": "Demoró mucho"}
        response = cliente_client.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["status"] == "OPEN"

    def test_create_dispute_unauthenticated(self, api_client, delivered_order):
        url = reverse("dispute-list")
        data = {"order": delivered_order.id, "reason": "Test", "description": "Test"}
        response = api_client.post(url, data, format="json")
        assert response.status_code == 401


class TestDisputeList:
    def test_list_disputes(self, cliente_client, cliente_user, delivered_order):
        Dispute.objects.create(order=delivered_order, client=cliente_user, reason="Roto", description="Llegó roto")
        url = reverse("dispute-list")
        response = cliente_client.get(url)
        assert response.status_code == 200
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["reason"] == "Roto"

    def test_list_disputes_other_users_not_shown(self, cliente_client, cliente_user, comercio_user, delivered_order):
        other_order = Order.objects.create(client=comercio_user, store=delivered_order.store, municipio=delivered_order.municipio, status="DELIVERED", payment_method="CASH", delivery_address="Other", delivery_location=Point(-75.5, 6.2, srid=4326), subtotal=5000, delivery_fee=1000, total=6000, delivered_at=timezone.now())
        Dispute.objects.create(order=delivered_order, client=cliente_user, reason="Mío", description="Mío")
        Dispute.objects.create(order=other_order, client=comercio_user, reason="De otro", description="De otro")
        url = reverse("dispute-list")
        response = cliente_client.get(url)
        assert response.status_code == 200
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["reason"] == "Mío"
