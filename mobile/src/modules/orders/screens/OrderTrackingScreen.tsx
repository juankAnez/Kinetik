import { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ClientStackParamList } from "../../../types/navigation";
import { OrdersAPI } from "../../../services/api/orders";
import { MapsAPI } from "../../../services/api/maps";
import type { Order } from "../../../types/models";
import { formatCurrency } from "../../../shared/utils/format";

type Props = NativeStackScreenProps<ClientStackParamList, "OrderTracking">;

export default function OrderTrackingScreen({ route }: Props) {
  const { orderId } = route.params;
  const mapRef = useRef<MapView>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [courierLocation, setCourierLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance_km: number;
    duration_min: number;
  } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    OrdersAPI.getById(orderId).then((o) => {
      setOrder(o);
      if (o.delivery_location?.coordinates) {
        const [dlng, dlat] = o.delivery_location.coordinates;
        mapRef.current?.animateToRegion({
          latitude: dlat,
          longitude: dlng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });

        if (o.status === "ASSIGNED" || o.status === "PICKED_UP") {
          connectWebSocket(o.id);
        }
      }
    });
  }, [orderId]);

  const connectWebSocket = (id: number) => {
    const apiUrl = __DEV__
      ? "http://localhost:8000"
      : "https://api.kinetik.app";
    const wsUrl = apiUrl.replace(/^http/, "ws") + `/ws/tracking/${id}/`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "location" && data.lat && data.lng) {
        setCourierLocation({ lat: data.lat, lng: data.lng });

        const dest = order?.delivery_location?.coordinates;
        if (dest) {
          const route = await MapsAPI.getDirections(
            { lat: data.lat, lng: data.lng },
            { lat: dest[1], lng: dest[0] },
          );
          if (route) {
            setRouteInfo({
              distance_km: route.distance_km,
              duration_min: route.duration_min,
            });
          }
        }
      }
    };

    return () => {
      ws.close();
    };
  };

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  if (!order) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const deliveryCoords = order.delivery_location?.coordinates;
  const deliveryLat = deliveryCoords?.[1];
  const deliveryLng = deliveryCoords?.[0];

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        className="flex-1"
        initialRegion={{
          latitude: deliveryLat ?? 6.2476,
          longitude: deliveryLng ?? -75.5658,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
      >
        {deliveryLat && deliveryLng && (
          <Marker
            coordinate={{ latitude: deliveryLat, longitude: deliveryLng }}
            title="Destino"
            description={order.delivery_address}
            pinColor="red"
          />
        )}
        {courierLocation && (
          <Marker
            coordinate={{
              latitude: courierLocation.lat,
              longitude: courierLocation.lng,
            }}
            title="Domiciliario"
            pinColor="#059669"
          >
            <Callout>
              <View className="p-1">
                <Text className="font-semibold">Domiciliario</Text>
                {routeInfo && (
                  <Text className="text-sm text-gray-600">
                    A {routeInfo.distance_km} km ~ {routeInfo.duration_min} min
                  </Text>
                )}
              </View>
            </Callout>
          </Marker>
        )}
      </MapView>

      {routeInfo && (
        <View className="absolute top-4 left-4 right-4 bg-white rounded-xl p-4 shadow-lg">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-sm text-gray-500">Distancia restante</Text>
              <Text className="text-xl font-bold text-gray-800">
                {routeInfo.distance_km} km
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-sm text-gray-500">Tiempo estimado</Text>
              <Text className="text-xl font-bold text-amber-600">
                ~{routeInfo.duration_min} min
              </Text>
            </View>
          </View>
        </View>
      )}

      <View className="absolute bottom-6 left-4 right-4 bg-white rounded-xl p-4 shadow-lg">
        <Text className="font-semibold text-gray-800 mb-1">
          {order.store_name}
        </Text>
        <Text className="text-gray-500 text-sm" numberOfLines={2}>
          {order.delivery_address}
        </Text>
        <Text className="text-gray-700 font-bold mt-2">
          Total: {formatCurrency(order.total)}
        </Text>
      </View>
    </View>
  );
}
