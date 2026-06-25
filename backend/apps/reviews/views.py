from rest_framework import viewsets
from django.db.models import Avg
from .models import Review, Dispute
from .serializers import ReviewSerializer, DisputeSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(client=self.request.user)

    def perform_create(self, serializer):
        order = serializer.validated_data["order"]
        review = serializer.save(client=self.request.user, store=order.store)
        store = order.store

        avg = Review.objects.filter(store=store).aggregate(
            avg_rating=Avg("rating")
        )["avg_rating"]
        store.avg_rating = round(avg, 2) if avg else 0
        store.save(update_fields=["avg_rating"])

        if order.courier:
            courier_reviews = Review.objects.filter(
                order__courier=order.courier,
                courier_rating__isnull=False,
            ).aggregate(avg=Avg("courier_rating"))
            profile = order.courier.courier_profile
            if courier_reviews["avg"]:
                profile.avg_rating = round(courier_reviews["avg"], 2)
                profile.save(update_fields=["avg_rating"])


class DisputeViewSet(viewsets.ModelViewSet):
    serializer_class = DisputeSerializer

    def get_queryset(self):
        return Dispute.objects.filter(client=self.request.user)

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)
