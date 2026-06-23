import pytest_gis_patch  # noqa: F401
import pytest
from rest_framework.test import APIClient
from django.contrib.gis.geos import Point
from apps.municipios.models import Municipio
from apps.users.models import User, ClientProfile, CourierProfile
from apps.stores.models import Store, StoreCategory
from apps.products.models import Product, ProductCategory


@pytest.fixture(autouse=True)
def enable_db_access(db):
    pass


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def municipio():
    return Municipio.objects.create(
        codigo_dane="05001",
        nombre="Medellín",
        centro_lat=6.2476,
        centro_lng=-75.5658,
        radio_km=10,
        activo=True,
    )


@pytest.fixture
def store_category():
    return StoreCategory.objects.create(name="Restaurante")


@pytest.fixture
def cliente_user(municipio):
    user = User.objects.create_user(
        username="cliente",
        email="cliente@test.com",
        password="testpass123",
        phone="3001111111",
        user_type="CLIENTE",
        municipio=municipio,
    )
    ClientProfile.objects.create(user=user)
    return user


@pytest.fixture
def comercio_user(municipio):
    user = User.objects.create_user(
        username="comercio",
        email="comercio@test.com",
        password="testpass123",
        phone="3002222222",
        user_type="COMERCIO",
        municipio=municipio,
    )
    return user


@pytest.fixture
def domiciliario_user(municipio):
    user = User.objects.create_user(
        username="domiciliario",
        email="domiciliario@test.com",
        password="testpass123",
        phone="3003333333",
        user_type="DOMICILIARIO",
        municipio=municipio,
    )
    CourierProfile.objects.create(
        user=user,
        license_number="LIC001",
        vehicle_type="MOTO",
        id_document="CC123456",
    )
    return user


@pytest.fixture
def admin_user(municipio):
    return User.objects.create_superuser(
        username="admin",
        email="admin@test.com",
        password="testpass123",
        phone="3004444444",
        municipio=municipio,
    )


@pytest.fixture
def store(comercio_user, municipio, store_category):
    store = Store.objects.create(
        name="Tienda Test",
        slug="tienda-test",
        category=store_category,
        municipio=municipio,
        location=Point(-75.5658, 6.2476, srid=4326),
        address="Calle 50 # 40-1",
        phone="3005555555",
        is_active=True,
        is_open=True,
    )
    from apps.users.models import CommerceProfile
    CommerceProfile.objects.create(user=comercio_user, store=store)
    return store


@pytest.fixture
def product_category(store):
    return ProductCategory.objects.create(store=store, name="Bebidas")


@pytest.fixture
def product(store, product_category):
    return Product.objects.create(
        store=store,
        category=product_category,
        name="Gaseosa",
        price=5000,
        is_available=True,
    )


@pytest.fixture
def cliente_client(cliente_user):
    client = APIClient()
    client.force_authenticate(user=cliente_user)
    return client


@pytest.fixture
def comercio_client(comercio_user):
    client = APIClient()
    client.force_authenticate(user=comercio_user)
    return client


@pytest.fixture
def domiciliario_client(domiciliario_user):
    client = APIClient()
    client.force_authenticate(user=domiciliario_user)
    return client


@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client
