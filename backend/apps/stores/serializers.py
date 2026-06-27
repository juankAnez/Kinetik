from rest_framework import serializers
from django.utils.text import slugify
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
            "id", "name", "slug", "logo", "banner", "category", "location",
            "address", "phone", "is_open", "avg_rating", "total_orders",
            "delivery_radius_km", "distance_km",
        ]


class StoreDetailSerializer(serializers.ModelSerializer):
    category = StoreCategorySerializer(read_only=True)
    schedules = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = [
            "id", "name", "slug", "description", "logo", "banner",
            "category", "municipio", "location", "address", "phone",
            "plan", "commission_rate", "is_active", "is_open",
            "avg_rating", "total_orders", "delivery_radius_km",
            "schedules", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "slug", "avg_rating", "total_orders",
            "plan", "commission_rate", "created_at", "updated_at",
        ]

    def get_schedules(self, obj):
        return ScheduleSerializer(obj.schedules.all(), many=True).data


class StoreWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = [
            "name", "description", "logo", "banner", "category",
            "municipio", "location", "address", "phone", "is_open",
            "delivery_radius_km",
        ]
        extra_kwargs = {
            # El perform_create del ViewSet inyecta municipio y location
            # si no vienen del cliente, por lo que los marcamos opcionales aquí.
            "category": {"required": False, "allow_null": True},
            "municipio": {"required": False},
            "location": {"required": False},
            # address y phone son NOT NULL en el modelo pero queremos
            # permitir crearlos sin ellos y actualizarlos después.
            "address": {"required": False, "default": ""},
            "phone": {"required": False, "default": ""},
        }

    def create(self, validated_data):
        base = slugify(validated_data["name"]) or "tienda"
        slug = base
        counter = 1
        while Store.objects.filter(slug=slug).exists():
            slug = f"{base}-{counter}"
            counter += 1
        validated_data["slug"] = slug
        return super().create(validated_data)



class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = ["id", "day", "open_time", "close_time", "is_active"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        store = self.context.get("store")
        if store:
            validated_data["store"] = store
        return super().create(validated_data)


class ScheduleBatchSerializer(serializers.Serializer):
    schedules = ScheduleSerializer(many=True)


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ["id", "label", "address", "location", "neighborhood", "notes", "is_default"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
