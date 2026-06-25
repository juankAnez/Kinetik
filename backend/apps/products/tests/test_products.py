import pytest
from django.urls import reverse
from rest_framework import status
from apps.products.models import Product


class TestProductList:
    def test_list_products(self, cliente_client, product):
        url = reverse("product-list")
        response = cliente_client.get(url, {"store": product.store_id})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_list_products_without_store(self, cliente_client, product):
        url = reverse("product-list")
        response = cliente_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_product_list_unauthenticated(self, api_client, product):
        url = reverse("product-list")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1


class TestProductDetail:
    def test_product_detail(self, cliente_client, product):
        url = reverse("product-detail", args=[product.pk])
        response = cliente_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == product.name


class TestProductFilter:
    def test_filter_available_only(self, cliente_client, product, store):
        Product.objects.create(store=store, name="No disponible", price=3000, is_available=False)
        url = reverse("product-list")
        response = cliente_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        product_names = [p["name"] for p in response.data["results"]]
        assert "No disponible" not in product_names
        assert "Gaseosa" in product_names
