import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import type { CommerceStackParamList } from "../../../types/navigation";
import { ProductsAPI } from "../../../services/api/products";

type FormRoute = RouteProp<CommerceStackParamList, "CommerceProductForm">;

export default function CommerceProductFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<FormRoute>();
  const queryClient = useQueryClient();
  const productId = route.params?.productId;
  const isEditing = !!productId;

  const { data: product } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => (productId ? ProductsAPI.getById(productId) : null),
    enabled: isEditing,
  });

  const { data: categories } = useQuery({
    queryKey: ["commerceCategories"],
    queryFn: () => ProductsAPI.listCategories(),
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    compare_price: "",
    stock: "0",
    preparation_time: "15",
    category: undefined as number | undefined,
    category_name: "",
    options: [] as Array<{ name: string; choices: { label: string; price: string }[] }>,
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        compare_price: "",
        stock: String(product.stock ?? 0),
        preparation_time: String(product.preparation_time ?? 15),
        category: product.category_detail?.id,
        category_name: "",
        options: (product.options || []).map((o) => ({
          name: o.name,
          choices: Array.isArray(o.choices) ? o.choices.map((c: any) => ({ label: c.label || "", price: c.price || "0" })) : [],
        })),
      });
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload: Record<string, any> = {
        name: data.name,
        description: data.description,
        price: data.price,
        compare_price: data.compare_price || undefined,
        stock: parseInt(data.stock) || 0,
        preparation_time: parseInt(data.preparation_time) || 15,
        category: data.category,
        category_name: data.category_name,
        options: data.options,
      };
      if (productId) {
        return ProductsAPI.update(productId, payload);
      }
      return ProductsAPI.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commerceProducts"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      navigation.goBack();
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.response?.data?.message || "No se pudo guardar el producto");
    },
  });

  const handleSave = useCallback(() => {
    if (!form.name.trim()) {
      Alert.alert("Error", "El nombre del producto es requerido");
      return;
    }
    if (!form.price || isNaN(parseFloat(form.price))) {
      Alert.alert("Error", "Ingresa un precio válido");
      return;
    }
    saveMutation.mutate(form);
  }, [form, saveMutation]);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Basic Info */}
      <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm" style={{ elevation: 1 }}>
        <Text className="text-base font-bold text-foreground mb-4">Información del producto</Text>

        <View className="mb-4">
          <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
            Nombre *
          </Text>
          <TextInput
            className="bg-gray-50 rounded-xl px-4 py-3 text-foreground text-base"
            placeholder="Ej: Hamburguesa Clásica"
            placeholderTextColor="#94A3B8"
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            style={{ outlineStyle: "none" } as any}
          />
        </View>

        <View className="mb-4">
          <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
            Descripción
          </Text>
          <TextInput
            className="bg-gray-50 rounded-xl px-4 py-3 text-foreground text-base"
            placeholder="Describe el producto..."
            placeholderTextColor="#94A3B8"
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            multiline
            numberOfLines={3}
            style={{ outlineStyle: "none", minHeight: 80, textAlignVertical: "top" } as any}
          />
        </View>

        <View className="flex-row space-x-3 mb-4">
          <View className="flex-1">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Precio *
            </Text>
            <TextInput
              className="bg-gray-50 rounded-xl px-4 py-3 text-foreground text-base"
              placeholder="15000"
              placeholderTextColor="#94A3B8"
              value={form.price}
              onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
              keyboardType="numeric"
              style={{ outlineStyle: "none" } as any}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Precio comparativo
            </Text>
            <TextInput
              className="bg-gray-50 rounded-xl px-4 py-3 text-foreground text-base"
              placeholder="0"
              placeholderTextColor="#94A3B8"
              value={form.compare_price}
              onChangeText={(v) => setForm((f) => ({ ...f, compare_price: v }))}
              keyboardType="numeric"
              style={{ outlineStyle: "none" } as any}
            />
          </View>
        </View>

        <View className="flex-row space-x-3 mb-4">
          <View className="flex-1">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Stock
            </Text>
            <TextInput
              className="bg-gray-50 rounded-xl px-4 py-3 text-foreground text-base"
              value={form.stock}
              onChangeText={(v) => setForm((f) => ({ ...f, stock: v }))}
              keyboardType="numeric"
              style={{ outlineStyle: "none" } as any}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Tiempo prep. (min)
            </Text>
            <TextInput
              className="bg-gray-50 rounded-xl px-4 py-3 text-foreground text-base"
              value={form.preparation_time}
              onChangeText={(v) => setForm((f) => ({ ...f, preparation_time: v }))}
              keyboardType="numeric"
              style={{ outlineStyle: "none" } as any}
            />
          </View>
        </View>

        {/* Category */}
        <View className="mb-2">
          <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
            Categoría
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            <View className="flex-row space-x-2">
              {categories?.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setForm((f) => ({ ...f, category: cat.id, category_name: "" }))}
                  className={`px-4 py-2 rounded-full ${form.category === cat.id ? "bg-brand-600" : "bg-gray-100"}`}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-xs font-semibold ${form.category === cat.id ? "text-white" : "text-muted"}`}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TextInput
            className="bg-gray-50 rounded-xl px-4 py-3 text-foreground text-base"
            placeholder="O escribe una nueva categoría..."
            placeholderTextColor="#94A3B8"
            value={form.category_name}
            onChangeText={(v) => setForm((f) => ({ ...f, category_name: v, category: undefined }))}
            style={{ outlineStyle: "none" } as any}
          />
        </View>
      </View>

      {/* Save */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={saveMutation.isPending}
        className="bg-brand-600 py-4 rounded-2xl items-center shadow-lg shadow-brand-600/20 active:opacity-80"
        activeOpacity={0.8}
      >
        {saveMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-base">
            {isEditing ? "Guardar Cambios" : "Crear Producto"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
