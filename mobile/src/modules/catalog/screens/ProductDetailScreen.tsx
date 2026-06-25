import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ClientStackParamList } from "../../../types/navigation";
import type { ProductOption } from "../../../types/models";
import { ProductsAPI } from "../../../services/api/products";
import { useCartStore } from "../../../stores/cartStore";
import { formatCurrency } from "../../../shared/utils/format";

type Props = NativeStackScreenProps<ClientStackParamList, "ProductDetail">;

export default function ProductDetailScreen({ route, navigation }: Props) {
  const { storeId, productId } = route.params;
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => ProductsAPI.getById(productId),
  });

  if (isLoading || !product) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const optionsPrice = product.options
    ? product.options.reduce((sum, opt) => {
        const choice = opt.choices.find(
          (c) => c.label === selectedOptions[opt.name],
        );
        return sum + (choice ? Number(choice.price) : 0);
      }, 0)
    : 0;

  const totalPrice = Number(product.price) + optionsPrice;

  const handleOptionSelect = (optionName: string, label: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: label }));
  };

  const handleAddToCart = () => {
    addItem(product, quantity, selectedOptions);
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="h-64 bg-gray-100">
          {product.image ? (
            <Image
              source={{ uri: product.image }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="flex-1 justify-center items-center bg-amber-50">
              <Text className="text-6xl text-amber-300">
                {product.name[0]}
              </Text>
            </View>
          )}
        </View>

        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-800">
            {product.name}
          </Text>
          {product.description && (
            <Text className="text-gray-500 mt-2">{product.description}</Text>
          )}
          <Text className="text-xl font-bold text-amber-600 mt-3">
            {formatCurrency(product.price)}
          </Text>

          {product.options && product.options.length > 0 && (
            <View className="mt-6">
              <Text className="text-lg font-semibold text-gray-800 mb-3">
                Personalizar
              </Text>
              {(product.options as ProductOption[]).map((opt) => (
                <View key={opt.name} className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    {opt.name}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {opt.choices.map((choice) => {
                      const isSelected =
                        selectedOptions[opt.name] === choice.label;
                      const price =
                        Number(choice.price) > 0
                          ? `+${formatCurrency(choice.price)}`
                          : "";
                      return (
                        <TouchableOpacity
                          key={choice.label}
                          className={`px-4 py-2 rounded-full border ${
                            isSelected
                              ? "bg-amber-500 border-amber-500"
                              : "bg-white border-gray-300"
                          }`}
                          onPress={() =>
                            handleOptionSelect(opt.name, choice.label)
                          }
                        >
                          <Text
                            className={`text-sm ${
                              isSelected ? "text-white" : "text-gray-700"
                            }`}
                          >
                            {choice.label} {price}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View className="border-t border-gray-200 p-4 bg-white">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity
            className="w-10 h-10 bg-gray-100 rounded-full justify-center items-center"
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Text className="text-xl font-bold text-gray-600">-</Text>
          </TouchableOpacity>
          <Text className="mx-4 text-lg font-semibold">{quantity}</Text>
          <TouchableOpacity
            className="w-10 h-10 bg-gray-100 rounded-full justify-center items-center"
            onPress={() => setQuantity(quantity + 1)}
          >
            <Text className="text-xl font-bold text-gray-600">+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-amber-500 rounded-xl py-4 items-center"
          onPress={handleAddToCart}
        >
          <Text className="text-white font-bold text-lg">
            Agregar {formatCurrency(totalPrice * quantity)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
