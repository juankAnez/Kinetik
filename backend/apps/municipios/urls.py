from rest_framework.routers import DefaultRouter
from .views import MunicipioViewSet

router = DefaultRouter()
router.register("", MunicipioViewSet, basename="municipio")
urlpatterns = router.urls
