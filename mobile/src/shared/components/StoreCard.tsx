import { useRef, useCallback, memo, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Store } from "../../types/models";

interface StoreCardProps {
  item: Store;
  onPress: (store: Store) => void;
  index?: number;
}

function StoreCard({ item, onPress, index = 0 }: StoreCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  
  const [isFavorite, setIsFavorite] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
      tension: 180,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 180,
    }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    onPress(item);
  }, [onPress, item]);

  const toggleFavorite = useCallback((e: any) => {
    e.stopPropagation(); // Evita navegar al pulsar favorito
    setIsFavorite((prev) => !prev);
    
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.3,
        useNativeDriver: true,
        friction: 4,
        tension: 140,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
        tension: 140,
      })
    ]).start();
  }, [heartScale]);

  useEffect(() => {
    const delay = Math.min(index * 60, 300);
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, [index, opacity, translateY]);

  const rating = item.avg_rating ?? 0;
  const isNew = index < 2;
  const isPopular = rating >= 4.5 || item.delivery_radius_km <= 5;
  const isOffer = index % 3 === 0;

  // Lógica dinámica comercial para delivery
  const deliveryTime = item.distance_km 
    ? item.distance_km < 2 
      ? "10-20 min" 
      : item.distance_km < 5 
        ? "20-30 min" 
        : "30-45 min"
    : "15-25 min";

  const deliveryFee = item.distance_km
    ? Math.round(item.distance_km * 800 + 1900)
    : 2900;

  const formattedDeliveryFee = isOffer 
    ? "Envío Gratis" 
    : `$${Math.round(deliveryFee / 100) * 100}`;

  return (
    <Animated.View
      style={{
        transform: [{ scale }, { translateY }],
        opacity,
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
        className="mx-4 mb-5 bg-white rounded-[24px] overflow-hidden border border-slate-100"
        style={{
          ...Platform.select({
            web: {
              boxShadow: "0 6px 20px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)",
              transition: "box-shadow 0.2s ease, transform 0.2s ease",
            },
            default: {
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.04,
              shadowRadius: 16,
              elevation: 2,
            },
          }),
        }}
      >
        {/* Banner Image Container */}
        <View className="h-44 bg-slate-50 relative">
          {item.banner ? (
            <Image
              source={{ uri: item.banner }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={["#EDE9FE", "#DDD6FE"]}
              className="flex-1 justify-center items-center"
            >
              <View className="w-14 h-14 bg-brand-600/10 rounded-2xl items-center justify-center">
                <Text className="text-2xl font-black text-brand-600">
                  {item.name[0]}
                </Text>
              </View>
            </LinearGradient>
          )}

          {/* Sutil Dark Gradient Overlay at the bottom of the image for contrast */}
          <LinearGradient
            colors={["transparent", "rgba(15, 23, 42, 0.45)"]}
            className="absolute inset-x-0 bottom-0 h-16"
            pointerEvents="none"
          />

          {/* Top Left Badges */}
          <View className="absolute top-3.5 left-3.5 flex-row space-x-1.5">
            {isNew && (
              <LinearGradient
                colors={["#10B981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="px-2.5 py-1 rounded-full shadow-sm"
              >
                <Text className="text-white text-[10px] font-extrabold uppercase tracking-wider">Nuevo</Text>
              </LinearGradient>
            )}
            {isPopular && (
              <LinearGradient
                colors={["#F59E0B", "#D97706"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="px-2.5 py-1 rounded-full shadow-sm"
              >
                <Text className="text-white text-[10px] font-extrabold uppercase tracking-wider">Popular</Text>
              </LinearGradient>
            )}
            {isOffer && (
              <LinearGradient
                colors={["#EF4444", "#DC2626"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="px-2.5 py-1 rounded-full shadow-sm"
              >
                <Text className="text-white text-[10px] font-extrabold uppercase tracking-wider">Descuento</Text>
              </LinearGradient>
            )}
          </View>

          {/* Interactive Favorite Button (Heart) */}
          <TouchableOpacity
            onPress={toggleFavorite}
            className="absolute top-3.5 right-3.5 w-9 h-9 bg-white/95 rounded-full items-center justify-center border border-slate-100 shadow-sm"
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Feather
                name="heart"
                size={16}
                color={isFavorite ? "#EF4444" : "#64748B"}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Distance Badge Floating in Bottom Right */}
          {item.distance_km !== undefined && (
            <View className="absolute bottom-3.5 right-3.5 bg-white/95 border border-slate-100/50 px-2.5 py-1 rounded-full flex-row items-center shadow-xs">
              <Feather name="map-pin" size={10} color="#6C4CF1" style={{ marginRight: 3 }} />
              <Text className="text-[10px] font-bold text-slate-700">
                {item.distance_km.toFixed(1)} km
              </Text>
            </View>
          )}
        </View>

        {/* Info Card Content */}
        <View className="p-4">
          {/* Row 1: Name and Rating */}
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-base font-extrabold text-slate-800 flex-1 mr-2 tracking-tight" numberOfLines={1}>
              {item.name}
            </Text>
            {rating > 0 && (
              <View className="flex-row items-center bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded-lg">
                <Feather name="star" size={11} color="#F59E0B" />
                <Text className="ml-1 text-[11px] font-extrabold text-amber-700">
                  {rating.toFixed(1)}
                </Text>
                {item.review_count !== undefined && item.review_count > 0 && (
                  <Text className="text-[10px] text-amber-600 font-medium ml-0.5">
                    ({item.review_count})
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Row 2: Description */}
          {item.description && (
            <Text className="text-xs text-slate-500 leading-tight mb-3" numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {/* Divider */}
          <View className="h-[1px] bg-slate-100/80 w-full mb-3" />

          {/* Row 3: Delivery Info & Action Button */}
          <View className="flex-row items-center justify-between">
            {/* Delivery Stats group */}
            <View className="flex-row items-center space-x-3.5">
              {/* Delivery Time */}
              <View className="flex-row items-center">
                <Feather name="clock" size={11} color="#64748B" style={{ marginRight: 4 }} />
                <Text className="text-[11px] font-semibold text-slate-600">{deliveryTime}</Text>
              </View>

              {/* Dot Separator */}
              <View className="w-1 h-1 rounded-full bg-slate-300" />

              {/* Delivery Price */}
              <View className="flex-row items-center">
                <Feather name="shopping-bag" size={11} color="#64748B" style={{ marginRight: 4 }} />
                <Text
                  className={`text-[11px] font-semibold ${
                    isOffer ? "text-emerald-600 font-bold" : "text-slate-600"
                  }`}
                >
                  {formattedDeliveryFee}
                </Text>
              </View>
            </View>

            {/* "Ver menú" CTA Button */}
            <View className="flex-row items-center bg-brand-50 px-2.5 py-1 rounded-xl border border-brand-100/30">
              <Text className="text-[10px] font-black text-brand-600 mr-1">Ver menú</Text>
              <Feather name="chevron-right" size={10} color="#6C4CF1" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default memo(StoreCard);
