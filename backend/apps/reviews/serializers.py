from rest_framework import serializers
from .models import Review, Dispute


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["id", "order", "rating", "comment", "courier_rating", "tip", "created_at"]
        read_only_fields = ["id", "created_at"]


class DisputeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = ["id", "order", "reason", "description", "status", "resolution", "created_at"]
        read_only_fields = ["id", "status", "resolution", "created_at", "resolved_at"]
