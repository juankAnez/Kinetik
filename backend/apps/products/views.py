from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        store_id = self.request.query_params.get("store")
        qs = Product.objects.filter(is_available=True)
        if store_id:
            qs = qs.filter(store_id=store_id)
        return qs
