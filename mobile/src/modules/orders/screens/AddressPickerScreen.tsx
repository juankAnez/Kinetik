import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ClientStackParamList } from "../../../types/navigation";
import { MapsAPI } from "../../../services/api/maps";
import type { GeocodeResult } from "../../../services/api/maps";
import { useCartStore } from "../../../stores/cartStore";

type Props = NativeStackScreenProps<ClientStackParamList, "AddressPicker">;

export default function AddressPickerScreen({ navigation }: Props) {
  const mapRef = useRef<MapView>(null);
  const setDeliveryAddress = useCartStore((s) => s.setDeliveryAddress);
  const setDeliveryLocation = useCartStore((s) => s.setDeliveryLocation);

  const [region, setRegion] = useState({
    latitude: 6.2476,
    longitude: -75.5658,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [pin, setPin] = useState({ latitude: 6.2476, longitude: -75.5658 });
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await MapsAPI.geocode(text);
      setSuggestions(results);
      setSearching(false);
    }, 500);
  }, []);

  const handleSelectSuggestion = useCallback(
    async (result: GeocodeResult) => {
      const lat = result.lat;
      const lng = result.lng;
      setPin({ latitude: lat, longitude: lng });
      setSelectedAddress(result.display_name);
      setSearch(result.display_name);
      setSuggestions([]);

      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    },
    [],
  );

  const handleRegionChangeComplete = useCallback(
    async (newRegion: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    }) => {
      setRegion(newRegion);
      setPin({
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
      });
    },
    [],
  );

  const handleConfirmPin = useCallback(async () => {
    setLoading(true);
    const result = await MapsAPI.reverseGeocode(pin.latitude, pin.longitude);
    if (result) {
      setSelectedAddress(result.display_name);
      setDeliveryAddress(result.display_name);
      setDeliveryLocation({
        type: "Point",
        coordinates: [pin.longitude, pin.latitude],
      });
    } else {
      const fallback = `${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)}`;
      setSelectedAddress(fallback);
      setDeliveryAddress(fallback);
      setDeliveryLocation({
        type: "Point",
        coordinates: [pin.longitude, pin.latitude],
      });
    }
    setLoading(false);
    navigation.goBack();
  }, [pin, navigation, setDeliveryAddress, setDeliveryLocation]);

  return (
    <View className="flex-1">
      <View className="absolute top-4 left-4 right-4 z-10">
        <View className="bg-white rounded-xl shadow-lg overflow-hidden">
          <TextInput
            className="px-4 py-3 text-base"
            placeholder="Buscar dirección..."
            value={search}
            onChangeText={handleSearch}
          />
        </View>
        {searching && (
          <ActivityIndicator
            size="small"
            color="#f59e0b"
            className="mt-2"
          />
        )}
        {suggestions.length > 0 && (
          <FlatList
            data={suggestions}
            keyExtractor={(_, i) => String(i)}
            className="bg-white rounded-xl mt-1 max-h-60 shadow-lg"
            renderItem={({ item }) => (
              <TouchableOpacity
                className="px-4 py-3 border-b border-gray-100"
                onPress={() => handleSelectSuggestion(item)}
              >
                <Text className="text-gray-700 text-sm" numberOfLines={2}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <MapView
        ref={mapRef}
        className="flex-1"
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker
          coordinate={pin}
          title="Ubicación de entrega"
          draggable
          onDragEnd={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setPin({ latitude, longitude });
          }}
        />
      </MapView>

      <View className="absolute bottom-6 left-4 right-4">
        {selectedAddress ? (
          <View className="bg-white rounded-xl p-3 mb-2 shadow-lg">
            <Text className="text-gray-600 text-sm" numberOfLines={2}>
              {selectedAddress}
            </Text>
          </View>
        ) : null}
        <TouchableOpacity
          className="bg-amber-500 rounded-xl py-4 items-center shadow-lg"
          onPress={handleConfirmPin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Confirmar dirección
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
