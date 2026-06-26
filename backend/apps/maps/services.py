import json, urllib.request, urllib.error, urllib.parse
from django.core.cache import cache
from django.conf import settings
from geopy.geocoders import Nominatim, GoogleV3
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

NOMINATIM_USER_AGENT = "Kinetik/1.0"
GEOCODE_CACHE_TTL = 86400
REVERSE_CACHE_TTL = 86400
ROUTE_CACHE_TTL = 300

OSRM_BASE_URL = "https://router.project-osrm.org"
GOOGLE_DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json"

_has_google_key = bool(settings.GOOGLE_MAPS_API_KEY)

_geolocator = None

def get_geolocator():
    global _geolocator
    if _geolocator is None:
        if _has_google_key:
            _geolocator = GoogleV3(api_key=settings.GOOGLE_MAPS_API_KEY)
        else:
            _geolocator = Nominatim(user_agent=NOMINATIM_USER_AGENT)
    return _geolocator


def geocode(query: str, limit: int = 5) -> list[dict]:
    cache_key = f"geocode:{query.lower().strip()}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    geolocator = get_geolocator()
    try:
        if isinstance(geolocator, GoogleV3):
            results = geolocator.geocode(query, exactly_one=False)
        else:
            results = geolocator.geocode(query, exactly_one=False, limit=limit)
    except (GeocoderTimedOut, GeocoderServiceError):
        return []

    if not results:
        return []

    if isinstance(geolocator, GoogleV3):
        results = results[:limit]

    data = []
    for r in results:
        data.append({
            "lat": r.latitude,
            "lng": r.longitude,
            "display_name": r.address,
        })

    cache.set(cache_key, data, GEOCODE_CACHE_TTL)
    return data


def reverse_geocode(lat: float, lng: float) -> dict | None:
    cache_key = f"reverse:{lat:.5f}:{lng:.5f}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    geolocator = get_geolocator()
    try:
        location = geolocator.reverse(f"{lat}, {lng}", exactly_one=True)
    except (GeocoderTimedOut, GeocoderServiceError):
        return None

    if location is None:
        return None

    raw = location.raw or {}
    address_raw = raw.get("address", {})

    if _has_google_key:
        address = _parse_google_address(address_raw)
    else:
        address = _parse_nominatim_address(address_raw)

    data = {
        "display_name": location.address,
        "lat": location.latitude,
        "lng": location.longitude,
        "address": address,
    }

    cache.set(cache_key, data, REVERSE_CACHE_TTL)
    return data


def get_route(
    origin_lat: float, origin_lng: float,
    destination_lat: float, destination_lng: float,
    waypoint_lat: float = None, waypoint_lng: float = None,
) -> dict | None:
    coords = f"{origin_lat:.5f},{origin_lng:.5f}-{destination_lat:.5f},{destination_lng:.5f}"
    if waypoint_lat is not None and waypoint_lng is not None:
        coords = f"{origin_lat:.5f},{origin_lng:.5f}-{waypoint_lat:.5f},{waypoint_lng:.5f}-{destination_lat:.5f},{destination_lng:.5f}"

    cache_key = f"route:{coords}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    if _has_google_key:
        result = _google_directions(origin_lat, origin_lng, destination_lat, destination_lng, waypoint_lat, waypoint_lng)
    else:
        result = _osrm_route(origin_lat, origin_lng, destination_lat, destination_lng, waypoint_lat, waypoint_lng)

    if result:
        cache.set(cache_key, result, ROUTE_CACHE_TTL)
    return result


