import pytest
from unittest.mock import patch


@pytest.mark.django_db
def test_debug_location_field():
    from apps.stores.models import Store
    from django.contrib.gis.geos import Point

    location_field = Store._meta.get_field("location")
    print(f"\n=== Location Field ===")
    print(f"Field class: {type(location_field)}")
    print(f"Field class name: {type(location_field).__name__}")
    print(f"Field class module: {type(location_field).__module__}")
    print(f"Field class bases: {type(location_field).__bases__}")
    print(f"Field class MRO: {[c.__name__ for c in type(location_field).__mro__]}")

    # Test get_db_prep_save
    p = Point(-75.5658, 6.2476, srid=4326)
    print(f"\nPoint: {p}, type: {type(p)}")

    from django.db import connection
    result = location_field.get_db_prep_save(p, connection=connection)
    print(f"get_db_prep_save result: {result!r}, type: {type(result)}")

    location_field2 = Store._meta.get_field("location")
    print(f"\nhas get_db_prep_value: {hasattr(location_field2, 'get_db_prep_value')}")

    for cls in type(location_field2).__mro__:
        if 'get_db_prep_value' in cls.__dict__:
            print(f"  defined in: {cls}")
