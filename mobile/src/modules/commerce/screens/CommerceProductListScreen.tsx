import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CommerceStackParamList } from "../../../types/navigation";
import { ProductsAPI } from "../../../services/api/products";
import type { Product } from "../../../types/models";

type NavProp = NativeStackNavigationProp<CommerceStackParamList, "CommerceProductList">;

function ProductCard({
  item,
  onEdit,
  onToggle,
}: {
  item: Product;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex-row" style={{ elevation: 1 }}>
      <View className="w-16 h-16 bg-brand-50 rounded-xl items-center justify-center">
        {item.image ? (
          <View className="w-full h-full rounded-xl bg-gray-200" />
        ) : (
          <Feather name="package" size={24} color="#6C4CF1" />
        )}
      </View>
      <View className="flex-1 ml-3 justify-center">
        <View className="flex-row items-center">
          <Text className="text-sm font-bold text-foreground flex-1" numberOfLines={1}>
            {item.name}
          </Text>
          <TouchableOpacity
            onPress={onToggle}
            className={`px-2.5 py-1 rounded-full ${item.is_available ? "bg-emerald-100" : "bg-gray-100"}`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-xs font-bold ${item.is_available ? "text-emerald-700" : "text-muted"}`}
            >
              {item.is_available ? "Activo" : "Inactivo"}
            </Text>
          </TouchableOpacity>
        </View>
        <Text className="text-xs text-muted mt-0.5" numberOfLines={1}>
          {item.category_detail?.name || "Sin categoría"}
        </Text>
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-sm font-bold text-brand-600">
            ${parseFloat(item.price).toLocaleString("es-CO")}
          </Text>
          <TouchableOpacity onPress={onEdit} className="p-1" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="edit-2" size={14} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function CommerceProductListScreen() {
  const navigation = useNavigation<NavProp>();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["commerceProducts"],
    queryFn: () => ProductsAPI.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => ProductsAPI.toggleAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commerceProducts"] });
    },
  });

  const handleEdit = useCallback(
    (productId: number) => {
      navigation.navigate("CommerceProductForm", { productId });
    },
    [navigation],
  );

  const handleToggle = useCallback(
    (product: Product) => {
      toggleMutation.mutate(product.id);
    },
    [toggleMutation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        item={item}
        onEdit={() => handleEdit(item.id)}
        onToggle={() => handleToggle(item)}
      />
    ),
    [handleEdit, handleToggle],
  );

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          isLoading ? (
            <View className="flex-1 justify-center items-center pt-20">
              <ActivityIndicator size="large" color="#6C4CF1" />
            </View>
          ) : (
            <View className="items-center pt-20">
              <View className="w-16 h-16 bg-brand-50 rounded-2xl items-center justify-center mb-4">
                <Feather name="package" size={28} color="#6C4CF1" />
              </View>
              <Text className="text-base font-bold text-foreground mb-1">Sin productos</Text>
              <Text className="text-sm text-muted text-center mb-4">
                Agrega tu primer producto para empezar a vender
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("CommerceProductForm", {})}
                className="bg-brand-600 px-6 py-3 rounded-xl"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-sm">Agregar Producto</Text>
              </TouchableOpacity>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      {products && products.length > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate("CommerceProductForm", {})}
          className="absolute bottom-6 right-4 w-14 h-14 bg-brand-600 rounded-full items-center justify-center shadow-lg active:opacity-80"
          style={{ elevation: 6, shadowColor: "#6C4CF1", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
