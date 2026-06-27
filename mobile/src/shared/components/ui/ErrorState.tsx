import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = "Algo salió mal. Intenta de nuevo.",
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="flex-1 justify-center items-center px-8 pt-16 pb-8 bg-transparent">
      {/* Visual Icon Container with Layered Circles */}
      <View className="relative w-24 h-24 items-center justify-center mb-6">
        <View className="absolute inset-0 bg-red-50 rounded-full opacity-60 scale-100" />
        <View className="absolute w-20 h-20 bg-red-100/50 rounded-full opacity-80 scale-95" />
        <View className="w-16 h-16 bg-white rounded-full items-center justify-center border border-red-100/30 shadow-xs">
          <Feather name="alert-circle" size={26} color="#EF4444" />
        </View>
      </View>

      {/* Text Details */}
      <Text className="text-xl font-black text-slate-800 text-center mb-2 tracking-tight">
        ¡Ups! Algo falló
      </Text>
      
      <Text className="text-sm text-slate-400 text-center leading-relaxed mb-8 max-w-[260px]">
        {message}
      </Text>

      {/* Retry Button */}
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.8}
          className="active:scale-95"
          style={{
            ...Platform.select({
              web: { boxShadow: "0 4px 14px rgba(108, 76, 241, 0.2)" },
              default: {
                shadowColor: "#6C4CF1",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 3,
              },
            }),
          }}
        >
          <LinearGradient
            colors={["#7C3AED", "#6C4CF1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="px-6 py-3.5 rounded-2xl flex-row items-center justify-center"
          >
            <Feather name="refresh-cw" size={14} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-extrabold text-sm tracking-wide">
              Reintentar
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}
