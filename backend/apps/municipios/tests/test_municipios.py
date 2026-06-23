from django.urls import reverse


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
