from rest_framework import viewsets, generics
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import User
from .serializers import (
    UserSerializer, RegisterSerializer,
    ClientProfileSerializer, CourierProfileSerializer, CommerceProfileSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_queryset(self):
        return self.queryset.filter(id=self.request.user.id)

    @action(detail=False, methods=["get", "patch"])
    def me(self, request):
        user = request.user
        if request.method == "PATCH":
            serializer = UserSerializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        serializer = UserSerializer(user)
        data = serializer.data

        if hasattr(user, "client_profile"):
            data["profile"] = ClientProfileSerializer(user.client_profile).data
        if hasattr(user, "courier_profile"):
            data["profile"] = CourierProfileSerializer(user.courier_profile).data
        if hasattr(user, "commerce_profile"):
            data["profile"] = CommerceProfileSerializer(user.commerce_profile).data

        return Response(data)