def _google_directions(origin_lat, origin_lng, dest_lat, dest_lng, wp_lat=None, wp_lng=None):
    origin = f"{origin_lat},{origin_lng}"
    dest = f"{dest_lat},{dest_lng}"
    waypoints = f"via:{wp_lat},{wp_lng}" if wp_lat is not None and wp_lng is not None else ""

    params = {
        "origin": origin,
        "destination": dest,
        "key": settings.GOOGLE_MAPS_API_KEY,
        "mode": "driving",
        "alternatives": "false",
        "units": "metric",
    }
    if waypoints:
        params["waypoints"] = waypoints

    url = f"{GOOGLE_DIRECTIONS_URL}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": NOMINATIM_USER_AGENT})

    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = json.loads(resp.read().decode())
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError):
        return None

    if body.get("status") != "OK" or not body.get("routes"):
        return None

    route = body["routes"][0]
    legs = route.get("legs", [])

    return {
        "distance_km": round(sum(leg["distance"]["value"] for leg in legs) / 1000, 2),
        "duration_min": round(sum(leg["duration"]["value"] for leg in legs) / 60, 1),
        "polyline": route.get("overview_polyline", {}),
        "legs": [
            {
                "distance_km": round(leg["distance"]["value"] / 1000, 2),
                "duration_min": round(leg["duration"]["value"] / 60, 1),
                "summary": leg.get("summary", ""),
                "steps": [
                    {
                        "instruction": step.get("html_instructions", ""),
                        "distance_km": round(step["distance"]["value"] / 1000, 2),
                        "duration_min": round(step["duration"]["value"] / 60, 1),
                    }
                    for step in leg.get("steps", [])
                ],
            }
            for leg in legs
        ],
    }


def _osrm_route(origin_lat, origin_lng, dest_lat, dest_lng, wp_lat=None, wp_lng=None):
    coords = f"{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
    if wp_lat is not None and wp_lng is not None:
        coords = f"{origin_lng},{origin_lat};{wp_lng},{wp_lat};{dest_lng},{dest_lat}"

    url = (
        f"{OSRM_BASE_URL}/route/v1/driving/{coords}"
        f"?overview=full&geometries=geojson&steps=true&alternatives=false"
    )
    req = urllib.request.Request(url, headers={"User-Agent": NOMINATIM_USER_AGENT})

    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = json.loads(resp.read().decode())
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError):
        return None

    if body.get("code") != "Ok" or not body.get("routes"):
        return None

    route = body["routes"][0]
    legs = route.get("legs", [])
    geometry = route.get("geometry", {})

    return {
        "distance_km": round(route["distance"] / 1000, 2),
        "duration_min": round(route["duration"] / 60, 1),
        "polyline": geometry,
        "legs": [
            {
                "distance_km": round(leg["distance"] / 1000, 2),
                "duration_min": round(leg["duration"] / 60, 1),
                "summary": leg.get("summary", ""),
                "steps": [
                    {
                        "instruction": step.get("maneuver", {}).get("instruction", ""),
                        "distance_km": round(step["distance"] / 1000, 2),
                        "duration_min": round(step["duration"] / 60, 1),
                    }
                    for step in leg.get("steps", [])
                ],
            }
            for leg in legs
        ],
    }


def _parse_google_address(raw: dict) -> dict:
    def _get(component_types):
        for t in component_types if isinstance(component_types, list) else [component_types]:
            for c in raw.get("address_components", []):
                if t in c.get("types", []):
                    return c.get("long_name", "")
        return ""

    return {
        "road": _get("route"),
        "neighbourhood": _get("neighborhood"),
        "suburb": _get("sublocality"),
        "city": _get(["locality", "administrative_area_level_2", "administrative_area_level_3"]),
        "state": _get("administrative_area_level_1"),
        "country": _get("country"),
        "postcode": _get("postal_code"),
    }


def _parse_nominatim_address(raw: dict) -> dict:
    return {
        "road": raw.get("road", ""),
        "neighbourhood": raw.get("neighbourhood", ""),
        "suburb": raw.get("suburb", ""),
        "city": (
            raw.get("city")
            or raw.get("town")
            or raw.get("village")
            or raw.get("municipality")
            or ""
        ),
        "state": raw.get("state", ""),
        "country": raw.get("country", ""),
        "postcode": raw.get("postcode", ""),
    }
