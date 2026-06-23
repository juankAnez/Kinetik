from django.contrib import admin
from .models import PaymentMethod, Transaction, Wallet

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ["user", "method_type", "last_four", "is_default"]

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ["order", "amount", "gateway", "status", "payment_method", "created_at"]
    list_filter = ["status", "gateway", "payment_method"]

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ["user", "balance", "blocked_balance", "last_payout_at"]
