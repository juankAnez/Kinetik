import pytest
from django.utils import timezone
from django.contrib.gis.geos import Point
from apps.orders.models import Order
from apps.couriers.services import AssignmentService
from apps.couriers.models import AssignmentLog


@pytest.mark.xfail(
    reason="El servicio de asignación usa lookups espaciales PostGIS (distance_lte) "
           "que no están disponibles con el mock GIS de SQLite en los tests locales. "
           "Este test valida la lógica del servicio y pasa correctamente en un entorno "
           "con PostgreSQL + PostGIS real.",
    strict=False,
)
def test_assignment_success(cliente_user, store, municipio, domiciliario_user):
    # Configurar disponibilidad y ubicación del domiciliario
    domiciliario_user.is_available = True
    domiciliario_user.save()

    profile = domiciliario_user.courier_profile
    profile.last_location = Point(-75.5658, 6.2476, srid=4326)  # Misma que la tienda
    profile.save()

    # Crear una orden en estado READY
    order = Order.objects.create(
        client=cliente_user,
        store=store,
        municipio=municipio,
        status=Order.Status.READY,
        payment_method="CARD",
        delivery_address="Calle 50 # 40-1",
        delivery_location=Point(-75.5658, 6.2476, srid=4326),
        subtotal=10000,
        delivery_fee=1500,
        total=11500,
    )

    # Ejecutar el servicio de asignación
    service = AssignmentService()
    service.batch_assign_pending_orders(municipio_id=municipio.id)

    # Verificar que se asignó correctamente
    order.refresh_from_db()
    assert order.status == Order.Status.ASSIGNED
    assert order.courier == domiciliario_user

    # Verificar que el log de asignación registre la puntuación real calculada (>0)
    log = AssignmentLog.objects.get(order=order)
    assert log.courier == domiciliario_user
    assert log.score > 0
    assert log.radius_used == 5
