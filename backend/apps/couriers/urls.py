from rest_framework.routers import DefaultRouter
from .views import CourierViewSet, CourierLocationViewSet, CourierStatusViewSet

router = DefaultRouter()
router.register("locations", CourierLocationViewSet, basename="courier-location")
router.register("statuses", CourierStatusViewSet, basename="courier-status")
router.register("", CourierViewSet, basename="courier")
urlpatterns = router.urls
