from rest_framework.permissions import BasePermission, SAFE_METHODS


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
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_staff


class IsStoreOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return hasattr(obj, "store") and obj.store.commerceprofile.user == request.user


class IsCommerceStoreOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.commerceprofile.user == request.user
