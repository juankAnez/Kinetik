from rest_framework.permissions import BasePermission


class IsCliente(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == "CLIENTE"


class IsComercio(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == "COMERCIO"


class IsDomiciliario(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == "DOMICILIARIO"


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return request.user.is_authenticated
        return request.user.is_staff
