import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CourierStackParamList } from "../../../types/navigation";
import { OrdersAPI } from "../../../services/api/orders";
import { CouriersAPI } from "../../../services/api/couriers";
import { MapsAPI } from "../../../services/api/maps";
import { formatCurrency } from "../../../shared/utils/format";

type Props = NativeStackScreenProps<CourierStackParamList, "AssignedOrder">;

export default function AssignedOrderScreen({ route }: Props) {
  const { orderId } = route.params;
  const queryClient = useQueryClient();
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [routeToStore, setRouteToStore] = useState<{
    distance_km: number;
    duration_min: number;
  } | null>(null);
  const [routeToClient, setRouteToClient] = useState<{
    distance_km: number;
    duration_min: number;
  } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => OrdersAPI.getById(orderId),
    refetchInterval: 5000,
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          sendLocationViaWs(latitude, longitude);
        },
      );

      return () => subscription.remove();
    })();

    return () => {
      wsRef.current?.close();
    };
  }, [orderId]);

  const connectWs = () => {
    const apiUrl = __DEV__
      ? "http://localhost:8000"
      : "https://api.kinetik.app";
    const wsUrl = apiUrl.replace(/^http/, "ws") + `/ws/tracking/${orderId}/`;
    wsRef.current = new WebSocket(wsUrl);
  };

  const sendLocationViaWs = (lat: number, lng: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWs();
      setTimeout(() => sendLocationViaWs(lat, lng), 500);
      return;
    }
    wsRef.current.send(
      JSON.stringify({
        action: "update_location",
        lat,
        lng,
        speed: 0,
        heading: 0,
      }),
    );
  };

  useEffect(() => {
    if (!order || !currentLocation) return;

    const storeLoc = order.store_location?.coordinates;
    const destLoc = order.delivery_location?.coordinates;

    if (storeLoc) {
      MapsAPI.getDirections(
        currentLocation,
        { lat: storeLoc[1], lng: storeLoc[0] },
      ).then((r) => {
        if (r) {
          setRouteToStore({
            distance_km: r.distance_km,
            duration_min: r.duration_min,
          });
          const coords = r.polyline as unknown as {
            coordinates?: [number, number][];
          };
          if (coords?.coordinates) {
            setRouteCoords(
              coords.coordinates.map((c) => ({
                latitude: c[1],
                longitude: c[0],
              })),
            );
          }
        }
      });
    }

    if (destLoc) {
      const origin = storeLoc
        ? { lat: storeLoc[1], lng: storeLoc[0] }
        : currentLocation;
      MapsAPI.getDirections(origin, {
        lat: destLoc[1],
        lng: destLoc[0],
      }).then((r) => {
        if (r) {
          setRouteToClient({
            distance_km: r.distance_km,
            duration_min: r.duration_min,
          });
        }
      });
    }
  }, [order, currentLocation]);

  const acceptMutation = useMutation({
    mutationFn: (orderId: number) => CouriersAPI.acceptOrder(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["order", orderId] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      OrdersAPI.updateStatus(orderId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["order", orderId] }),
  });

  if (isLoading || !order) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  const storeCoords = order.store_location?.coordinates;
  const destCoords = order.delivery_location?.coordinates;

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        className="flex-1"
        initialRegion={{
          latitude: storeCoords?.[1] ?? 6.2476,
          longitude: storeCoords?.[0] ?? -75.5658,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        showsUserLocation
      >
        {storeCoords && (
          <Marker
            coordinate={{
              latitude: storeCoords[1],
              longitude: storeCoords[0],
            }}
            title={order.store_name}
            description={order.store_address}
            pinColor="#f59e0b"
          />
        )}
        {destCoords && (
          <Marker
            coordinate={{ latitude: destCoords[1], longitude: destCoords[0] }}
            title="Cliente"
            description={order.delivery_address}
            pinColor="#ef4444"
          />
        )}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#059669"
            strokeWidth={4}
          />
        )}
      </MapView>

      <View className="bg-white rounded-t-3xl p-4 shadow-lg">
        <View className="mb-3">
          <View className="flex-row items-center mb-3">
            <View className="w-3 h-3 rounded-full bg-amber-500 mr-2" />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-800">
                {order.store_name}
              </Text>
              <Text className="text-xs text-gray-500">
                {order.store_address}
              </Text>
            </View>
            {routeToStore && (
              <Text className="text-xs text-gray-500">
                {routeToStore.distance_km} km · {routeToStore.duration_min} min
              </Text>
            )}
          </View>

          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-800">
                Cliente
              </Text>
              <Text className="text-xs text-gray-500">
                {order.delivery_address}
              </Text>
            </View>
            {routeToClient && (
              <Text className="text-xs text-gray-500">
                {routeToClient.distance_km} km · {routeToClient.duration_min}{" "}
                min
              </Text>
            )}
          </View>
        </View>

        <Text className="text-lg font-bold text-center mb-3">
          {formatCurrency(order.total)}
        </Text>

        <View className="flex-row gap-3">
          {order.status === "READY" && (
            <TouchableOpacity
              className="flex-1 bg-gray-200 rounded-xl py-3 items-center"
              onPress={() => acceptMutation.mutate(order.id)}
              disabled={acceptMutation.isPending}
            >
              <Text className="text-gray-700 font-semibold">Aceptar</Text>
            </TouchableOpacity>
          )}
          {order.status === "ASSIGNED" && (
            <TouchableOpacity
              className="flex-1 bg-emerald-500 rounded-xl py-3 items-center"
              onPress={() => updateStatusMutation.mutate("PICKED_UP")}
              disabled={updateStatusMutation.isPending}
            >
              <Text className="text-white font-semibold">Recogido</Text>
            </TouchableOpacity>
          )}
          {order.status === "PICKED_UP" && (
            <TouchableOpacity
              className="flex-1 bg-emerald-600 rounded-xl py-3 items-center"
              onPress={() => updateStatusMutation.mutate("DELIVERED")}
              disabled={updateStatusMutation.isPending}
            >
              <Text className="text-white font-semibold">Entregado</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
