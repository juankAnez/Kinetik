from rest_framework import serializers


class RouteQuerySerializer(serializers.Serializer):
    origin_lat = serializers.FloatField(required=True)
    origin_lng = serializers.FloatField(required=True)
    destination_lat = serializers.FloatField(required=True)
    destination_lng = serializers.FloatField(required=True)
    waypoint_lat = serializers.FloatField(required=False)
    waypoint_lng = serializers.FloatField(required=False)


class RouteStepSerializer(serializers.Serializer):
    instruction = serializers.CharField()
    distance_km = serializers.FloatField()
    duration_min = serializers.FloatField()


class RouteLegSerializer(serializers.Serializer):
    distance_km = serializers.FloatField()
    duration_min = serializers.FloatField()
    summary = serializers.CharField()
    steps = RouteStepSerializer(many=True)


class RouteResponseSerializer(serializers.Serializer):
    distance_km = serializers.FloatField()
    duration_min = serializers.FloatField()
    polyline = serializers.DictField()
    legs = RouteLegSerializer(many=True)


class GeocodeQuerySerializer(serializers.Serializer):
    q = serializers.CharField(required=True, min_length=2, help_text="Dirección a geocodificar")
    limit = serializers.IntegerField(default=5, min_value=1, max_value=20, required=False)


class GeocodeResultSerializer(serializers.Serializer):
    lat = serializers.FloatField()
    lng = serializers.FloatField()
    display_name = serializers.CharField()


class GeocodeResponseSerializer(serializers.Serializer):
    results = GeocodeResultSerializer(many=True)


class ReverseGeocodeQuerySerializer(serializers.Serializer):
    lat = serializers.FloatField(required=True)
    lng = serializers.FloatField(required=True)


class AddressDetailSerializer(serializers.Serializer):
    road = serializers.CharField()
    neighbourhood = serializers.CharField()
    suburb = serializers.CharField()
    city = serializers.CharField()
    state = serializers.CharField()
    country = serializers.CharField()
    postcode = serializers.CharField()


class ReverseGeocodeResponseSerializer(serializers.Serializer):
    display_name = serializers.CharField()
    lat = serializers.FloatField()
    lng = serializers.FloatField()
    address = AddressDetailSerializer()
