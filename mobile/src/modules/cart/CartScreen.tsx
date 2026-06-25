import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ClientStackParamList } from "../../types/navigation";
import { useCartStore } from "../../stores/cartStore";
import { formatCurrency } from "../../shared/utils/format";

type Props = NativeStackScreenProps<ClientStackParamList, "Cart">;

export default function CartScreen({ navigation }: Props) {
  const { items, removeItem, updateQuantity, getSubtotal, clearCart } =
    useCartStore();
  const subtotal = getSubtotal();
  const deliveryFee = 3500;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-6">
        <Text className="text-5xl mb-4">🛒</Text>
        <Text className="text-xl font-semibold text-gray-800 mb-2">
          Tu carrito está vacío
        </Text>
        <Text className="text-gray-500 text-center mb-6">
          Agrega productos de una tienda para empezar
        </Text>
        <TouchableOpacity
          className="bg-amber-500 rounded-xl py-3 px-8"
          onPress={() => navigation.navigate("Home")}
        >
          <Text className="text-white font-semibold">Ver tiendas</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.product.id)}
        renderItem={({ item }) => (
          <View className="bg-white mx-4 mt-3 rounded-xl p-4 flex-row shadow-sm">
            <View className="w-16 h-16 bg-gray-100 rounded-lg justify-center items-center">
              {item.product.image ? (
                <Image
                  source={{ uri: item.product.image }}
                  className="w-full h-full rounded-lg"
                />
              ) : (
                <Text className="text-xl text-amber-300">
                  {item.product.name[0]}
                </Text>
              )}
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-gray-800">
                {item.product.name}
              </Text>
              <Text className="text-amber-600 font-bold mt-1">
                {formatCurrency(item.unitPrice)}
              </Text>
              <View className="flex-row items-center mt-2">
                <TouchableOpacity
                  className="w-7 h-7 bg-gray-100 rounded-full justify-center items-center"
                  onPress={() =>
                    updateQuantity(item.product.id, item.quantity - 1)
                  }
                >
                  <Text className="text-sm font-bold text-gray-600">-</Text>
                </TouchableOpacity>
                <Text className="mx-3 text-sm font-semibold">
                  {item.quantity}
                </Text>
                <TouchableOpacity
                  className="w-7 h-7 bg-gray-100 rounded-full justify-center items-center"
                  onPress={() =>
                    updateQuantity(item.product.id, item.quantity + 1)
                  }
                >
                  <Text className="text-sm font-bold text-gray-600">+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              className="justify-center pl-3"
              onPress={() => removeItem(item.product.id)}
            >
              <Text className="text-red-400 text-sm">Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Subtotal</Text>
              <Text className="text-gray-800">{formatCurrency(subtotal)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Domicilio</Text>
              <Text className="text-gray-800">
                {formatCurrency(deliveryFee)}
              </Text>
            </View>
            <View className="border-t border-gray-200 my-2" />
            <View className="flex-row justify-between">
              <Text className="font-bold text-lg">Total</Text>
              <Text className="font-bold text-lg text-amber-600">
                {formatCurrency(total)}
              </Text>
            </View>
          </View>
        }
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 100 }}
      />

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8">
        <TouchableOpacity
          className="bg-amber-500 rounded-xl py-4 items-center"
          onPress={() => navigation.navigate("Checkout")}
        >
          <Text className="text-white font-bold text-lg">
            Continuar ({formatCurrency(total)})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
