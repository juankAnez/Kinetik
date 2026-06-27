import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import type { RootStackParamList } from "../types/navigation";
import { useAuthStore } from "../stores/authStore";
import AuthNavigator from "./AuthNavigator";
import ClientNavigator from "./ClientNavigator";
import CourierNavigator from "./CourierNavigator";
import CommerceNavigator from "./CommerceNavigator";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
      </Stack.Navigator>
    );
  }

  const role = user.user_type;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {role === "DOMICILIARIO" ? (
        <Stack.Screen name="Courier" component={CourierNavigator} />
      ) : role === "COMERCIO" ? (
        <Stack.Screen name="Commerce" component={CommerceNavigator} />
      ) : (
        <Stack.Screen name="Client" component={ClientNavigator} />
      )}
    </Stack.Navigator>
  );
}
