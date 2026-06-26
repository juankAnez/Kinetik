from django.urls import path
from .views import GeocodeView, ReverseGeocodeView, DirectionsView

urlpatterns = [
    path("geocode/", GeocodeView.as_view(), name="maps-geocode"),
    path("reverse-geocode/", ReverseGeocodeView.as_view(), name="maps-reverse-geocode"),
    path("directions/", DirectionsView.as_view(), name="maps-directions"),
]
