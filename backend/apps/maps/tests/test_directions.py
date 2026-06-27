from unittest.mock import patch, PropertyMock
from django.urls import reverse
from django.core.cache import cache
from rest_framework.test import APIClient


class TestDirectionsEndpoint:
    url = reverse("maps-directions")

    def test_directions_requires_auth(self):
        client = APIClient()
        response = client.get(
            self.url,
            {"origin_lat": 6.2476, "origin_lng": -75.5658,
             "destination_lat": 6.2500, "destination_lng": -75.5600},
        )
        assert response.status_code == 401

    def test_directions_returns_route(self, domiciliario_client):
        fake_route = {
            "distance_km": 2.5,
            "duration_min": 10.0,
            "polyline": {"points": "abc123"},
            "legs": [
                {
                    "distance_km": 2.5,
                    "duration_min": 10.0,
                    "summary": "Via Principal",
                    "steps": [],
                }
            ],
        }
        with patch("apps.maps.views.get_route", return_value=fake_route):
            response = domiciliario_client.get(
                self.url,
                {"origin_lat": 6.2476, "origin_lng": -75.5658,
                 "destination_lat": 6.2500, "destination_lng": -75.5600},
            )
        assert response.status_code == 200
        data = response.json()
        assert data["distance_km"] == 2.5
        assert data["duration_min"] == 10.0
        assert "legs" in data

    def test_directions_with_waypoint(self, domiciliario_client):
        fake_route = {
            "distance_km": 3.0,
            "duration_min": 15.0,
            "polyline": {"points": "def456"},
            "legs": [],
        }
        with patch("apps.maps.views.get_route", return_value=fake_route):
            response = domiciliario_client.get(
                self.url,
                {"origin_lat": 6.2476, "origin_lng": -75.5658,
                 "destination_lat": 6.2500, "destination_lng": -75.5600,
                 "waypoint_lat": 6.2485, "waypoint_lng": -75.5630},
            )
        assert response.status_code == 200

    def test_directions_missing_params_returns_400(self, domiciliario_client):
        response = domiciliario_client.get(self.url, {"origin_lat": 6.2476})
        assert response.status_code == 400

    def test_directions_no_route_returns_502(self, domiciliario_client):
        with patch("apps.maps.views.get_route", return_value=None):
            response = domiciliario_client.get(
                self.url,
                {"origin_lat": 6.2476, "origin_lng": -75.5658,
                 "destination_lat": 6.2500, "destination_lng": -75.5600},
            )
        assert response.status_code == 502


# ─── Fallback tests (Google ↔ Nominatim) ────────────────────────────────────


class TestGeocodingFallback:
    def test_google_used_when_key_present(self):
        from apps.maps import services
        with patch.object(services.settings, "GOOGLE_MAPS_API_KEY", "fake_key"):
            services._has_google_key = True
            services._geolocator = None
            geolocator = services.get_geolocator()
            assert "GoogleV3" in type(geolocator).__name__
        services._has_google_key = False
        services._geolocator = None

    def test_nominatim_used_when_no_key(self):
        from apps.maps import services
        services._has_google_key = False
        services._geolocator = None
        geolocator = services.get_geolocator()
        assert "Nominatim" in type(geolocator).__name__

    def test_geolocator_is_cached(self):
        from apps.maps import services
        services._has_google_key = False
        services._geolocator = None
        g1 = services.get_geolocator()
        g2 = services.get_geolocator()
        assert g1 is g2

    def test_google_v3_results_limited_correctly(self):
        from apps.maps.services import geocode
        from geopy.geocoders import GoogleV3
        results_mock = [
            type("Loc", (), {"latitude": 6.24, "longitude": -75.57, "address": f"R{i}"})
            for i in range(10)
        ]
        real_geolocator = GoogleV3(api_key="fake")
        with patch("apps.maps.services.get_geolocator") as mock_geo:
            instance = mock_geo.return_value
            instance.geocode.return_value = results_mock
            with patch.object(instance, "__class__", real_geolocator.__class__):
                with patch("apps.maps.services._has_google_key", True):
                    data = geocode("test query", limit=3)
        assert len(data) == 3


# ─── Cache behavior tests ───────────────────────────────────────────────────


class TestGeocodeCache:
    def test_geocode_result_is_cached(self):
        fake_results = [
            type("Loc", (), {
                "latitude": 10.9878, "longitude": -74.8069,
                "address": "Cra 45, Barranquilla, Colombia",
            }),
        ]
        with patch("apps.maps.services.get_geolocator") as mock_geo:
            instance = mock_geo.return_value
            instance.geocode.return_value = fake_results

            client = APIClient()
            url = reverse("maps-geocode")

            response1 = client.get(url, {"q": "Cra 45 Barranquilla"})
            assert response1.status_code == 200

            instance.geocode.return_value = []
            response2 = client.get(url, {"q": "Cra 45 Barranquilla"})
            assert response2.status_code == 200
            assert len(response2.json()["results"]) == 1

    def test_geocode_uses_cache_key_with_normalized_query(self):
        from apps.maps.services import geocode
        fake_results = [
            type("Loc", (), {
                "latitude": 4.6547, "longitude": -74.0932,
                "address": "Av El Dorado, Bogot\u00e1",
            }),
        ]
        with patch("apps.maps.services.get_geolocator") as mock_geo:
            instance = mock_geo.return_value
            instance.geocode.return_value = fake_results

            geocode("Bogot\u00e1")
            instance.geocode.return_value = []

            result = geocode("  bogot\u00e1  ")
            assert len(result) == 1

    def test_reverse_geocode_result_is_cached(self):
        fake_location = type("Loc", (), {
            "latitude": 4.7110,
            "longitude": -74.0721,
            "address": "Cra 7 # 32-10, Bogot\u00e1",
            "raw": {"address": {"city": "Bogot\u00e1", "state": "Cundinamarca",
                                "country": "Colombia", "road": "Cra 7"}},
        })
        with patch("apps.maps.services.get_geolocator") as mock_geo:
            instance = mock_geo.return_value
            instance.reverse.return_value = fake_location

            client = APIClient()
            url = reverse("maps-reverse-geocode")

            response1 = client.get(url, {"lat": 4.7110, "lng": -74.0721})
            assert response1.status_code == 200

            instance.reverse.return_value = None
            response2 = client.get(url, {"lat": 4.7110, "lng": -74.0721})
            assert response2.status_code == 200

    def test_cache_keys_use_correct_prefix(self):
        from apps.maps.services import reverse_geocode
        fake_location = type("Loc", (), {
            "latitude": 3.4516,
            "longitude": -76.5320,
            "address": "Test Cali",
            "raw": {"address": {"city": "Cali"}},
        })
        with patch("apps.maps.services.get_geolocator") as mock_geo:
            instance = mock_geo.return_value
            instance.reverse.return_value = fake_location

            reverse_geocode(3.4516, -76.5320)
            from django.core.cache import cache
            cached = cache.get("reverse:3.45160:-76.53200")
            assert cached is not None
            assert cached["lat"] == 3.4516
