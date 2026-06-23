from rest_framework.routers import DefaultRouter
from .views import CourierViewSet

router = DefaultRouter()
router.register("", CourierViewSet, basename="courier")
urlpatterns = router.urls
