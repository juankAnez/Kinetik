from rest_framework.routers import DefaultRouter
from .views import ReviewViewSet, DisputeViewSet

router = DefaultRouter()
router.register("", ReviewViewSet, basename="review")
router.register("disputes", DisputeViewSet, basename="dispute")
urlpatterns = router.urls
