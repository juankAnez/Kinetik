from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .serializers import (
    GeocodeQuerySerializer,
    GeocodeResponseSerializer,
    ReverseGeocodeQuerySerializer,
    ReverseGeocodeResponseSerializer,
    RouteQuerySerializer,
    RouteResponseSerializer,
)
from .services import geocode, reverse_geocode, get_route


class GeocodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = GeocodeQuerySerializer(data=request.query_params)
        qs.is_valid(raise_exception=True)

        results = geocode(qs.validated_data["q"], qs.validated_data["limit"])
        serializer = GeocodeResponseSerializer({"results": results})
        return Response(serializer.data)


class ReverseGeocodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = ReverseGeocodeQuerySerializer(data=request.query_params)
        qs.is_valid(raise_exception=True)

        result = reverse_geocode(qs.validated_data["lat"], qs.validated_data["lng"])
        if result is None:
            return Response(
                {"detail": "No se encontró dirección para esas coordenadas"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ReverseGeocodeResponseSerializer(result)
        return Response(serializer.data)


class DirectionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = RouteQuerySerializer(data=request.query_params)
        qs.is_valid(raise_exception=True)

        result = get_route(
            origin_lat=qs.validated_data["origin_lat"],
            origin_lng=qs.validated_data["origin_lng"],
            destination_lat=qs.validated_data["destination_lat"],
            destination_lng=qs.validated_data["destination_lng"],
            waypoint_lat=qs.validated_data.get("waypoint_lat"),
            waypoint_lng=qs.validated_data.get("waypoint_lng"),
        )
        if result is None:
            return Response(
                {"detail": "No se pudo calcular la ruta"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        serializer = RouteResponseSerializer(result)
        return Response(serializer.data)
