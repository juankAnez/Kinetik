from rest_framework.routers import DefaultRouter
from .views import (
    AnalyticsViewSet, DailySalesReportViewSet,
    CourierPerformanceViewSet, MunicipioStatsViewSet,
)

router = DefaultRouter()
router.register("dashboard", AnalyticsViewSet, basename="analytics-dashboard")
router.register("daily-sales", DailySalesReportViewSet, basename="daily-sales")
router.register("courier-performance", CourierPerformanceViewSet, basename="courier-performance")
router.register("municipio-stats", MunicipioStatsViewSet, basename="municipio-stats")
urlpatterns = router.urls
