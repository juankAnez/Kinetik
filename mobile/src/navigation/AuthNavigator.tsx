import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../types/navigation";
import LoginScreen from "../modules/auth/screens/LoginScreen";
import RegisterScreen from "../modules/auth/screens/RegisterScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
