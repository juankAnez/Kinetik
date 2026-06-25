import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { CourierStackParamList } from "../types/navigation";
import { View, Text } from "react-native";

const Stack = createNativeStackNavigator<CourierStackParamList>();

function CourierHome() {
  return (
    <View className="flex-1 bg-white justify-center items-center">
      <Text className="text-lg text-gray-500">
        Pantalla de domiciliario
      </Text>
    </View>
  );
}

export default function CourierNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#059669" },
        headerTintColor: "#fff",
      }}
    >
      <Stack.Screen
        name="CourierHome"
        component={CourierHome}
        options={{ title: "Kinetik Courier" }}
      />
    </Stack.Navigator>
  );
}
