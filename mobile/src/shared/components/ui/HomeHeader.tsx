import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../../stores/authStore";

interface HomeHeaderProps {
  onNotificationPress?: () => void;
}

export default function HomeHeader({ onNotificationPress }: HomeHeaderProps) {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.first_name || "Usuario";
  const locationName = user?.municipio_nombre || "Medellín, Colombia";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <View
      className="px-5 pt-14 pb-5 bg-white rounded-b-[32px]"
      style={
        Platform.OS === "web"
          ? {
              boxShadow: "0 4px 20px rgba(15, 23, 42, 0.05)",
            }
          : {
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 16,
              elevation: 4,
            }
      }
    >
      {/* Top Location Bar */}
      <View className="flex-row items-center justify-between mb-4">
        {/* Location Selector (Pill Style) */}
        <TouchableOpacity
          className="flex-row items-center bg-slate-50 border border-slate-100/80 px-3.5 py-2 rounded-full active:bg-slate-100"
          activeOpacity={0.7}
          style={{
            ...Platform.select({
              web: { boxShadow: "0 1px 2px rgba(0,0,0,0.02)" },
              default: { elevation: 1 }
            })
          }}
        >
          <View className="w-5 h-5 rounded-full bg-brand-50 items-center justify-center mr-2">
            <Feather name="map-pin" size={11} color="#6C4CF1" />
          </View>
          <View className="mr-1">
            <Text className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none">
              Entregar en
            </Text>
            <Text className="text-xs font-bold text-slate-800 leading-tight" numberOfLines={1}>
              {locationName}
            </Text>
          </View>
          <Feather name="chevron-down" size={12} color="#64748B" style={{ marginLeft: 2 }} />
        </TouchableOpacity>

        {/* Quick Action Buttons (Notifications & Profile) */}
        <View className="flex-row items-center space-x-3">
          {/* Notification Button */}
          <TouchableOpacity
            onPress={onNotificationPress}
            className="w-10 h-10 bg-slate-50 border border-slate-100/80 rounded-full items-center justify-center active:bg-slate-100"
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="bell" size={18} color="#475569" />
            <View className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-brand-500 border-2 border-white rounded-full" />
          </TouchableOpacity>

          {/* User Profile Avatar with Brand Gradient */}
          <TouchableOpacity
            className="active:scale-95"
            activeOpacity={0.9}
            style={{
              shadowColor: "#6C4CF1",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <LinearGradient
              colors={["#7C3AED", "#6C4CF1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-10 h-10 rounded-full items-center justify-center"
            >
              <Text className="text-white font-bold text-sm tracking-wide">
                {firstName[0].toUpperCase()}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Greeting Banner */}
      <View className="flex-row items-center mt-1">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-slate-400">
            {greeting},
          </Text>
          <Text className="text-2xl font-extrabold text-slate-900 tracking-tight" numberOfLines={1}>
            {firstName} <Text className="text-xl">👋</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
