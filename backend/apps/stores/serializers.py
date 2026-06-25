from rest_framework import serializers
from .models import Store, StoreCategory, Schedule, Address


class StoreCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreCategory
        fields = ["id", "name", "icon"]


class StoreListSerializer(serializers.ModelSerializer):
    category = StoreCategorySerializer(read_only=True)
    distance_km = serializers.FloatField(read_only=True, default=0)

    class Meta:
        model = Store
        fields = [
            "id", "name", "slug", "logo", "category", "location",
            "address", "is_open", "avg_rating", "total_orders",
            "delivery_radius_km", "distance_km",
        ]


class StoreDetailSerializer(serializers.ModelSerializer):
    category = StoreCategorySerializer(read_only=True)

    class Meta:
        model = Store
        fields = "__all__"


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = "__all__"


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ["id", "label", "address", "location", "neighborhood", "notes", "is_default"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
