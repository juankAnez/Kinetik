from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from .models import Store, Address
from .serializers import StoreListSerializer, StoreDetailSerializer, AddressSerializer


class StoreViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Store.objects.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == "list":
            return StoreListSerializer
        return StoreDetailSerializer

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def nearby(self, request):
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        radius = request.query_params.get("radius", 5)

        if not lat or not lng:
            return Response({"error": "lat y lng son requeridos"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_location = Point(float(lng), float(lat), srid=4326)
        except (ValueError, TypeError):
            return Response({"error": "Coordenadas inválidas"}, status=status.HTTP_400_BAD_REQUEST)

        stores = self.get_queryset().filter(
            location__distance_lte=(user_location, D(km=float(radius)))
        ).annotate(
            distance_km=Distance("location", user_location)
        ).order_by("distance_km")[:50]

        serializer = StoreListSerializer(stores, many=True, context={"request": request})
        return Response(serializer.data)


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)
