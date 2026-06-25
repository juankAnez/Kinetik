from rest_framework import serializers
from .models import CourierLocation, CourierStatus, AssignmentLog


class CourierLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourierLocation
        fields = "__all__"
        read_only_fields = ["id", "timestamp"]


class CourierStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourierStatus
        fields = "__all__"
        read_only_fields = ["id"]


class AssignmentLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentLog
        fields = "__all__"
        read_only_fields = ["id", "created_at"]
