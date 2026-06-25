from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Sum


@shared_task
def dispatch_order_assignment(order_id):
    """Dispara la asignación de un pedido específico."""
    from apps.couriers.services import AssignmentService
    service = AssignmentService()
    service._assign_single_order_by_id(order_id)


@shared_task
def batch_assign_orders(municipio_id=None):
    """Tarea periódica que asigna pedidos pendientes en lote."""
    from apps.couriers.services import AssignmentService
    service = AssignmentService()
    service.batch_assign_pending_orders(municipio_id)


@shared_task
def send_push_notification(user_id, title, body, data=None):
    """Envía una notificación push a un usuario."""
    from apps.notifications.models import Notification
    Notification.objects.create(
        user_id=user_id,
        type="SYSTEM",
        title=title,
        body=body,
        data=data or {},
    )


@shared_task
def cleanup_expired_sessions():
    """Limpia tokens push inactivos y sesiones expiradas."""
    from django.contrib.sessions.models import Session
    expired = Session.objects.filter(expire_date__lt=timezone.now())
    count = expired.count()
    expired.delete()
    return f"Cleaned {count} expired sessions"


@shared_task
def generate_daily_reports():
    """Genera reportes diarios de ventas y rendimiento."""
    from apps.analytics.models import DailySalesReport
    from apps.orders.models import Order
    from apps.stores.models import Store

    today = timezone.now().date()

    for store in Store.objects.filter(is_active=True):
        orders = Order.objects.filter(
            store=store,
            created_at__date=today,
            status="DELIVERED",
        )
        total = orders.aggregate(
            count=Count("id"),
            revenue=Sum("total"),
            commission=Sum("commission"),
        )

        DailySalesReport.objects.update_or_create(
            store=store,
            date=today,
            defaults={
                "total_orders": total["count"] or 0,
                "total_revenue": total["revenue"] or 0,
                "total_commission": total["commission"] or 0,
                "avg_order_value": (
                    (total["revenue"] or 0) / (total["count"] or 1)
                ),
            },
        )

    return "Daily reports generated"


@shared_task
def courier_heartbeat_check():
    """Marca como no disponibles domiciliarios sin ping por más de 5 minutos."""
    from apps.couriers.models import CourierStatus

    threshold = timezone.now() - timedelta(minutes=5)
    stale = CourierStatus.objects.filter(
        is_online=True,
        last_ping__lt=threshold,
    )
    updated = stale.update(is_online=False)
    return f"Marked {updated} couriers as offline"
