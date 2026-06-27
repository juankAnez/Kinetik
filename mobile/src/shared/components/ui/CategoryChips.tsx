import { useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface Category {
  id: number;
  name: string;
  icon?: keyof typeof Feather.glyphMap;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 0, name: "Todos", icon: "grid" },
  { id: 1, name: "Restaurante", icon: "coffee" },
  { id: 2, name: "Farmacia", icon: "thermometer" },
  { id: 3, name: "Mercado", icon: "shopping-bag" },
  { id: 4, name: "Licores", icon: "droplet" },
  { id: 5, name: "Mascotas", icon: "heart" },
  { id: 6, name: "Flores", icon: "gift" },
  { id: 7, name: "Helados", icon: "sun" },
  { id: 8, name: "Panadería", icon: "home" },
];

const CATEGORY_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Restaurante: "coffee",
  Farmacia: "thermometer",
  Mercado: "shopping-bag",
  Licores: "droplet",
  Mascotas: "heart",
  Flores: "gift",
  Helados: "sun",
  Panadería: "home",
};

interface CategoryChipsProps {
  selected: number | null;
  onSelect: (id: number | null) => void;
  categories?: Category[];
}

interface ChipProps {
  item: Category;
  isSelected: boolean;
  onPress: () => void;
}

function Chip({ item, isSelected, onPress }: ChipProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const selectAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(selectAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [scale]);

  const icon = item.icon || CATEGORY_ICONS[item.name] || "grid";

  // Animated interpolations for premium transitioning
  const chipBg = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#F1F5F9", "#6C4CF1"],
  });

  const borderCol = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E2E8F0", "#5B3FD9"],
  });

  return (
    <Animated.View style={{ transform: [{ scale }] }} className="py-2">
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Animated.View
          className="flex-row items-center pl-1.5 pr-4 py-1.5 rounded-full mr-3 border"
          style={[
            {
              backgroundColor: chipBg,
              borderColor: borderCol,
              shadowColor: isSelected ? "#6C4CF1" : "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isSelected ? 0.2 : 0.02,
              shadowRadius: 4,
              elevation: isSelected ? 3 : 0,
            },
            Platform.OS === "web" && ({
              boxShadow: isSelected
                ? "0 4px 12px rgba(108, 76, 241, 0.25)"
                : "0 1px 2px rgba(0, 0, 0, 0.02)",
            } as any),
          ]}
        >
          {/* Inner Circle for Icon Wrapper */}
          <View
            className={`w-7 h-7 rounded-full items-center justify-center mr-2 ${
              isSelected ? "bg-white/20" : "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
            }`}
          >
            <Feather
              name={icon}
              size={13}
              color={isSelected ? "#FFFFFF" : "#6C4CF1"}
            />
          </View>
          <Text
            className={`text-xs font-bold tracking-tight ${
              isSelected ? "text-white" : "text-slate-600"
            }`}
          >
            {item.name}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CategoryChips({
  selected,
  onSelect,
  categories,
}: CategoryChipsProps) {
  const chips = categories || DEFAULT_CATEGORIES;

  return (
    <View className="py-0.5">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        className="overflow-visible"
      >
        {chips.map((item) => (
          <Chip
            key={item.id}
            item={item}
            isSelected={
              item.id === 0
                ? selected === null
                : selected === item.id
            }
            onPress={() => onSelect(item.id === 0 ? null : item.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export { DEFAULT_CATEGORIES, CATEGORY_ICONS };
export type { Category };
