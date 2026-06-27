import { useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CommerceStackParamList } from "../../../types/navigation";
import { StoresAPI } from "../../../services/api/stores";
import { OrdersAPI } from "../../../services/api/orders";
import { ProductsAPI } from "../../../services/api/products";
import { useAuthStore } from "../../../stores/authStore";

type NavProp = NativeStackNavigationProp<CommerceStackParamList, "CommerceHome">;

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <View className="bg-white rounded-2xl p-4 flex-1 mx-1.5 shadow-sm" style={{ elevation: 1 }}>
      <View className="w-10 h-10 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: `${color}15` }}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text className="text-2xl font-bold text-foreground mb-0.5">{value}</Text>
      <Text className="text-xs text-muted font-medium">{label}</Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  color = "#6C4CF1",
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 items-center flex-1 mx-2 shadow-sm active:opacity-70"
      style={{ elevation: 1 }}
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 rounded-2xl items-center justify-center mb-2" style={{ backgroundColor: `${color}15` }}>
        <Feather name={icon} size={22} color={color} />
      </View>
      <Text className="text-xs font-semibold text-muted text-center">{label}</Text>
    </TouchableOpacity>
  );
}

function OrderCard({
  id,
  clientName,
  status,
  total,
  createdAt,
  onPress,
}: {
  id: number;
  clientName: string;
  status: string;
  total: string;
  createdAt: string;
  onPress: () => void;
}) {
  const statusColors: Record<string, string> = {
    PENDING: "#F59E0B",
    ACCEPTED: "#3B82F6",
    PREPARING: "#8B5CF6",
    READY: "#10B981",
    ASSIGNED: "#06B6D4",
    PICKED_UP: "#14B8A6",
    DELIVERED: "#22C55E",
    CANCELLED: "#EF4444",
  };
  const statusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    ACCEPTED: "Aceptado",
    PREPARING: "Preparando",
    READY: "Listo",
    ASSIGNED: "Asignado",
    PICKED_UP: "Recogido",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex-row items-center"
      style={{ elevation: 1 }}
      activeOpacity={0.7}
    >
      <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: `${statusColors[status] || "#6B7280"}15` }}>
        <Feather
          name={status === "DELIVERED" ? "check-circle" : status === "CANCELLED" ? "x-circle" : "clock"}
          size={18}
          color={statusColors[status] || "#6B7280"}
        />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-sm font-bold text-foreground">Pedido #{id}</Text>
        <Text className="text-xs text-muted mt-0.5">{new Date(createdAt).toLocaleString("es-CO")}</Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-bold text-foreground">${parseFloat(total).toLocaleString("es-CO")}</Text>
        <Text className="text-xs font-medium mt-0.5" style={{ color: statusColors[status] || "#6B7280" }}>
          {statusLabels[status] || status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CommerceHomeScreen() {
  const navigation = useNavigation<NavProp>();
  const user = useAuthStore((s) => s.user);

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["myStore"],
    queryFn: () => StoresAPI.getMyStore(),
    retry: false,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["commerceStats"],
    queryFn: () => OrdersAPI.stats(),
    enabled: !!store,
    refetchInterval: 15_000,
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["commerceOrders"],
    queryFn: () => OrdersAPI.list(),
    enabled: !!store,
  });

  const pendingOrders = useMemo(() => {
    if (!recentOrders) return [];
    return recentOrders.filter((o) => o.status === "PENDING").slice(0, 5);
  }, [recentOrders]);

  const handleNavigate = useCallback(
    (screen: keyof CommerceStackParamList, params?: any) => {
      navigation.navigate(screen as any, params);
    },
    [navigation],
  );

  if (storeLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#6C4CF1" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome */}
      <View className="px-4 pt-6 pb-4">
        <Text className="text-xs font-medium text-muted mb-0.5">
          Bienvenido de vuelta
        </Text>
        <Text className="text-2xl font-bold text-foreground">
          {user?.first_name || "Comercio"} 👋
        </Text>
        {store && (
          <View className="flex-row items-center mt-1">
            <Feather name="check-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
            <Text className="text-sm font-medium text-emerald-600">{store.name}</Text>
          </View>
        )}
      </View>

      {!store && !storeLoading && (
        <View className="mx-4 bg-amber-50 border border-amber-200 rounded-2xl p-5 items-center mb-4">
          <Feather name="alert-triangle" size={24} color="#F59E0B" style={{ marginBottom: 8 }} />
          <Text className="text-base font-bold text-amber-800 mb-1">Tienda no configurada</Text>
          <Text className="text-sm text-amber-700 text-center mb-4 leading-5">
            Crea tu tienda para empezar a recibir pedidos
          </Text>
          <TouchableOpacity
            onPress={() => handleNavigate("CommerceStoreSettings")}
            className="bg-brand-600 px-6 py-3 rounded-xl active:opacity-80"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-sm">Crear Tienda</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats */}
      {stats && (
        <View className="px-4 mb-5">
          <View className="flex-row mb-3">
            <StatCard icon="package" label="Pedidos" value={stats.total_orders} color="#6C4CF1" />
            <StatCard icon="clock" label="Pendientes" value={stats.pending} color="#F59E0B" />
          </View>
          <View className="flex-row">
            <StatCard icon="check-circle" label="Hoy" value={stats.today_orders} color="#10B981" />
            <StatCard icon="dollar-sign" label="Ventas hoy" value={`$${stats.today_revenue.toLocaleString("es-CO")}`} color="#3B82F6" />
          </View>
        </View>
      )}

      {/* Quick Actions */}
      {store && (
        <View className="mb-5">
          <Text className="text-base font-bold text-foreground px-4 mb-3">Acciones rápidas</Text>
          <View className="flex-row px-2">
            <ActionButton
              icon="shopping-bag"
              label="Productos"
              onPress={() => handleNavigate("CommerceProductList")}
              color="#6C4CF1"
            />
            <ActionButton
              icon="list"
              label="Pedidos"
              onPress={() => handleNavigate("CommerceOrderList")}
              color="#F59E0B"
            />
            <ActionButton
              icon="settings"
              label="Tienda"
              onPress={() => handleNavigate("CommerceStoreSettings")}
              color="#10B981"
            />
          </View>
        </View>
      )}

      {/* Pending Orders */}
      {store && (
        <View className="px-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-bold text-foreground">
              {pendingOrders.length > 0
                ? `Pedidos pendientes (${stats?.pending || 0})`
                : "Últimos pedidos"}
            </Text>
            <TouchableOpacity onPress={() => handleNavigate("CommerceOrderList")} activeOpacity={0.7}>
              <Text className="text-sm font-bold text-brand-600">Ver todos</Text>
            </TouchableOpacity>
          </View>
          {ordersLoading ? (
            <ActivityIndicator color="#6C4CF1" />
          ) : pendingOrders.length > 0 ? (
            pendingOrders.map((order) => (
              <OrderCard
                key={order.id}
                id={order.id}
                clientName="Cliente"
                status={order.status}
                total={order.total}
                createdAt={order.created_at}
                onPress={() => handleNavigate("CommerceOrderDetail", { orderId: order.id })}
              />
            ))
          ) : (
            <View className="bg-white rounded-2xl p-8 items-center shadow-sm" style={{ elevation: 1 }}>
              <Feather name="inbox" size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
              <Text className="text-sm font-medium text-muted">No hay pedidos aún</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
