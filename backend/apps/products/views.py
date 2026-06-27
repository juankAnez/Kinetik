from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Product, ProductCategory
from .serializers import (
    ProductSerializer, ProductWriteSerializer,
    ProductCategoryListSerializer, ProductCategoryWriteSerializer,
)
from shared.permissions import IsComercio


class ProductViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy",
                            "toggle_availability", "categories"]:
            return [IsComercio()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ProductWriteSerializer
        if self.action in ["list", "retrieve"]:
            return ProductSerializer
        return ProductSerializer

    def get_queryset(self):
        store_id = self.request.query_params.get("store")
        category_id = self.request.query_params.get("category")
        user = self.request.user

        # Commerce sees their own products (including unavailable)
        if user.is_authenticated and user.user_type == "COMERCIO":
            try:
                my_store = user.commerce_profile.store
                if my_store and not store_id:
                    qs = Product.objects.filter(store=my_store)
                    if category_id:
                        qs = qs.filter(category_id=category_id)
                    return qs
            except AttributeError:
                pass

        # Public: only available products
        qs = Product.objects.filter(is_available=True)
        if store_id:
            qs = qs.filter(store_id=store_id)
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        try:
            store = user.commerce_profile.store
        except AttributeError:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("No tienes una tienda asociada")
        if not store:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("No tienes una tienda asociada")
        serializer.save(store_id=store.id)

    def perform_update(self, serializer):
        user = self.request.user
        if user.user_type == "COMERCIO":
            try:
                my_store = user.commerce_profile.store
                if serializer.instance.store != my_store:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("No puedes modificar productos de otra tienda")
            except AttributeError:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("No tienes una tienda asociada")
        serializer.save()

    @action(detail=True, methods=["post"])
    def toggle_availability(self, request, pk=None):
        product = self.get_object()
        product.is_available = not product.is_available
        product.save(update_fields=["is_available"])
        return Response({"is_available": product.is_available})

    @action(detail=False, methods=["get", "post"])
    def categories(self, request):
        user = request.user
        try:
            store = user.commerce_profile.store
        except AttributeError:
            return Response({"error": "No tienes una tienda asociada"}, status=400)
        if not store:
            return Response({"error": "No tienes una tienda asociada"}, status=400)

        if request.method == "POST":
            serializer = ProductCategoryWriteSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(store=store)
            return Response(serializer.data, status=201)

        categories = ProductCategory.objects.filter(store=store)
        serializer = ProductCategoryListSerializer(categories, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["put", "delete"], url_path="categories/(?P<cat_id>[^/.]+)")
    def category_detail(self, request, cat_id=None):
        user = request.user
        try:
            store = user.commerce_profile.store
        except AttributeError:
            return Response({"error": "No tienes una tienda asociada"}, status=400)
        if not store:
            return Response({"error": "No tienes una tienda asociada"}, status=400)

        try:
            category = ProductCategory.objects.get(id=cat_id, store=store)
        except ProductCategory.DoesNotExist:
            return Response({"error": "Categoría no encontrada"}, status=404)

        if request.method == "PUT":
            serializer = ProductCategoryWriteSerializer(category, data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        category.delete()
        return Response(status=204)
