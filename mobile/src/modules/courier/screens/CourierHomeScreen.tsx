import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CourierStackParamList } from "../../../types/navigation";
import { OrdersAPI } from "../../../services/api/orders";
import { CouriersAPI } from "../../../services/api/couriers";
import { formatCurrency } from "../../../shared/utils/format";
import type { Order } from "../../../types/models";

type NavProp = NativeStackNavigationProp<CourierStackParamList, "CourierHome">;

export default function CourierHomeScreen() {
  const navigation = useNavigation<NavProp>();
  const queryClient = useQueryClient();
  const [isAvailable, setIsAvailable] = useState(false);
  const locationWatcher = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        locationWatcher.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          () => {},
        );
      }
    })();
    return () => {
      locationWatcher.current?.remove();
    };
  }, []);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["courier-orders"],
    queryFn: () => OrdersAPI.active(),
    refetchInterval: 10000,
  });

  const toggleMutation = useMutation({
    mutationFn: () => CouriersAPI.toggleAvailability(),
    onSuccess: (data) => setIsAvailable(data.is_available),
  });

  const acceptMutation = useMutation({
    mutationFn: (orderId: number) => CouriersAPI.acceptOrder(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courier-orders"] }),
  });

  const pendingOrders = (orders ?? []).filter(
    (o) => o.status === "ASSIGNED" || o.status === "READY",
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-4 mx-4 mt-4 rounded-xl shadow-sm">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-lg font-bold text-gray-800">
              {isAvailable ? "Disponible" : "Desconectado"}
            </Text>
            <Text className="text-sm text-gray-500">
              {pendingOrders.length} pedido(s) pendiente(s)
            </Text>
          </View>
          <TouchableOpacity
            className={`rounded-xl px-6 py-3 ${
              isAvailable ? "bg-red-500" : "bg-emerald-500"
            }`}
            onPress={() => toggleMutation.mutate()}
          >
            <Text className="text-white font-semibold">
              {isAvailable ? "Desconectar" : "Conectar"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : pendingOrders.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-400 text-lg">Esperando pedidos...</Text>
          <Text className="text-gray-400 text-sm mt-1">
            Activa tu disponibilidad para recibir asignaciones
          </Text>
        </View>
      ) : (
        <FlatList
          data={pendingOrders}
          keyExtractor={(item) => String(item.id)}
          className="mt-4"
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() =>
                navigation.navigate("AssignedOrder", { orderId: item.id })
              }
            />
          )}
        />
      )}
    </View>
  );
}

function OrderCard({
  order,
  onPress,
}: {
  order: Order;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="bg-white mx-4 mb-3 rounded-xl p-4 shadow-sm"
      onPress={onPress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="font-bold text-gray-800">{order.store_name}</Text>
          <Text className="text-gray-500 text-sm mt-1">
            {order.delivery_address}
          </Text>
        </View>
        <Text className="text-emerald-600 font-bold">
          {formatCurrency(order.total)}
        </Text>
      </View>
      <View className="flex-row mt-3">
        <View className="bg-emerald-100 rounded-full px-3 py-1">
          <Text className="text-emerald-700 text-xs font-medium">
            {order.status === "READY" ? "Listo para recoger" : "Asignado"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
