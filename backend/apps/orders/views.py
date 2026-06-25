from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Order, OrderStatusLog
from .serializers import (
    OrderCreateSerializer, OrderListSerializer,
    OrderDetailSerializer, OrderStatusSerializer,
)
from apps.tasks import dispatch_order_assignment


class OrderViewSet(viewsets.ModelViewSet):
    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        elif self.action == "list":
            return OrderListSerializer
        return OrderDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.user_type == "CLIENTE":
            return Order.objects.filter(client=user)
        elif user.user_type == "COMERCIO":
            return Order.objects.filter(store__commerceprofile__user=user)
        elif user.user_type == "DOMICILIARIO":
            return Order.objects.filter(courier=user)
        return Order.objects.all()

    def perform_create(self, serializer):
        order = serializer.save()
        OrderStatusLog.objects.create(
            order=order,
            to_status=Order.Status.PENDING,
            changed_by=self.request.user,
        )

    @action(detail=True, methods=["post"])
    def status(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]
        old_status = order.status

        order.status = new_status

        if new_status == Order.Status.ACCEPTED:
            order.accepted_at = timezone.now()
        elif new_status == Order.Status.READY:
            order.ready_at = timezone.now()
            dispatch_order_assignment.delay(order.id)
        elif new_status == Order.Status.PICKED_UP:
            order.picked_up_at = timezone.now()
        elif new_status == Order.Status.DELIVERED:
            order.delivered_at = timezone.now()
        elif new_status == Order.Status.CANCELLED:
            order.cancelled_at = timezone.now()
            order.cancel_reason = serializer.validated_data.get("cancel_reason", "")
            if order.courier:
                order.courier.courier_profile.current_order_count -= 1
                order.courier.courier_profile.save()

        order.save()

        OrderStatusLog.objects.create(
            order=order,
            from_status=old_status,
            to_status=new_status,
            changed_by=request.user,
        )

        return Response(OrderDetailSerializer(order).data)

    @action(detail=False, methods=["get"])
    def active(self, request):
        qs = self.get_queryset().exclude(
            status__in=[Order.Status.DELIVERED, Order.Status.CANCELLED]
        )
        serializer = OrderListSerializer(qs, many=True)
        return Response(serializer.data)
