import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ClientStackParamList } from "../../../types/navigation";
import { OrdersAPI } from "../../../services/api/orders";
import { formatCurrency, formatDateTime } from "../../../shared/utils/format";
import type { OrderStatus } from "../../../types/models";

const STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  ACCEPTED: { label: "Aceptado", color: "bg-blue-100 text-blue-800" },
  PREPARING: { label: "Preparando", color: "bg-indigo-100 text-indigo-800" },
  READY: { label: "Listo", color: "bg-purple-100 text-purple-800" },
  ASSIGNED: { label: "Asignado", color: "bg-cyan-100 text-cyan-800" },
  PICKED_UP: { label: "Recogido", color: "bg-teal-100 text-teal-800" },
  DELIVERED: { label: "Entregado", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

type Props = NativeStackScreenProps<ClientStackParamList, "OrderDetail">;

export default function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => OrdersAPI.getById(orderId),
  });

  if (isLoading || !order) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const status = STATUS_MAP[order.status];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm">
        <Text className="text-sm text-gray-500">Pedido #{order.id}</Text>
        <Text className="text-lg font-bold text-gray-800 mt-1">
          {order.store_name}
        </Text>
        {status && (
          <View className={`self-start rounded-full px-3 py-1 mt-2 ${status.color.split(" ")[0]}`}>
            <Text className={`text-xs font-medium ${status.color.split(" ")[1]}`}>
              {status.label}
            </Text>
          </View>
        )}
      </View>

      <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
        <Text className="font-semibold text-gray-800 mb-3">Productos</Text>
        {order.items.map((item) => (
          <View key={item.id} className="flex-row justify-between mb-2">
            <Text className="text-gray-600 flex-1">
              {item.quantity}x {item.product_name}
            </Text>
            <Text className="text-gray-800">
              {formatCurrency(item.subtotal)}
            </Text>
          </View>
        ))}
        <View className="border-t border-gray-200 my-2" />
        <View className="flex-row justify-between mb-1">
          <Text className="text-gray-500">Subtotal</Text>
          <Text>{formatCurrency(order.subtotal)}</Text>
        </View>
        <View className="flex-row justify-between mb-1">
          <Text className="text-gray-500">Domicilio</Text>
          <Text>{formatCurrency(order.delivery_fee)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="font-bold">Total</Text>
          <Text className="font-bold text-amber-600">
            {formatCurrency(order.total)}
          </Text>
        </View>
      </View>

      <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
        <Text className="font-semibold text-gray-800 mb-3">
          Detalles de entrega
        </Text>
        <Text className="text-gray-600">{order.delivery_address}</Text>
        <Text className="text-gray-500 text-sm mt-1">
          Creado: {formatDateTime(order.created_at)}
        </Text>
      </View>

      {(order.status === "ASSIGNED" || order.status === "PICKED_UP") && (
        <TouchableOpacity
          className="bg-amber-500 rounded-xl py-4 mx-4 mt-4 items-center"
          onPress={() => navigation.navigate("OrderTracking", { orderId: order.id })}
        >
          <Text className="text-white font-bold text-lg">
            Ver tracking en vivo
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
