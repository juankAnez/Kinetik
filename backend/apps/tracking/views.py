from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import TrackingPoint, Route
from .serializers import TrackingPointSerializer, RouteSerializer


class TrackingViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TrackingPoint.objects.filter(
            order__client=self.request.user
        ) | TrackingPoint.objects.filter(
            courier=self.request.user
        )

    @action(detail=False, methods=["get"])
    def order_history(self, request):
        order_id = request.query_params.get("order_id")
        if not order_id:
            return Response({"error": "order_id requerido"}, status=status.HTTP_400_BAD_REQUEST)

        points = TrackingPoint.objects.filter(
            order_id=order_id
        ).order_by("-timestamp")[:100]

        serializer = TrackingPointSerializer(points, many=True)
        return Response(serializer.data)
