from django.utils import timezone
from django.db import transaction
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from apps.orders.models import Order
from apps.users.models import User
from .models import AssignmentLog


class AssignmentService:

    def batch_assign_pending_orders(self, municipio_id=None):
        filters = {
            "status": Order.Status.READY,
            "assigned_at__isnull": True,
        }
        if municipio_id:
            filters["municipio_id"] = municipio_id

        pending_orders = Order.objects.filter(**filters).select_related(
            "store"
        ).order_by("created_at")[:20]

        for order in pending_orders:
            self._assign_single_order(order)

    def _assign_single_order_by_id(self, order_id):
        try:
            order = Order.objects.select_related("store").get(id=order_id)
            self._assign_single_order(order)
        except Order.DoesNotExist:
            pass

    def _assign_single_order(self, order):
        loc = order.store.location
        if isinstance(loc, str):
            coords = loc.replace("POINT (", "").replace(")", "").split()
            lng, lat = float(coords[0]), float(coords[1])
        else:
            lng, lat = loc.x, loc.y
        store_location = Point(lng, lat, srid=4326)
        radius = 5

        courier, score = self._find_best_courier(store_location, radius)

        if not courier and (timezone.now() - order.created_at).seconds > 30:
            radius = 8
            courier, score = self._find_best_courier(store_location, radius)

        if not courier:
            return

        with transaction.atomic():
            updated = Order.objects.filter(
                id=order.id,
                status=Order.Status.READY,
            ).update(
                courier=courier,
                status=Order.Status.ASSIGNED,
                assigned_at=timezone.now(),
            )

            if updated:
                profile = courier.courier_profile
                profile.current_order_count += 1
                profile.save(update_fields=["current_order_count"])

                AssignmentLog.objects.create(
                    order=order,
                    courier=courier,
                    score=score,
                    radius_used=radius,
                )
                self._trigger_assignment_event(order.id, courier.id)

    def _find_best_courier(self, store_location, radius_km):
        couriers_qs = User.objects.filter(
            user_type="DOMICILIARIO",
            is_available=True,
            courier_profile__current_order_count__lt=2,
            courier_profile__last_location__distance_lte=(
                store_location, D(km=radius_km)
            ),
            courier_profile__blocked_until__isnull=True,
        ).annotate(
            distance=Distance("courier_profile__last_location", store_location)
        ).select_related("courier_profile")

        best_courier = None
        best_score = -1.0

        for courier in couriers_qs:
            profile = courier.courier_profile
            dist_km = courier.distance.km if hasattr(courier, "distance") else 999

            score = 0.0
            score += (1 - dist_km / radius_km) * 40
            score += (profile.avg_rating / 5) * 20
            score += (2 - profile.current_order_count) * 10
            score += min(profile.idle_minutes / 10, 10)
            score += (profile.completion_rate or 0.9) * 10

            if score > best_score:
                best_score = score
                best_courier = courier

        return best_courier, best_score if best_courier else 0.0

    def _trigger_assignment_event(self, order_id, courier_id):
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"order_{order_id}",
            {
                "type": "order.assigned",
                "order_id": order_id,
                "courier_id": courier_id,
            },
        )
