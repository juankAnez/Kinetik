from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import Order, OrderStatusLog
from .serializers import (
    OrderCreateSerializer, OrderListSerializer,
    OrderDetailSerializer, OrderStatusSerializer,
)
from apps.tasks import dispatch_order_assignment


COMMERCE_VALID_TRANSITIONS = {
    Order.Status.PENDING: [Order.Status.ACCEPTED, Order.Status.CANCELLED],
    Order.Status.ACCEPTED: [Order.Status.PREPARING, Order.Status.CANCELLED],
    Order.Status.PREPARING: [Order.Status.READY, Order.Status.CANCELLED],
}


def validate_commerce_transition(order, new_status):
    if order.status not in COMMERCE_VALID_TRANSITIONS:
        return False, f"No puedes cambiar el estado desde {order.status}"
    valid = COMMERCE_VALID_TRANSITIONS[order.status]
    if new_status not in valid:
        return False, f"Transición inválida de {order.status} a {new_status}"
    return True, None


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        elif self.action == "list":
            return OrderListSerializer
        return OrderDetailSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.all()
        if user.user_type == "CLIENTE":
            qs = qs.filter(client=user)
        elif user.user_type == "COMERCIO":
            qs = qs.filter(store__commerceprofile__user=user)
        elif user.user_type == "DOMICILIARIO":
            qs = qs.filter(courier=user)

        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

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

        # Commerce state machine validation
        if request.user.user_type == "COMERCIO":
            valid, error = validate_commerce_transition(order, new_status)
            if not valid:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        # Courier status transition validation
        if request.user.user_type == "DOMICILIARIO":
            if order.status == Order.Status.ASSIGNED:
                if new_status not in [Order.Status.PICKED_UP, Order.Status.CANCELLED]:
                    return Response(
                        {"error": "Los domiciliarios solo pueden cambiar el estado a Recogido o Cancelado"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            elif order.status == Order.Status.PICKED_UP:
                if new_status not in [Order.Status.DELIVERED, Order.Status.CANCELLED]:
                    return Response(
                        {"error": "Los domiciliarios solo pueden cambiar el estado a Entregado o Cancelado"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                return Response(
                    {"error": f"No tienes permisos para modificar un pedido en estado {order.status}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

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
            if order.courier:
                profile = order.courier.courier_profile
                profile.current_order_count = max(0, profile.current_order_count - 1)
                profile.total_deliveries += 1
                profile.total_earned += order.courier_earnings
                profile.save(update_fields=["current_order_count", "total_deliveries", "total_earned"])

                from apps.payments.models import Wallet
                from django.db import transaction
                with transaction.atomic():
                    wallet, created = Wallet.objects.select_for_update().get_or_create(user=order.courier)
                    wallet.balance += order.courier_earnings
                    wallet.save(update_fields=["balance"])
        elif new_status == Order.Status.CANCELLED:
            order.cancelled_at = timezone.now()
            order.cancel_reason = serializer.validated_data.get("cancel_reason", "")
            if order.courier:
                profile = order.courier.courier_profile
                profile.current_order_count = max(0, profile.current_order_count - 1)
                profile.save(update_fields=["current_order_count"])

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

    @action(detail=False, methods=["get"])
    def stats(self, request):
        if request.user.user_type != "COMERCIO":
            return Response({"error": "Solo para comercios"}, status=403)
        qs = self.get_queryset()
        today = timezone.now().date()
        return Response({
            "total_orders": qs.count(),
            "pending": qs.filter(status=Order.Status.PENDING).count(),
            "accepted": qs.filter(status=Order.Status.ACCEPTED).count(),
            "preparing": qs.filter(status=Order.Status.PREPARING).count(),
            "ready": qs.filter(status=Order.Status.READY).count(),
            "in_transit": qs.filter(status__in=["ASSIGNED", "PICKED_UP"]).count(),
            "delivered": qs.filter(status=Order.Status.DELIVERED).count(),
            "cancelled": qs.filter(status=Order.Status.CANCELLED).count(),
            "today_orders": qs.filter(created_at__date=today).count(),
            "today_revenue": sum(
                float(o.total) for o in qs.filter(
                    created_at__date=today,
                    status=Order.Status.DELIVERED,
                )
            ),
        })
