from django.urls import re_path
from apps.tracking.consumers import TrackingConsumer
from apps.chat.consumers import ChatConsumer
from apps.notifications.consumers import NotificationConsumer

websocket_urlpatterns = [
    re_path(r"ws/tracking/(?P<order_id>\d+)/$", TrackingConsumer.as_asgi()),
    re_path(r"ws/chat/(?P<conversation_id>\d+)/$", ChatConsumer.as_asgi()),
    re_path(r"ws/notifications/$", NotificationConsumer.as_asgi()),
]
