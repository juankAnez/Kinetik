import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import type { CommerceStackParamList } from "../../../types/navigation";
import { OrdersAPI } from "../../../services/api/orders";

type DetailRoute = RouteProp<CommerceStackParamList, "CommerceOrderDetail">;

const STATUS_FLOW = {
  PENDING: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: keyof typeof Feather.glyphMap }> = {
  PENDING: { label: "Pendiente", color: "#F59E0B", icon: "clock" },
  ACCEPTED: { label: "Aceptado", color: "#3B82F6", icon: "check" },
  PREPARING: { label: "Preparando", color: "#8B5CF6", icon: "coffee" },
  READY: { label: "Listo", color: "#10B981", icon: "check-circle" },
  ASSIGNED: { label: "Asignado", color: "#06B6D4", icon: "navigation" },
  PICKED_UP: { label: "Recogido", color: "#14B8A6", icon: "truck" },
  DELIVERED: { label: "Entregado", color: "#22C55E", icon: "check-circle" },
  CANCELLED: { label: "Cancelado", color: "#EF4444", icon: "x-circle" },
};

const ACTION_BUTTONS: Record<string, { label: string; nextStatus: string; color: string }[]> = {
  PENDING: [
    { label: "Aceptar Pedido", nextStatus: "ACCEPTED", color: "#3B82F6" },
    { label: "Cancelar", nextStatus: "CANCELLED", color: "#EF4444" },
  ],
  ACCEPTED: [
    { label: "Marcar Preparando", nextStatus: "PREPARING", color: "#8B5CF6" },
    { label: "Cancelar", nextStatus: "CANCELLED", color: "#EF4444" },
  ],
  PREPARING: [
    { label: "Marcar Listo", nextStatus: "READY", color: "#10B981" },
    { label: "Cancelar", nextStatus: "CANCELLED", color: "#EF4444" },
  ],
};

function TimelineStep({
  label,
  time,
  isActive,
  isLast,
}: {
  label: string;
  time?: string;
  isActive: boolean;
  isLast: boolean;
}) {
  return (
    <View className="flex-row">
      <View className="items-center mr-3">
        <View
          className={`w-4 h-4 rounded-full border-2 ${isActive ? "bg-brand-600 border-brand-600" : "bg-white border-gray-300"}`}
        />
        {!isLast && <View className="w-0.5 flex-1 bg-gray-200 my-1" />}
      </View>
      <View className="pb-6">
        <Text className={`text-sm font-semibold ${isActive ? "text-foreground" : "text-muted"}`}>
          {label}
        </Text>
        {time && <Text className="text-xs text-muted mt-0.5">{time}</Text>}
      </View>
    </View>
  );
}

