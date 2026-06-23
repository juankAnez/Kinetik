from rest_framework import serializers
from .models import PaymentMethod, Transaction, Wallet


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ["id", "method_type", "last_four", "is_default"]
        read_only_fields = ["id", "last_four"]


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = "__all__"
        read_only_fields = ["id", "created_at"]


class PaymentIntentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    payment_method_id = serializers.IntegerField(required=False)
