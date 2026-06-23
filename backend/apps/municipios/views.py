from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Municipio
from .serializers import MunicipioSerializer

class MunicipioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Municipio.objects.filter(activo=True)
    serializer_class = MunicipioSerializer
    permission_classes = [AllowAny]
