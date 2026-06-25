from django.urls import reverse
from apps.notifications.models import Notification


class TestNotificationList:
    def test_list_notifications(self, cliente_client, cliente_user):
        Notification.objects.create(user=cliente_user, type="SYSTEM", title="Test", body="Body")
        Notification.objects.create(user=cliente_user, type="ORDER_UPDATE", title="Order", body="Updated")
        url = reverse("notification-list")
        response = cliente_client.get(url)
        assert response.status_code == 200
        assert len(response.data["results"]) == 2

    def test_list_notifications_other_users_not_shown(self, cliente_client, cliente_user, comercio_user):
        Notification.objects.create(user=comercio_user, type="SYSTEM", title="Other", body="Not mine")
        Notification.objects.create(user=cliente_user, type="SYSTEM", title="Mine", body="Mine")
        url = reverse("notification-list")
        response = cliente_client.get(url)
        assert response.status_code == 200
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["title"] == "Mine"

    def test_notification_unauthorized(self, api_client):
        url = reverse("notification-list")
        response = api_client.get(url)
        assert response.status_code == 401


class TestMarkRead:
    def test_mark_read_all(self, cliente_client, cliente_user):
        for i in range(3):
            Notification.objects.create(user=cliente_user, type="SYSTEM", title=f"N{i}", body="B")
        url = reverse("notification-mark-read")
        response = cliente_client.post(url)
        assert response.status_code == 200
        assert response.data == {"status": "ok"}
        assert Notification.objects.filter(user=cliente_user, is_read=True).count() == 3

    def test_mark_read_others_unaffected(self, cliente_client, cliente_user, comercio_user):
        Notification.objects.create(user=cliente_user, type="SYSTEM", title="Mine", body="B")
        Notification.objects.create(user=comercio_user, type="SYSTEM", title="Theirs", body="B")
        url = reverse("notification-mark-read")
        cliente_client.post(url)
        assert Notification.objects.get(user=comercio_user).is_read is False


class TestUnreadCount:
    def test_unread_count_returns_correct(self, cliente_client, cliente_user):
        Notification.objects.create(user=cliente_user, type="SYSTEM", title="Unread", body="B")
        Notification.objects.create(user=cliente_user, type="SYSTEM", title="Read", body="B", is_read=True)
        url = reverse("notification-unread-count")
        response = cliente_client.get(url)
        assert response.status_code == 200
        assert response.data["unread_count"] == 1

    def test_unread_count_zero(self, cliente_client, cliente_user):
        Notification.objects.create(user=cliente_user, type="SYSTEM", title="Read", body="B", is_read=True)
        url = reverse("notification-unread-count")
        response = cliente_client.get(url)
        assert response.status_code == 200
        assert response.data["unread_count"] == 0
