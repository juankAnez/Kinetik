from rest_framework.routers import DefaultRouter
from .views import TrackingViewSet

router = DefaultRouter()
router.register("", TrackingViewSet, basename="tracking")
urlpatterns = router.urls
