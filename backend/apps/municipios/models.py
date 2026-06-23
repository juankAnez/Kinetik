from django.db import models

class Municipio(models.Model):
    codigo_dane = models.CharField("Código DANE", max_length=10, unique=True)
    nombre = models.CharField("Nombre", max_length=100)
    centro_lat = models.FloatField("Latitud centro")
    centro_lng = models.FloatField("Longitud centro")
    radio_km = models.FloatField("Radio de cobertura (km)", default=10)
    activo = models.BooleanField("Activo", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Municipio"
        verbose_name_plural = "Municipios"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre
