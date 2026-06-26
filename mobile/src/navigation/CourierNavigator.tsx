import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { CourierStackParamList } from "../types/navigation";
import CourierHomeScreen from "../modules/courier/screens/CourierHomeScreen";
import AssignedOrderScreen from "../modules/courier/screens/AssignedOrderScreen";

const Stack = createNativeStackNavigator<CourierStackParamList>();

export default function CourierNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#059669" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen
        name="CourierHome"
        component={CourierHomeScreen}
        options={{ title: "Kinetik Courier" }}
      />
      <Stack.Screen
        name="AssignedOrder"
        component={AssignedOrderScreen}
        options={{ title: "Pedido asignado" }}
      />
    </Stack.Navigator>
  );
}
