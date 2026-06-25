import pytest
from django.urls import reverse
from django.utils import timezone
from apps.analytics.models import DailySalesReport, CourierPerformance, MunicipioStats
from apps.orders.models import Order, OrderItem


@pytest.fixture
def daily_sales_report(store):
    return DailySalesReport.objects.create(
        store=store,
        date=timezone.now().date(),
        total_orders=10,
        total_revenue=100000,
        total_commission=10000,
        avg_order_value=10000,
    )


@pytest.fixture
def courier_performance(domiciliario_user):
    return CourierPerformance.objects.create(
        courier=domiciliario_user,
        date=timezone.now().date(),
        total_deliveries=5,
        total_earned=25000,
        avg_delivery_time_min=30.0,
        total_distance_km=15.5,
    )


@pytest.fixture
def municipio_stats(municipio):
    return MunicipioStats.objects.create(
        municipio=municipio,
        date=timezone.now().date(),
        total_orders=20,
        active_stores=5,
        active_couriers=3,
        total_revenue=200000,
    )


class TestAnalyticsDashboard:
    def test_dashboard_admin(self, admin_client):
        url = reverse("analytics-dashboard-dashboard")
        response = admin_client.get(url)
        assert response.status_code == 200
        assert "orders_today" in response.data
        assert "revenue_today" in response.data
        assert "orders_week" in response.data
        assert "avg_delivery_time_min" in response.data
        assert "active_couriers" in response.data
        assert "pending_orders" in response.data

    def test_dashboard_forbidden(self, cliente_client):
        url = reverse("analytics-dashboard-dashboard")
        response = cliente_client.get(url)
        assert response.status_code == 403

    def test_dashboard_unauthenticated(self, api_client):
        url = reverse("analytics-dashboard-dashboard")
        response = api_client.get(url)
        assert response.status_code == 401

    def test_dashboard_forbidden_comercio(self, comercio_client):
        url = reverse("analytics-dashboard-dashboard")
        response = comercio_client.get(url)
        assert response.status_code == 403


class TestDailySalesList:
    def test_list_daily_sales_admin(self, admin_client, daily_sales_report):
        url = reverse("daily-sales-list")
        response = admin_client.get(url)
        assert response.status_code == 200
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["total_orders"] == 10

    def test_list_daily_sales_forbidden(self, cliente_client):
        url = reverse("daily-sales-list")
        response = cliente_client.get(url)
        assert response.status_code == 403

    def test_list_daily_sales_filter_by_store(self, admin_client, store, daily_sales_report):
        url = reverse("daily-sales-list") + f"?store={store.id}"
        response = admin_client.get(url)
        assert response.status_code == 200
        assert len(response.data["results"]) == 1


class TestCourierPerformanceList:
    def test_list_courier_performance_admin(self, admin_client, courier_performance):
        url = reverse("courier-performance-list")
        response = admin_client.get(url)
        assert response.status_code == 200
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["total_deliveries"] == 5

    def test_list_courier_performance_forbidden(self, cliente_client):
        url = reverse("courier-performance-list")
        response = cliente_client.get(url)
        assert response.status_code == 403


class TestMunicipioStatsList:
    def test_list_municipio_stats_admin(self, admin_client, municipio_stats):
        url = reverse("municipio-stats-list")
        response = admin_client.get(url)
        assert response.status_code == 200
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["active_stores"] == 5

    def test_list_municipio_stats_forbidden(self, cliente_client):
        url = reverse("municipio-stats-list")
        response = cliente_client.get(url)
        assert response.status_code == 403
