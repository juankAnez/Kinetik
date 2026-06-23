from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from apps.users.models import CourierProfile


class CourierViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"])
    def toggle_availability(self, request):
        user = request.user
        if user.user_type != "DOMICILIARIO":
            return Response({"error": "Solo domiciliarios"}, status=status.HTTP_403_FORBIDDEN)

        profile = user.courier_profile

        if profile.blocked_until and profile.blocked_until > timezone.now():
            remaining = (profile.blocked_until - timezone.now()).seconds // 60
            return Response({
                "error": f"Bloqueado por {remaining} minutos por rechazos consecutivos"
            }, status=status.HTTP_403_FORBIDDEN)

        user.is_available = not user.is_available
        user.save(update_fields=["is_available"])

        return Response({"is_available": user.is_available})

    @action(detail=False, methods=["post"])
    def accept_order(self, request):
        order_id = request.data.get("order_id")
        if not order_id:
            return Response({"error": "order_id requerido"}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        profile = user.courier_profile
        profile.rejected_streak = 0
        profile.save(update_fields=["rejected_streak"])

        return Response({"status": "accepted"})

    @action(detail=False, methods=["post"])
    def reject_order(self, request):
        user = request.user
        profile = user.courier_profile
        profile.rejected_streak += 1

        if profile.rejected_streak >= 3:
            profile.blocked_until = timezone.now() + timedelta(minutes=15)
            user.is_available = False
            user.save(update_fields=["is_available"])

        profile.save(update_fields=["rejected_streak", "blocked_until"])
        return Response({"status": "rejected", "streak": profile.rejected_streak})
