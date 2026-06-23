from django.urls import reverse


class TestRegister:
    def test_register_cliente_success(self, api_client, municipio):
        data = {
            "username": "nuevocliente",
            "email": "nuevo@test.com",
            "password": "strongpass123",
            "phone": "3009999999",
            "first_name": "Nuevo",
            "last_name": "Cliente",
            "user_type": "CLIENTE",
            "municipio": municipio.id,
        }
        url = reverse("register")
        response = api_client.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["username"] == "nuevocliente"

    def test_register_short_password_fails(self, api_client, municipio):
        data = {
            "username": "malpass",
            "email": "mal@test.com",
            "password": "123",
            "phone": "3008888888",
            "user_type": "CLIENTE",
            "municipio": municipio.id,
        }
        url = reverse("register")
        response = api_client.post(url, data, format="json")
        assert response.status_code == 400

    def test_register_duplicate_username_fails(self, api_client, cliente_user, municipio):
        data = {
            "username": "cliente",
            "email": "otro@test.com",
            "password": "strongpass123",
            "phone": "3007777777",
            "user_type": "CLIENTE",
            "municipio": municipio.id,
        }
        url = reverse("register")
        response = api_client.post(url, data, format="json")
        assert response.status_code == 400

    def test_register_comercio_creates_commerce_profile(self, api_client, municipio):
        data = {
            "username": "nuevocom",
            "email": "nuevocom@test.com",
            "password": "strongpass123",
            "phone": "3006666666",
            "user_type": "COMERCIO",
            "municipio": municipio.id,
        }
        url = reverse("register")
        response = api_client.post(url, data, format="json")
        assert response.status_code == 201
        from apps.users.models import CommerceProfile
        assert CommerceProfile.objects.filter(user__username="nuevocom").exists()

    def test_register_domiciliario_creates_courier_profile(self, api_client, municipio):
        data = {
            "username": "nuevodom",
            "email": "nuevodom@test.com",
            "password": "strongpass123",
            "phone": "3005555555",
            "user_type": "DOMICILIARIO",
            "municipio": municipio.id,
        }
        url = reverse("register")
        response = api_client.post(url, data, format="json")
        assert response.status_code == 201
        from apps.users.models import CourierProfile
        assert CourierProfile.objects.filter(user__username="nuevodom").exists()

    def test_register_without_municipio_fails(self, api_client):
        data = {
            "username": "nomuni",
            "email": "nomuni@test.com",
            "password": "strongpass123",
            "phone": "3004444444",
            "user_type": "CLIENTE",
        }
        url = reverse("register")
        response = api_client.post(url, data, format="json")
        assert response.status_code == 400


class TestLogin:
    def test_login_success(self, api_client, cliente_user):
        url = reverse("token_obtain_pair")
        response = api_client.post(url, {
            "username": "cliente",
            "password": "testpass123",
        }, format="json")
        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_invalid_credentials(self, api_client):
        url = reverse("token_obtain_pair")
        response = api_client.post(url, {
            "username": "noexiste",
            "password": "nopass",
        }, format="json")
        assert response.status_code == 401

    def test_refresh_token(self, api_client, cliente_user):
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(cliente_user)
        url = reverse("token_refresh")
        response = api_client.post(url, {"refresh": str(refresh)}, format="json")
        assert response.status_code == 200
        assert "access" in response.data


class TestProfile:
    def test_get_me_cliente(self, cliente_client, cliente_user):
        url = reverse("user-me")
        response = cliente_client.get(url)
        assert response.status_code == 200
        assert response.data["username"] == "cliente"
        assert "profile" in response.data

    def test_get_me_domiciliario(self, domiciliario_client, domiciliario_user):
        url = reverse("user-me")
        response = domiciliario_client.get(url)
        assert response.status_code == 200
        assert response.data["username"] == "domiciliario"
        assert response.data["profile"]["vehicle_type"] == "MOTO"

    def test_patch_me(self, cliente_client):
        url = reverse("user-me")
        response = cliente_client.patch(url, {"first_name": "Updated"}, format="json")
        assert response.status_code == 200
        assert response.data["first_name"] == "Updated"

    def test_me_unauthenticated_fails(self, api_client):
        url = reverse("user-me")
        response = api_client.get(url)
        assert response.status_code == 401
