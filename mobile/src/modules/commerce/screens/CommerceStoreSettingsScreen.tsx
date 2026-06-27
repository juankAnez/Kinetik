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
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { StoresAPI } from "../../../services/api/stores";
import { MunicipiosAPI } from "../../../services/api/stores";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function CommerceStoreSettingsScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    delivery_radius_km: "5",
    is_open: true,
  });

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["myStore"],
    queryFn: () => StoresAPI.getMyStore().catch(() => null),
  });

  const { data: municipios } = useQuery({
    queryKey: ["municipios"],
    queryFn: () => MunicipiosAPI.list(),
  });

  useEffect(() => {
    if (store) {
      setForm({
        name: store.name || "",
        description: store.description || "",
        address: store.address || "",
        phone: store.phone || "",
        delivery_radius_km: String(store.delivery_radius_km || 5),
        is_open: store.is_open ?? true,
      });
    }
  }, [store]);

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) => {
      const payload: Parameters<typeof StoresAPI.updateMyStore>[0] = {
        ...data,
        delivery_radius_km: parseFloat(data.delivery_radius_km) || 5,
      };
      return store
        ? StoresAPI.updateMyStore(payload)
        : StoresAPI.create({ ...payload, location: { type: "Point", coordinates: [-75.5658, 6.2476] }, municipio: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myStore"] });
      navigation.goBack();
    },
  });

  const handleSave = useCallback(() => {
    if (!form.name.trim()) {
      Alert.alert("Error", "El nombre de la tienda es requerido");
      return;
    }
    saveMutation.mutate(form);
  }, [form, saveMutation]);

  if (storeLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#6C4CF1" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Basic Info */}
      <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm" style={{ elevation: 1 }}>
        <Text className="text-base font-bold text-foreground mb-4">Información básica</Text>

        <View className="mb-4">
          <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
            Nombre de la tienda *
          </Text>
          <TextInput
            className="bg-gray-50 rounded-xl px-4 py-3 text-foreground text-base"
            placeholder="Ej: La Burguesa"
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
            placeholder="Describe tu negocio..."
            placeholderTextColor="#94A3B8"
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            multiline
            numberOfLines={3}
            style={{ outlineStyle: "none", minHeight: 80, textAlignVertical: "top" } as any}
          />
        </View>

        <View className="mb-4">
          <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
            Dirección
          </Text>
          <TextInput
            className="bg-gray-50 rounded-xl px-4 py-3 text-foreground text-base"
            placeholder="Calle 123 #45-67"
            placeholderTextColor="#94A3B8"
            value={form.address}
            onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
            style={{ outlineStyle: "none" } as any}
          />
        </View>

        <View className="flex-row space-x-3">
          <View className="flex-1">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Teléfono
            </Text>
            <TextInput
              className="bg-gray-50 rounded-xl px-4 py-3 text-foreground text-base"
              placeholder="3001234567"
              placeholderTextColor="#94A3B8"
              value={form.phone}
              onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              keyboardType="phone-pad"
              style={{ outlineStyle: "none" } as any}
            />
          </View>
          <View className="w-24">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Radio (km)
            </Text>
            <TextInput
              className="bg-gray-50 rounded-xl px-4 py-3 text-foreground text-base"
              value={form.delivery_radius_km}
              onChangeText={(v) => setForm((f) => ({ ...f, delivery_radius_km: v }))}
              keyboardType="numeric"
              style={{ outlineStyle: "none" } as any}
            />
          </View>
        </View>
      </View>

      {/* Status Toggle */}
      <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm" style={{ elevation: 1 }}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base font-bold text-foreground">Estado de la tienda</Text>
            <Text className="text-xs text-muted mt-0.5">
              {form.is_open ? "Abierta para recibir pedidos" : "Cerrada, no recibirás pedidos"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setForm((f) => ({ ...f, is_open: !f.is_open }))}
            className={`w-14 h-7 rounded-full items-center justify-center ${form.is_open ? "bg-emerald-500" : "bg-gray-300"}`}
            activeOpacity={0.8}
          >
            <View
              className={`w-5 h-5 bg-white rounded-full absolute ${form.is_open ? "right-1" : "left-1"}`}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Button */}
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
            {store ? "Guardar Cambios" : "Crear Tienda"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
