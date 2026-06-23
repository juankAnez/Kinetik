from rest_framework import serializers
from .models import TrackingPoint, Route


class TrackingPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrackingPoint
        fields = ["id", "location", "speed", "heading", "timestamp"]


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = "__all__"
