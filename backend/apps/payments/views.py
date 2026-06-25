from decimal import Decimal

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import PaymentMethod, Transaction
from .serializers import (
    PaymentMethodSerializer, TransactionSerializer, PaymentIntentSerializer,
)


class PaymentMethodViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentMethodSerializer

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(order__client=self.request.user)


class PaymentViewSet(viewsets.ViewSet):
    @action(detail=False, methods=["post"])
    def intent(self, request):
        from .models import Transaction
        serializer = PaymentIntentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_id = serializer.validated_data["order_id"]
        from apps.orders.models import Order

        try:
            order = Order.objects.get(id=order_id, client=request.user)
        except Order.DoesNotExist:
            return Response({"error": "Pedido no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        # Create a pending transaction
        transaction = Transaction.objects.create(
            order=order,
            amount=order.total,
            gateway="simulated",
            gateway_transaction_id=f"sim_txn_{order_id}_{request.user.id}",
            status=Transaction.Status.PENDING,
            payment_method=order.payment_method,
            fee=order.total * Decimal("0.025"),
        )

        return Response({
            "client_secret": f"sim_secret_{transaction.id}",
            "transaction_id": transaction.id,
        })

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def webhook(self, request):
        from .models import Transaction
        from apps.orders.models import Order

        gateway_id = request.data.get("transaction_id")
        status_val = request.data.get("status", "COMPLETED")

        try:
            txn = Transaction.objects.get(gateway_transaction_id=gateway_id)
            txn.status = status_val
            txn.save(update_fields=["status"])

            if status_val == "COMPLETED":
                order = txn.order
                if order.status == Order.Status.PENDING:
                    order.status = Order.Status.ACCEPTED
                    order.accepted_at = timezone.now()
                    order.save(update_fields=["status", "accepted_at"])
        except Transaction.DoesNotExist:
            pass

        return Response({"status": "ok"})
