from rest_framework import serializers
from .models import Municipio

class MunicipioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Municipio
        fields = ["id", "codigo_dane", "nombre", "centro_lat", "centro_lng", "radio_km", "activo"]
