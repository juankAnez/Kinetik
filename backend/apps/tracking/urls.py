from rest_framework.routers import DefaultRouter
from .views import TrackingViewSet, RouteViewSet

router = DefaultRouter()
router.register("points", TrackingViewSet, basename="tracking")
router.register("routes", RouteViewSet, basename="route")
urlpatterns = router.urls
