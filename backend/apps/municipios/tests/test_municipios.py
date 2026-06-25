from django.urls import reverse
from django.test import Client as DjangoClient


class TestMunicipioList:
    def test_list_active_municipios(self, api_client, municipio):
        url = reverse("municipio-list")
        response = api_client.get(url)
        assert response.status_code == 200
        assert len(response.data["results"]) >= 1
        assert response.data["results"][0]["nombre"] == "Medellín"

    def test_list_only_active(self, api_client, municipio):
        from apps.municipios.models import Municipio
        Municipio.objects.create(
            codigo_dane="99999",
            nombre="Inactivo",
            centro_lat=0, centro_lng=0, activo=False,
        )
        url = reverse("municipio-list")
        response = api_client.get(url)
        nombres = [m["nombre"] for m in response.data["results"]]
        assert "Inactivo" not in nombres


class TestMunicipioCRUD:
    def test_create_municipio_admin(self, admin_user):
        client = DjangoClient()
        client.force_login(admin_user)
        url = reverse("admin:municipios_municipio_add")
        response = client.post(url, {
            "codigo_dane": "11001",
            "nombre": "Bogotá",
            "centro_lat": 4.7110,
            "centro_lng": -74.0721,
            "radio_km": 20,
            "activo": "on",
        })
        assert response.status_code == 302
        from apps.municipios.models import Municipio
        assert Municipio.objects.filter(codigo_dane="11001").exists()

    def test_update_municipio_admin(self, admin_user, municipio):
        client = DjangoClient()
        client.force_login(admin_user)
        url = reverse("admin:municipios_municipio_change", args=[municipio.id])
        response = client.post(url, {
            "codigo_dane": municipio.codigo_dane,
            "nombre": "Medellín Actualizado",
            "centro_lat": municipio.centro_lat,
            "centro_lng": municipio.centro_lng,
            "radio_km": municipio.radio_km,
            "activo": "on",
        })
        assert response.status_code == 302
        municipio.refresh_from_db()
        assert municipio.nombre == "Medellín Actualizado"

    def test_delete_municipio_admin(self, admin_user, municipio):
        client = DjangoClient()
        client.force_login(admin_user)
        url = reverse("admin:municipios_municipio_delete", args=[municipio.id])
        response = client.post(url, {"post": "yes"})
        assert response.status_code == 302
        from apps.municipios.models import Municipio
        assert not Municipio.objects.filter(id=municipio.id).exists()

    def test_municipio_unauthenticated_cannot_create(self, api_client, municipio):
        url = reverse("municipio-list")
        response = api_client.post(url, {
            "codigo_dane": "11001",
            "nombre": "Bogotá",
            "centro_lat": 4.7110,
            "centro_lng": -74.0721,
        }, format="json")
        assert response.status_code == 405
