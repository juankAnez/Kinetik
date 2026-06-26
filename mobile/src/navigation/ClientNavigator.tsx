import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ClientStackParamList } from "../types/navigation";
import HomeScreen from "../modules/catalog/screens/HomeScreen";
import StoreDetailScreen from "../modules/catalog/screens/StoreDetailScreen";
import ProductDetailScreen from "../modules/catalog/screens/ProductDetailScreen";
import CartScreen from "../modules/cart/CartScreen";
import CheckoutScreen from "../modules/orders/screens/CheckoutScreen";
import AddressPickerScreen from "../modules/orders/screens/AddressPickerScreen";
import OrderDetailScreen from "../modules/orders/screens/OrderDetailScreen";
import OrderTrackingScreen from "../modules/orders/screens/OrderTrackingScreen";

const Stack = createNativeStackNavigator<ClientStackParamList>();

export default function ClientNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#f59e0b" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Kinetik" }}
      />
      <Stack.Screen
        name="StoreDetail"
        component={StoreDetailScreen}
        options={({ route }) => ({ title: route.params.storeName })}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: "Producto" }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: "Carrito" }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: "Confirmar pedido" }}
      />
      <Stack.Screen
        name="AddressPicker"
        component={AddressPickerScreen}
        options={{ title: "Dirección de entrega" }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: "Pedido" }}
      />
      <Stack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ title: "Tracking en vivo" }}
      />
    </Stack.Navigator>
  );
}
