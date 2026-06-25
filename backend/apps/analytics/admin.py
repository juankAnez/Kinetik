from django.contrib import admin
from .models import DailySalesReport, CourierPerformance, MunicipioStats


@admin.register(DailySalesReport)
class DailySalesReportAdmin(admin.ModelAdmin):
    list_display = ["store", "date", "total_orders", "total_revenue", "total_commission"]
    list_filter = ["date"]
    search_fields = ["store__name"]


@admin.register(CourierPerformance)
class CourierPerformanceAdmin(admin.ModelAdmin):
    list_display = ["courier", "date", "total_deliveries", "total_earned"]
    list_filter = ["date"]
    search_fields = ["courier__username"]


@admin.register(MunicipioStats)
class MunicipioStatsAdmin(admin.ModelAdmin):
    list_display = ["municipio", "date", "total_orders", "active_stores", "active_couriers"]
    list_filter = ["date", "municipio"]
