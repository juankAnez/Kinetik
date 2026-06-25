import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import API from "../../../services/api/client";
import type { Store } from "../../../types/models";
import type { ClientStackParamList } from "../../../types/navigation";
import { formatCurrency } from "../../../shared/utils/format";

type NavProp = NativeStackNavigationProp<ClientStackParamList, "Home">;

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stores, isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data } = await API.get<{ results: Store[] }>("/stores/");
      return data.results ?? [];
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-400">Cargando tiendas...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={stores}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white mx-4 mt-3 rounded-xl overflow-hidden shadow-sm"
            onPress={() =>
              navigation.navigate("StoreDetail", {
                storeId: item.id,
                storeName: item.name,
              })
            }
          >
            <View className="h-32 bg-gray-200">
              {item.banner ? (
                <Image
                  source={{ uri: item.banner }}
                  className="w-full h-full"
                />
              ) : (
                <View className="flex-1 justify-center items-center bg-amber-100">
                  <Text className="text-2xl text-amber-600 font-bold">
                    {item.name[0]}
                  </Text>
                </View>
              )}
            </View>
            <View className="p-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-gray-800">
                  {item.name}
                </Text>
                {item.avg_rating && (
                  <View className="flex-row items-center">
                    <Text className="text-amber-500">★</Text>
                    <Text className="ml-1 text-gray-600">
                      {item.avg_rating.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
              {item.description && (
                <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              {item.category_name && (
                <View className="bg-amber-100 rounded-full px-3 py-1 self-start mt-2">
                  <Text className="text-amber-700 text-xs font-medium">
                    {item.category_name}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center pt-20">
            <Text className="text-gray-400">
              No hay tiendas disponibles en tu municipio
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}
