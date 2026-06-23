from rest_framework.routers import DefaultRouter
from .views import StoreViewSet, AddressViewSet

router = DefaultRouter()
router.register("", StoreViewSet, basename="store")
router.register("addresses", AddressViewSet, basename="address")
urlpatterns = router.urls
