from rest_framework import serializers
from .models import User, ClientProfile, CourierProfile, CommerceProfile
from apps.municipios.models import Municipio


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "phone", "first_name", "last_name",
            "user_type", "municipio", "avatar", "is_available",
        ]
        read_only_fields = ["id"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    municipio = serializers.PrimaryKeyRelatedField(queryset=Municipio.objects.all())

    class Meta:
        model = User
        fields = ["username", "email", "phone", "password", "first_name", "last_name", "user_type", "municipio"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        if user.user_type == User.UserType.CLIENTE:
            ClientProfile.objects.create(user=user)
        elif user.user_type == User.UserType.DOMICILIARIO:
            CourierProfile.objects.create(user=user)
        elif user.user_type == User.UserType.COMERCIO:
            CommerceProfile.objects.create(user=user)

        return user


class ClientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientProfile
        fields = ["total_orders", "total_spent", "default_address"]


class CourierProfileSerializer(serializers.ModelSerializer):
    last_location = serializers.SerializerMethodField()

    class Meta:
        model = CourierProfile
        fields = [
            "current_order_count", "avg_rating", "completion_rate",
            "total_deliveries", "total_earned", "vehicle_type",
            "last_location",
        ]
        read_only_fields = ["current_order_count", "avg_rating", "completion_rate", "total_deliveries", "total_earned"]

    def get_last_location(self, obj):
        value = getattr(obj, "last_location", None)
        if value is None:
            return None
        return {"x": value.x, "y": value.y}


class CommerceProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommerceProfile
        fields = ["total_sales", "store"]
