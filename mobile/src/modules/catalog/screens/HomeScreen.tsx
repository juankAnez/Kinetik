import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  Animated,
  Platform,
  StyleSheet,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StoresAPI } from "../../../services/api/stores";
import type { Store } from "../../../types/models";
import type { ClientStackParamList } from "../../../types/navigation";
import StoreCard from "../../../shared/components/StoreCard";
import SearchBar from "../../../shared/components/ui/SearchBar";
import HomeHeader from "../../../shared/components/ui/HomeHeader";
import CategoryChips from "../../../shared/components/ui/CategoryChips";
import { HomeSkeleton, StoreCardSkeleton } from "../../../shared/components/ui/SkeletonLoader";
import EmptyState from "../../../shared/components/ui/EmptyState";
import ErrorState from "../../../shared/components/ui/ErrorState";

type NavProp = NativeStackNavigationProp<ClientStackParamList, "Home">;

function keyExtractor(item: Store) {
  return String(item.id);
}

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // ─── Geolocation ─────────────────────────────────────────────────────────────
  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setUserCoords({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
      }
    } catch {
      // Location permission denied or unavailable — proceed without coords
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // ─── Data Fetching ────────────────────────────────────────────────────────────
  const {
    data: stores,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["stores", userCoords?.lat, userCoords?.lng],
    queryFn: async () => {
      if (userCoords) {
        return StoresAPI.nearby(userCoords.lat, userCoords.lng, 10);
      }
      return StoresAPI.list();
    },
    staleTime: 30_000,
  });

  // ─── Refresh ──────────────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await requestLocation();
    await refetch();
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, [requestLocation, refetch]);

  // ─── Filtering ────────────────────────────────────────────────────────────────
  const filteredStores = useMemo(() => {
    if (!stores) return [];
    let result = stores;

    if (selectedCategory !== null) {
      result = result.filter((s) => s.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          (s.category_name && s.category_name.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [stores, selectedCategory, searchQuery]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleStorePress = useCallback(
    (store: Store) => {
      navigation.navigate("StoreDetail", {
        storeId: store.id,
        storeName: store.name,
      });
    },
    [navigation],
  );

  const handleCategorySelect = useCallback((id: number | null) => {
    setSelectedCategory(id);
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory(null);
  }, []);

  // ─── Render Helpers ───────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item, index }: { item: Store; index: number }) => (
      <StoreCard item={item} onPress={handleStorePress} index={index} />
    ),
    [handleStorePress],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <View>
        {/* Header: greeting, location selector, notifications, avatar */}
        <HomeHeader />

        {/* Search bar + filter button */}
        <View className="px-4 pt-4 pb-3">
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* Category chips horizontal scroller */}
        <CategoryChips
          selected={selectedCategory}
          onSelect={handleCategorySelect}
        />

        {/* Spacer before list */}
        <View className="h-3" />
      </View>
    ),
    [searchQuery, selectedCategory, handleCategorySelect],
  );

  const ListEmptyComponent = useMemo(() => {
    if (isLoading) return null;

    if (isError) {
      return <ErrorState onRetry={handleRetry} />;
    }

    if (searchQuery || selectedCategory !== null) {
      return (
        <EmptyState
          icon="search"
          title="Sin resultados"
          description={`No encontramos tiendas${searchQuery ? ` para "${searchQuery}"` : ""}${selectedCategory ? " en esta categoría" : ""}.`}
          actionLabel="Limpiar filtros"
          onAction={handleClearFilters}
        />
      );
    }

    return (
      <EmptyState
        icon="map-pin"
        title="No hay tiendas disponibles"
        description="No encontramos tiendas cerca de tu ubicación. Intenta cambiar tu dirección."
      />
    );
  }, [isLoading, isError, searchQuery, selectedCategory, handleRetry, handleClearFilters]);

  // ─── Full-page Loading Skeleton ───────────────────────────────────────────────
  if (isLoading && !stores) {
    return <HomeSkeleton />;
  }

  // ─── Main Screen ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={filteredStores}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6C4CF1"
            colors={["#6C4CF1"]}
            progressBackgroundColor="#FFFFFF"
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        // ─── Performance ───────────────────────────────────────────
        initialNumToRender={5}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={50}
        windowSize={9}
        removeClippedSubviews={Platform.OS !== "web"}
        getItemLayout={(_data, index) => ({
          length: CARD_HEIGHT,
          offset: CARD_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

// Approximate rendered height of each StoreCard (banner 176 + padding + content ~120)
const CARD_HEIGHT = 316;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // bg-slate-50
  },
  listContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },
});
