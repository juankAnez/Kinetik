from rest_framework import serializers
from .models import DailySalesReport, CourierPerformance, MunicipioStats


class DailySalesReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailySalesReport
        fields = "__all__"


class CourierPerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourierPerformance
        fields = "__all__"


class MunicipioStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MunicipioStats
        fields = "__all__"
