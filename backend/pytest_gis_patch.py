import sys
from types import ModuleType
from unittest.mock import MagicMock


class FakePoint(str):
    def __new__(cls, x, y, srid=None, **kwargs):
        wkt = f"POINT ({x} {y})"
        instance = super().__new__(cls, wkt)
        instance.x = x
        instance.y = y
        instance.srid = srid
        instance._wkt = wkt
        return instance

    def __eq__(self, other):
        if isinstance(other, FakePoint):
            return self.x == other.x and self.y == other.y
        return NotImplemented

    def __repr__(self):
        return f"FakePoint({self.x}, {self.y}, srid={self.srid})"

    def __reduce__(self):
        return (self.__class__, (self.x, self.y, self.srid))

    def hex(self):
        return self._wkt

    @property
    def wkt(self):
        return self._wkt

    def coords(self):
        return (self.x, self.y)

    def tuple(self):
        return (self.x, self.y)


def _make_module(name, attrs=None):
    mod = ModuleType(name)
    mod.__package__ = ".".join(name.split(".")[:-1]) if "." in name else ""
    if attrs:
        for k, v in attrs.items():
            setattr(mod, k, v)
    return mod


def patch_gis():
    if sys.modules.get("_kinetik_gis_patched"):
        return
    sys.modules["_kinetik_gis_patched"] = True

    from django.db import models

    class FakeSpatialField(models.Field):
        description = "Fake spatial field"
        def __init__(self, *args, **kwargs):
            for k in ("srid", "dim", "geography", "spatial_index"):
                kwargs.pop(k, None)
            super().__init__(*args, **kwargs)
        def db_type(self, connection):
            return "text"
        def rel_db_type(self, connection):
            return "text"
        def get_internal_type(self):
            return "TextField"
        def get_db_prep_save(self, value, connection):
            return self.get_db_prep_value(value, connection=connection)

    class FakeDistance:
        pass

    # Build all fake modules upfront
    modules = {
        "django.contrib.gis.gdal": MagicMock(),
        "django.contrib.gis.gdal.libgdal": MagicMock(),
        "django.contrib.gis.gdal.prototypes": MagicMock(),
        "django.contrib.gis.gdal.prototypes.ds": MagicMock(),
        "django.contrib.gis.gdal.driver": MagicMock(),
        "django.contrib.gis.gdal.envelope": MagicMock(),
        "django.contrib.gis.gdal.geometries": MagicMock(),
        "django.contrib.gis.gdal.srs": MagicMock(),
        "django.contrib.gis.gdal.raster": MagicMock(),
        "django.contrib.gis.gdal.feature": MagicMock(),
        "django.contrib.gis.gdal.field": MagicMock(),
        "django.contrib.gis.gdal.layer": MagicMock(),
        "django.contrib.gis.forms": MagicMock(),
        "django.contrib.gis.forms.fields": MagicMock(),
        "django.contrib.gis.forms.widgets": MagicMock(),
        "django.contrib.gis.geos": _make_module("django.contrib.gis.geos", {"Point": FakePoint, "GEOSGeometry": MagicMock()}),
        "django.contrib.gis.geos.libgeos": _make_module("django.contrib.gis.geos.libgeos"),
        "django.contrib.gis.geos.prototypes": _make_module("django.contrib.gis.geos.prototypes"),
        "django.contrib.gis.geos.prototypes.io": _make_module("django.contrib.gis.geos.prototypes.io"),
        "django.contrib.gis.geos.geometry": _make_module("django.contrib.gis.geos.geometry"),
        "django.contrib.gis.geos.collections": _make_module("django.contrib.gis.geos.collections"),
        "django.contrib.gis.geos.point": _make_module("django.contrib.gis.geos.point"),
        "django.contrib.gis.geos.error": _make_module("django.contrib.gis.geos.error"),
        "django.contrib.gis.db.models.fields": _make_module(
            "django.contrib.gis.db.models.fields",
            {"PointField": FakeSpatialField, "GeometryField": FakeSpatialField, "BaseSpatialField": type("BaseSpatialField", (models.Field,), {})},
        ),
        "django.contrib.gis.db.models.functions": _make_module(
            "django.contrib.gis.db.models.functions",
            {"Distance": FakeDistance, "Transform": type("Transform", (), {})},
        ),
        "django.contrib.gis.db.models.lookups": _make_module("django.contrib.gis.db.models.lookups"),
        "django.contrib.gis.db.models.aggregates": _make_module("django.contrib.gis.db.models.aggregates"),
    }

    for mod_name, mod_obj in modules.items():
        sys.modules[mod_name] = mod_obj

    import django.contrib.gis.db.models as gis_mod
    gis_mod.fields = modules["django.contrib.gis.db.models.fields"]
    gis_mod.functions = modules["django.contrib.gis.db.models.functions"]
    gis_mod.lookups = modules["django.contrib.gis.db.models.lookups"]
    gis_mod.aggregates = modules["django.contrib.gis.db.models.aggregates"]
    for _name in (
        "GeometryField", "PointField", "LineStringField", "PolygonField",
        "MultiPointField", "MultiLineStringField", "MultiPolygonField",
        "GeometryCollectionField", "RasterField", "BaseSpatialField",
    ):
        setattr(gis_mod, _name, getattr(gis_mod.fields, _name, FakeSpatialField))


patch_gis()
