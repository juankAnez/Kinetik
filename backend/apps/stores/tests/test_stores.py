import pytest
from django.urls import reverse
from rest_framework import status
from apps.stores.models import Address


class TestStoreList:
    def test_list_stores_authenticated(self, cliente_client, store):
        url = reverse("store-list")
        response = cliente_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_list_stores_unauthenticated(self, api_client):
        url = reverse("store-list")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestStoreDetail:
    def test_store_detail(self, cliente_client, store):
        url = reverse("store-detail", args=[store.pk])
        response = cliente_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["slug"] == store.slug


class TestStoreNearby:
    def test_store_nearby_without_params(self, api_client):
        url = reverse("store-nearby")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.xfail(reason="GIS distance_lte lookup requires spatial database backend")
    def test_store_nearby(self, api_client, store):
        url = reverse("store-nearby")
        response = api_client.get(url, {"lat": "6.2476", "lng": "-75.5658", "radius": "10"})
        assert response.status_code == status.HTTP_200_OK


class TestAddress:
    def test_create_address(self, cliente_client):
        url = reverse("address-list")
        data = {
            "label": "Casa",
            "address": "Calle 50 # 40-1",
            "location": "POINT (-75.5658 6.2476)",
            "neighborhood": "El Poblado",
        }
        response = cliente_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["address"] == "Calle 50 # 40-1"

    def test_list_addresses(self, cliente_client, cliente_user):
        Address.objects.create(
            user=cliente_user,
            address="Calle 50 # 40-1",
            location="POINT (-75.5658 6.2476)",
        )
        url = reverse("address-list")
        response = cliente_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1


class TestStoreFilterByMunicipio:
    def test_store_filter_by_municipio(self, cliente_client, store, municipio):
        url = reverse("store-list")
        response = cliente_client.get(url, {"municipio": municipio.pk})
        assert response.status_code == status.HTTP_200_OK
