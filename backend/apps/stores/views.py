from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from .models import Store, Address, StoreCategory
from .serializers import (
    StoreListSerializer, StoreDetailSerializer, StoreWriteSerializer,
    AddressSerializer, ScheduleSerializer, ScheduleBatchSerializer,
    StoreCategorySerializer,
)
from shared.permissions import IsComercio, IsAdminOrReadOnly


class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.filter(is_active=True)
    lookup_value_regex = r"\d+"

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy", "my_store"]:
            return [IsComercio()]
        if self.action in ["nearby"]:
            return [AllowAny()]
        if self.action in ["schedules"]:
            return [IsAuthenticated()]
        return [IsAuthenticated()]


    def get_serializer_class(self):
        if self.action == "list":
            return StoreListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return StoreWriteSerializer
        if self.action == "my_store":
            return StoreDetailSerializer
        return StoreDetailSerializer

    def perform_create(self, serializer):
        user = self.request.user

        if "municipio" not in serializer.validated_data:
            serializer.validated_data["municipio"] = user.municipio

        if "location" not in serializer.validated_data:
            serializer.validated_data["location"] = Point(-74.0721, 4.7110, srid=4326)

        store = serializer.save()
        from apps.users.models import CommerceProfile
        profile, _ = CommerceProfile.objects.get_or_create(user=user)
        profile.store = store
        profile.save(update_fields=["store"])

    @action(detail=False, methods=["get", "patch"])
    def my_store(self, request):
        user = request.user
        try:
            store = user.commerce_profile.store
        except AttributeError:
            return Response(
                {"error": "No tienes una tienda asociada"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if not store:
            return Response(
                {"error": "No tienes una tienda asociada"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if request.method == "PATCH":
            serializer = StoreWriteSerializer(store, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(StoreDetailSerializer(store).data)
        return Response(StoreDetailSerializer(store).data)

    @action(detail=True, methods=["get", "put"])
    def schedules(self, request, pk=None):
        store = self.get_object()
        if request.method == "PUT":
            serializer = ScheduleBatchSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            store.schedules.all().delete()
            for sched_data in serializer.validated_data["schedules"]:
                ScheduleSerializer(context={"store": store}).create(sched_data)
            return Response(ScheduleSerializer(store.schedules.all(), many=True).data)
        return Response(ScheduleSerializer(store.schedules.all(), many=True).data)

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


class StoreCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Endpoint público para listar las categorías de tiendas."""
    queryset = StoreCategory.objects.all().order_by("order")
    serializer_class = StoreCategorySerializer
    permission_classes = [AllowAny]
