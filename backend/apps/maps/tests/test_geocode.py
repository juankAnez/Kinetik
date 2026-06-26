from unittest.mock import patch
from django.urls import reverse
from django.test import override_settings
from django.core.cache import cache
from rest_framework.test import APIClient


class TestGeocodeEndpoint:
    url = reverse("maps-geocode")

    def test_geocode_returns_results(self):
        fake_results = [
            type("Loc", (), {
                "latitude": 6.2476, "longitude": -75.5658,
                "address": "Calle 50, Medellín, Colombia",
            }),
        ]
        with patch("apps.maps.services.get_geolocator") as mock_geo:
            instance = mock_geo.return_value
            instance.geocode.return_value = fake_results

            client = APIClient()
            response = client.get(self.url, {"q": "Calle 50 Medellin"})
            assert response.status_code == 200
            data = response.json()
            assert len(data["results"]) == 1
            assert data["results"][0]["lat"] == 6.2476
            assert data["results"][0]["lng"] == -75.5658
            assert "Calle 50" in data["results"][0]["display_name"]

    def test_geocode_empty_query_returns_400(self):
        client = APIClient()
        response = client.get(self.url, {"q": ""})
        assert response.status_code == 400

    def test_geocode_missing_query_returns_400(self):
        client = APIClient()
        response = client.get(self.url, {})
        assert response.status_code == 400

    def test_geocode_no_results_returns_empty_list(self):
        with patch("apps.maps.services.get_geolocator") as mock_geo:
            instance = mock_geo.return_value
            instance.geocode.return_value = None

            client = APIClient()
            response = client.get(self.url, {"q": "xyz123nowhere"})
            assert response.status_code == 200
            assert response.json()["results"] == []

    def test_geocode_accepts_limit_param(self):
        fake_results = [
            type("Loc", (), {"latitude": 6.24, "longitude": -75.57, "address": f"Result {i}"})
            for i in range(3)
        ]
        with patch("apps.maps.services.get_geolocator") as mock_geo:
            instance = mock_geo.return_value
            instance.geocode.return_value = fake_results

            client = APIClient()
            response = client.get(self.url, {"q": "test", "limit": 3})
            assert response.status_code == 200
            assert len(response.json()["results"]) == 3

    def test_geocode_public_no_auth_required(self):
        with patch("apps.maps.services.get_geolocator") as mock_geo:
            instance = mock_geo.return_value
            instance.geocode.return_value = [
                type("Loc", (), {"latitude": 6.24, "longitude": -75.57, "address": "Test"})
            ]
            client = APIClient()
            response = client.get(self.url, {"q": "test"})
            assert response.status_code == 200

    def test_geocode_service_timeout_returns_empty(self):
        with patch("apps.maps.services.get_geolocator") as mock_geo:
            instance = mock_geo.return_value
            from geopy.exc import GeocoderTimedOut
            instance.geocode.side_effect = GeocoderTimedOut("Timeout")

            client = APIClient()
            response = client.get(self.url, {"q": "nonexistent_place_xyz"})
            assert response.status_code == 200
            assert response.json()["results"] == []


class TestReverseGeocodeEndpoint:
    url = reverse("maps-reverse-geocode")

    def test_reverse_geocode_returns_address(self):
        fake_location = type("Loc", (), {
            "latitude": 6.2476,
            "longitude": -75.5658,
            "address": "Cl 10 # 48-50, Medellín, Colombia",
            "raw": {
                "address": {
                    "road": "Cl 10",
                    "neighbourhood": "El Poblado",
                    "suburb": "El Poblado",
                    "city": "Medellín",
                    "state": "Antioquia",
                    "country": "Colombia",
                    "postcode": "050022",
                }
            },
        })
        with patch("apps.maps.services.get_geolocator") as mock_geo:
            instance = mock_geo.return_value
            instance.reverse.return_value = fake_location

            client = APIClient()
            response = client.get(self.url, {"lat": 6.2476, "lng": -75.5658})
            assert response.status_code == 200
            data = response.json()
            assert data["display_name"] == "Cl 10 # 48-50, Medellín, Colombia"
            assert data["address"]["city"] == "Medellín"
            assert data["address"]["state"] == "Antioquia"

    def test_reverse_geocode_missing_params_returns_400(self):
        client = APIClient()
        response = client.get(self.url, {"lat": 6.24})
        assert response.status_code == 400

        response = client.get(self.url, {"lng": -75.57})
        assert response.status_code == 400

    def test_reverse_geocode_no_results_returns_404(self):
        with patch("apps.maps.services.get_geolocator") as mock_geo:
            instance = mock_geo.return_value
            instance.reverse.return_value = None

            client = APIClient()
            response = client.get(self.url, {"lat": 0, "lng": 0})
            assert response.status_code == 404

    def test_reverse_geocode_public_no_auth_required(self):
        with patch("apps.maps.services.get_geolocator") as mock_geo:
            instance = mock_geo.return_value
            instance.reverse.return_value = type("Loc", (), {
                "latitude": 6.24, "longitude": -75.57, "address": "Test",
                "raw": {"address": {"city": "Test"}},
            })
            client = APIClient()
            response = client.get(self.url, {"lat": 6.2477, "lng": -75.5659})
            assert response.status_code == 200

    def test_reverse_geocode_service_timeout_returns_404(self):
        with patch("apps.maps.services.get_geolocator") as mock_geo:
            instance = mock_geo.return_value
            from geopy.exc import GeocoderTimedOut
            instance.reverse.side_effect = GeocoderTimedOut("Timeout")

            client = APIClient()
            response = client.get(self.url, {"lat": 6.2480, "lng": -75.5660})
            assert response.status_code == 404
