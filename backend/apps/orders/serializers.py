from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["product_name", "product_price", "quantity", "options", "subtotal"]


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            "store", "municipio", "payment_method",
            "delivery_address", "delivery_location", "delivery_notes",
            "items", "subtotal", "delivery_fee", "discount", "total",
        ]

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        validated_data["client"] = self.context["request"].user
        validated_data["status"] = Order.Status.PENDING
        order = Order.objects.create(**validated_data)
        for item in items_data:
            OrderItem.objects.create(order=order, **item)
        return order


class OrderListSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source="store.name", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "store_name", "status", "total",
            "delivery_fee", "created_at", "estimated_delivery_time",
        ]


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    store_name = serializers.CharField(source="store.name", read_only=True)
    store_logo = serializers.ImageField(source="store.logo", read_only=True)
    store_address = serializers.CharField(source="store.address", read_only=True)
    store_location = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = "__all__"

    def get_store_location(self, obj):
        loc = obj.store.location
        if loc is None:
            return None
        if hasattr(loc, "x"):
            return {"type": "Point", "coordinates": [loc.x, loc.y]}
        return None


class OrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)
    cancel_reason = serializers.CharField(required=False)
