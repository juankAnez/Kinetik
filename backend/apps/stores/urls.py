from rest_framework.routers import DefaultRouter
from .views import StoreViewSet, AddressViewSet, StoreCategoryViewSet

router = DefaultRouter()
router.register("categories", StoreCategoryViewSet, basename="store-category")
router.register("", StoreViewSet, basename="store")
router.register("addresses", AddressViewSet, basename="address")
urlpatterns = router.urls
