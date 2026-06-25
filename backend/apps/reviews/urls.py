from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ReviewViewSet, DisputeViewSet

router = DefaultRouter()
router.register("disputes", DisputeViewSet, basename="dispute")

urlpatterns = [
    path("", ReviewViewSet.as_view({"get": "list", "post": "create"}), name="review-list"),
    path("<int:pk>/", ReviewViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}), name="review-detail"),
] + router.urls
