import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ClientStackParamList } from "../../../types/navigation";
import type { Product } from "../../../types/models";
import { ProductsAPI } from "../../../services/api/products";
import { formatCurrency } from "../../../shared/utils/format";

type Props = NativeStackScreenProps<ClientStackParamList, "StoreDetail">;

export default function StoreDetailScreen({ route, navigation }: Props) {
  const { storeId, storeName } = route.params;

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", storeId],
    queryFn: () => ProductsAPI.list(storeId),
  });

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      className="bg-white mx-4 mb-3 rounded-xl overflow-hidden shadow-sm flex-row"
      onPress={() =>
        navigation.navigate("ProductDetail", {
          storeId,
          productId: item.id,
        })
      }
    >
      <View className="w-24 h-24 bg-gray-100">
        {item.image ? (
          <Image source={{ uri: item.image }} className="w-full h-full" />
        ) : (
          <View className="flex-1 justify-center items-center bg-amber-50">
            <Text className="text-2xl text-amber-300">{item.name[0]}</Text>
          </View>
        )}
      </View>
      <View className="flex-1 p-3 justify-center">
        <Text className="text-base font-semibold text-gray-800">{item.name}</Text>
        {item.description && (
          <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text className="text-amber-600 font-bold mt-1">
          {formatCurrency(item.price)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProduct}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center pt-20">
            <Text className="text-gray-400">
              Esta tienda no tiene productos disponibles
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
      />
    </View>
  );
}
