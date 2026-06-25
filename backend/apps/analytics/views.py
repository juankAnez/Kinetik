from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db.models import Sum, Avg
from django.utils import timezone
from datetime import timedelta
from apps.orders.models import Order
from apps.users.models import User
from .models import DailySalesReport, CourierPerformance, MunicipioStats
from .serializers import (
    DailySalesReportSerializer, CourierPerformanceSerializer,
    MunicipioStatsSerializer,
)


class DailySalesReportViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = DailySalesReportSerializer
    filterset_fields = ["store", "date"]

    def get_queryset(self):
        return DailySalesReport.objects.select_related("store").all()


class CourierPerformanceViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = CourierPerformanceSerializer
    filterset_fields = ["courier", "date"]

    def get_queryset(self):
        return CourierPerformance.objects.select_related("courier").all()


class MunicipioStatsViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = MunicipioStatsSerializer
    filterset_fields = ["municipio", "date"]

    def get_queryset(self):
        return MunicipioStats.objects.select_related("municipio").all()


class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=["get"])
    def dashboard(self, request):
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)

        orders_today = Order.objects.filter(created_at__date=today)
        orders_week = Order.objects.filter(created_at__date__gte=week_ago)

        return Response({
            "orders_today": orders_today.count(),
            "revenue_today": float(orders_today.aggregate(s=Sum("total"))["s"] or 0),
            "orders_week": orders_week.count(),
            "avg_delivery_time_min": orders_today.filter(
                delivered_at__isnull=False
            ).aggregate(
                avg=Avg("delivered_at__hour")
            )["avg"] or 0,
            "active_couriers": User.objects.filter(
                is_available=True, user_type="DOMICILIARIO"
            ).count(),
            "pending_orders": Order.objects.exclude(
                status__in=["DELIVERED", "CANCELLED"]
            ).count(),
        })
