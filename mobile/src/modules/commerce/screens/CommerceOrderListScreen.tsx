import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CommerceStackParamList } from "../../../types/navigation";
import { OrdersAPI } from "../../../services/api/orders";
import type { Order } from "../../../types/models";

type NavProp = NativeStackNavigationProp<CommerceStackParamList, "CommerceOrderList">;

const TABS = [
  { key: "", label: "Todos" },
  { key: "PENDING", label: "Pendientes" },
  { key: "ACCEPTED", label: "Aceptados" },
  { key: "PREPARING", label: "Preparando" },
  { key: "READY", label: "Listos" },
  { key: "ASSIGNED", label: "En camino" },
  { key: "DELIVERED", label: "Entregados" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#F59E0B",
  ACCEPTED: "#3B82F6",
  PREPARING: "#8B5CF6",
  READY: "#10B981",
  ASSIGNED: "#06B6D4",
  PICKED_UP: "#14B8A6",
  DELIVERED: "#22C55E",
  CANCELLED: "#EF4444",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  ACCEPTED: "Aceptado",
  PREPARING: "Preparando",
  READY: "Listo",
  ASSIGNED: "Asignado",
  PICKED_UP: "Recogido",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

function OrderCard({ item, onPress }: { item: Order; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
      style={{ elevation: 1 }}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: `${STATUS_COLORS[item.status] || "#6B7280"}15` }}
          >
            <Feather
              name={item.status === "DELIVERED" ? "check" : item.status === "CANCELLED" ? "x" : "clock"}
              size={14}
              color={STATUS_COLORS[item.status] || "#6B7280"}
            />
          </View>
          <View>
            <Text className="text-sm font-bold text-foreground">Pedido #{item.id}</Text>
            <Text className="text-xs text-muted">
              {new Date(item.created_at).toLocaleString("es-CO")}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-sm font-bold text-foreground">
            ${parseFloat(item.total).toLocaleString("es-CO")}
          </Text>
          <Text
            className="text-xs font-semibold mt-0.5"
            style={{ color: STATUS_COLORS[item.status] || "#6B7280" }}
          >
            {STATUS_LABELS[item.status] || item.status}
          </Text>
        </View>
      </View>
      {item.delivery_fee && parseFloat(item.delivery_fee) > 0 && (
        <View className="flex-row items-center">
          <Feather name="truck" size={11} color="#94A3B8" style={{ marginRight: 4 }} />
          <Text className="text-xs text-muted">
            Domicilio: ${parseFloat(item.delivery_fee).toLocaleString("es-CO")}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function CommerceOrderListScreen() {
  const navigation = useNavigation<NavProp>();
  const [activeTab, setActiveTab] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["commerceOrders", activeTab],
    queryFn: () => OrdersAPI.list(activeTab || undefined),
    refetchInterval: 10_000,
  });

  const renderItem = useCallback(
    ({ item }: { item: Order }) => (
      <OrderCard
        item={item}
        onPress={() => navigation.navigate("CommerceOrderDetail", { orderId: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <View className="flex-1 bg-background">
      {/* Tabs */}
      <View className="bg-white shadow-sm" style={{ elevation: 1 }}>
        <FlatList
          horizontal
          data={TABS}
          keyExtractor={(t) => t.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
          renderItem={({ item: tab }) => (
            <TouchableOpacity
              onPress={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full mr-2 ${
                activeTab === tab.key ? "bg-brand-600" : "bg-gray-100"
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeTab === tab.key ? "text-white" : "text-muted"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          isLoading ? (
            <View className="flex-1 justify-center items-center pt-20">
              <ActivityIndicator size="large" color="#6C4CF1" />
            </View>
          ) : (
            <View className="items-center pt-20">
              <View className="w-16 h-16 bg-gray-50 rounded-2xl items-center justify-center mb-4">
                <Feather name="inbox" size={28} color="#94A3B8" />
              </View>
              <Text className="text-base font-bold text-foreground mb-1">
                No hay pedidos {activeTab ? STATUS_LABELS[activeTab]?.toLowerCase() : ""}
              </Text>
              <Text className="text-sm text-muted text-center">
                {activeTab ? "Los pedidos aparecerán aquí" : "Espera a que lleguen los primeros pedidos"}
              </Text>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
