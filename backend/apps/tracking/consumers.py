import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.gis.geos import Point
from apps.orders.models import Order
from apps.couriers.models import CourierLocation


class TrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.order_id = self.scope["url_route"]["kwargs"]["order_id"]
        self.order_group = f"order_{self.order_id}"

        if not await self._can_access_order():
            await self.close()
            return

        await self.channel_layer.group_add(self.order_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.order_group, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")

        if action == "update_location" and self.scope["user"].user_type == "DOMICILIARIO":
            lat = data["lat"]
            lng = data["lng"]
            speed = data.get("speed")
            heading = data.get("heading")

            await self._save_location(lat, lng, speed, heading)

            await self.channel_layer.group_send(
                self.order_group,
                {
                    "type": "location_update",
                    "lat": lat,
                    "lng": lng,
                    "speed": speed,
                    "heading": heading,
                },
            )

    async def location_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "location",
            "lat": event["lat"],
            "lng": event["lng"],
            "speed": event.get("speed"),
            "heading": event.get("heading"),
        }))

    async def order_assigned(self, event):
        await self.send(text_data=json.dumps({
            "type": "assigned",
            "order_id": event["order_id"],
            "courier_id": event["courier_id"],
        }))

    @database_sync_to_async
    def _save_location(self, lat, lng, speed, heading):
        user = self.scope["user"]
        point = Point(float(lng), float(lat), srid=4326)
        CourierLocation.objects.create(
            courier=user,
            location=point,
            speed=speed,
            heading=heading,
        )
        user.courier_profile.last_location = point
        user.courier_profile.save(update_fields=["last_location"])

    @database_sync_to_async
    def _can_access_order(self):
        user = self.scope["user"]
        if user.is_anonymous:
            return False
        try:
            order = Order.objects.get(id=self.order_id)
            return (
                order.client == user
                or order.courier == user
                or (hasattr(order.store, "commerceprofile") and order.store.commerceprofile.user == user)
                or user.is_staff
            )
        except Order.DoesNotExist:
            return False
