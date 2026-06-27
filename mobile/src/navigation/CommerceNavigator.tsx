import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { CommerceStackParamList } from "../types/navigation";
import CommerceHomeScreen from "../modules/commerce/screens/CommerceHomeScreen";
import CommerceStoreSettingsScreen from "../modules/commerce/screens/CommerceStoreSettingsScreen";
import CommerceProductListScreen from "../modules/commerce/screens/CommerceProductListScreen";
import CommerceProductFormScreen from "../modules/commerce/screens/CommerceProductFormScreen";
import CommerceOrderListScreen from "../modules/commerce/screens/CommerceOrderListScreen";
import CommerceOrderDetailScreen from "../modules/commerce/screens/CommerceOrderDetailScreen";

const Stack = createNativeStackNavigator<CommerceStackParamList>();

export default function CommerceNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#6C4CF1" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen
        name="CommerceHome"
        component={CommerceHomeScreen}
        options={{ title: "Mi Negocio" }}
      />
      <Stack.Screen
        name="CommerceStoreSettings"
        component={CommerceStoreSettingsScreen}
        options={{ title: "Configurar Tienda" }}
      />
      <Stack.Screen
        name="CommerceProductList"
        component={CommerceProductListScreen}
        options={{ title: "Mis Productos" }}
      />
      <Stack.Screen
        name="CommerceProductForm"
        component={CommerceProductFormScreen}
        options={({ route }) => ({
          title: route.params?.productId ? "Editar Producto" : "Nuevo Producto",
        })}
      />
      <Stack.Screen
        name="CommerceOrderList"
        component={CommerceOrderListScreen}
        options={{ title: "Pedidos" }}
      />
      <Stack.Screen
        name="CommerceOrderDetail"
        component={CommerceOrderDetailScreen}
        options={{ title: "Detalle del Pedido" }}
      />
    </Stack.Navigator>
  );
}
