from rest_framework.routers import DefaultRouter
from .views import PaymentMethodViewSet, TransactionViewSet, PaymentViewSet

router = DefaultRouter()
router.register("methods", PaymentMethodViewSet, basename="payment-method")
router.register("transactions", TransactionViewSet, basename="transaction")
router.register("intent", PaymentViewSet, basename="payment")

urlpatterns = router.urls
