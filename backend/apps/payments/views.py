from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import PaymentMethod, Transaction, Wallet
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
        serializer = PaymentIntentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"client_secret": "simulated_secret"})

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def webhook(self, request):
        return Response({"status": "ok"})