export default function CommerceOrderDetailScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", route.params.orderId],
    queryFn: () => OrdersAPI.getById(route.params.orderId),
    refetchInterval: 10_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: string; reason?: string }) =>
      OrdersAPI.updateStatus(route.params.orderId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", route.params.orderId] });
      queryClient.invalidateQueries({ queryKey: ["commerceOrders"] });
      queryClient.invalidateQueries({ queryKey: ["commerceStats"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.response?.data?.error || "No se pudo actualizar el estado");
    },
  });

  const handleAction = useCallback(
    (nextStatus: string) => {
      if (nextStatus === "CANCELLED") {
        Alert.prompt?.(
          "Cancelar pedido",
          "¿Por qué se cancela?",
          (reason) => statusMutation.mutate({ status: nextStatus, reason }),
        ) ?? statusMutation.mutate({ status: nextStatus });
      } else {
        statusMutation.mutate({ status: nextStatus });
      }
    },
    [statusMutation],
  );

  if (isLoading || !order) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#6C4CF1" />
      </View>
    );
  }

  const config = STATUS_CONFIG[order.status] || { label: order.status, color: "#6B7280", icon: "help-circle" };
  const actions = ACTION_BUTTONS[order.status] || [];
  const createdAt = new Date(order.created_at);
  const showTimeline = ["ACCEPTED", "PREPARING", "READY", "ASSIGNED", "PICKED_UP", "DELIVERED"].includes(order.status);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Status Header */}
      <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm items-center" style={{ elevation: 1 }}>
        <View
          className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
          style={{ backgroundColor: `${config.color}15` }}
        >
          <Feather name={config.icon} size={26} color={config.color} />
        </View>
        <Text className="text-xl font-bold text-foreground">Pedido #{order.id}</Text>
        <Text className="text-sm font-semibold mt-1" style={{ color: config.color }}>
          {config.label}
        </Text>
        <Text className="text-xs text-muted mt-1">
          {createdAt.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>

      {/* Action Buttons */}
      {actions.length > 0 && (
        <View className="px-4 mt-4">
          {actions.map((action) => (
            <TouchableOpacity
              key={action.nextStatus}
              onPress={() => handleAction(action.nextStatus)}
              disabled={statusMutation.isPending}
              className="py-4 rounded-2xl items-center mb-3 active:opacity-80"
              style={{ backgroundColor: action.color }}
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-base">{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Items */}
      <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm" style={{ elevation: 1 }}>
        <Text className="text-base font-bold text-foreground mb-3">Productos</Text>
        {order.items?.map((item: any, idx: number) => (
          <View key={idx} className="flex-row items-center justify-between py-2 border-b border-gray-50">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-semibold text-foreground">{item.product_name}</Text>
              <Text className="text-xs text-muted">x{item.quantity}</Text>
            </View>
            <Text className="text-sm font-bold text-foreground">
              ${parseFloat(item.subtotal || "0").toLocaleString("es-CO")}
            </Text>
          </View>
        ))}
        <View className="flex-row justify-between pt-3">
          <Text className="text-sm font-semibold text-foreground">Total</Text>
          <Text className="text-base font-bold text-brand-600">
            ${parseFloat(order.total).toLocaleString("es-CO")}
          </Text>
        </View>
      </View>

      {/* Delivery Info */}
      <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm" style={{ elevation: 1 }}>
        <Text className="text-base font-bold text-foreground mb-3">Entrega</Text>
        <View className="flex-row items-start mb-2">
          <Feather name="map-pin" size={14} color="#64748B" style={{ marginRight: 8, marginTop: 2 }} />
          <Text className="text-sm text-muted flex-1">{order.delivery_address}</Text>
        </View>
        {order.delivery_notes && (
          <View className="flex-row items-start">
            <Feather name="edit-2" size={14} color="#64748B" style={{ marginRight: 8, marginTop: 2 }} />
            <Text className="text-sm text-muted flex-1">{order.delivery_notes}</Text>
          </View>
        )}
        <View className="flex-row items-center mt-2">
          <Feather name="truck" size={14} color="#64748B" style={{ marginRight: 8 }} />
          <Text className="text-sm text-muted">
            Domicilio: ${parseFloat(order.delivery_fee || "0").toLocaleString("es-CO")}
          </Text>
        </View>
        <View className="flex-row items-center mt-1">
          <Feather name="credit-card" size={14} color="#64748B" style={{ marginRight: 8 }} />
          <Text className="text-sm text-muted">{order.payment_method}</Text>
        </View>
      </View>

      {/* Timeline */}
      {showTimeline && (
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm" style={{ elevation: 1 }}>
          <Text className="text-base font-bold text-foreground mb-4">Estado del pedido</Text>
          <TimelineStep
            label="Pedido creado"
            time={createdAt.toLocaleString("es-CO")}
            isActive
            isLast={false}
          />
          {order.accepted_at && (
            <TimelineStep
              label="Aceptado"
              time={new Date(order.accepted_at).toLocaleString("es-CO")}
              isActive
              isLast={order.status === "ACCEPTED"}
            />
          )}
          {order.status !== "PENDING" && !order.accepted_at && (
            <TimelineStep label="Pendiente" isActive={false} isLast={false} />
          )}
          {order.status === "READY" && !order.ready_at && (
            <TimelineStep label="Listo" isActive={false} isLast />
          )}
        </View>
      )}
    </ScrollView>
  );
}
