import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ClientStackParamList } from "../../../types/navigation";
import { useCartStore } from "../../../stores/cartStore";
import { useAuthStore } from "../../../stores/authStore";
import { OrdersAPI } from "../../../services/api/orders";
import { formatCurrency } from "../../../shared/utils/format";

type Props = NativeStackScreenProps<ClientStackParamList, "Checkout">;

export default function CheckoutScreen({ navigation }: Props) {
  const { items, getSubtotal, deliveryAddress, deliveryNotes, setDeliveryAddress, setDeliveryNotes, clearCart } =
    useCartStore();
  const user = useAuthStore((s) => s.user);
  const [address, setAddress] = useState(deliveryAddress);
  const [notes, setNotes] = useState(deliveryNotes);

  const subtotal = getSubtotal();
  const deliveryFee = 3500;
  const total = subtotal + deliveryFee;

  const createOrderMutation = useMutation({
    mutationFn: () => {
      if (!user?.municipio || items.length === 0) {
        throw new Error("Faltan datos para crear el pedido");
      }
      return OrdersAPI.create({
        store: items[0].product.store,
        municipio: user.municipio,
        payment_method: "CASH",
        delivery_address: address,
        delivery_location: {
          type: "Point",
          coordinates: [-75.57, 6.24],
        },
        delivery_notes: notes,
        items: items.map((i) => ({
          product_name: i.product.name,
          product_price: String(i.unitPrice),
          quantity: i.quantity,
          subtotal: String(i.subtotal),
        })),
        subtotal: String(subtotal),
        delivery_fee: String(deliveryFee),
        total: String(total),
      });
    },
    onSuccess: (order) => {
      clearCart();
      navigation.reset({
        index: 0,
        routes: [{ name: "OrderDetail", params: { orderId: order.id } }],
      });
    },
    onError: () => {
      Alert.alert("Error", "No se pudo crear el pedido. Intenta de nuevo.");
    },
  });

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Text className="text-xl font-bold text-gray-800 mb-4">
        Confirmar pedido
      </Text>

      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="font-semibold text-gray-800 mb-3">
          Dirección de entrega
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
          placeholder="Calle 50 # 40-1"
          value={address}
          onChangeText={setAddress}
        />
      </View>

      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="font-semibold text-gray-800 mb-3">
          Notas para el domiciliario
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
          placeholder="Ej: Tocar el timbre 3 veces"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </View>

      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="font-semibold text-gray-800 mb-3">
          Productos ({items.length})
        </Text>
        {items.map((item) => (
          <View key={item.product.id} className="flex-row justify-between mb-2">
            <Text className="text-gray-600 flex-1">
              {item.quantity}x {item.product.name}
            </Text>
            <Text className="text-gray-800">
              {formatCurrency(item.subtotal)}
            </Text>
          </View>
        ))}
      </View>

      <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Subtotal</Text>
          <Text>{formatCurrency(subtotal)}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Domicilio</Text>
          <Text>{formatCurrency(deliveryFee)}</Text>
        </View>
        <View className="border-t border-gray-200 my-2" />
        <View className="flex-row justify-between">
          <Text className="font-bold text-lg">Total</Text>
          <Text className="font-bold text-lg text-amber-600">
            {formatCurrency(total)}
          </Text>
        </View>
        <View className="bg-gray-50 rounded-lg p-3 mt-3">
          <Text className="text-sm text-gray-500 text-center">
            Pago contra entrega
          </Text>
        </View>
      </View>

      <TouchableOpacity
        className={`bg-amber-500 rounded-xl py-4 items-center mb-8 ${
          createOrderMutation.isPending ? "opacity-50" : ""
        }`}
        onPress={() => createOrderMutation.mutate()}
        disabled={createOrderMutation.isPending || !address}
      >
        {createOrderMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg">
            Confirmar pedido
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
