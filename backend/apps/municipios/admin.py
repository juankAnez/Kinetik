from django.contrib import admin
from .models import Municipio

@admin.register(Municipio)
class MunicipioAdmin(admin.ModelAdmin):
    list_display = ["nombre", "codigo_dane", "activo", "radio_km"]
    list_filter = ["activo"]
    search_fields = ["nombre", "codigo_dane"]
