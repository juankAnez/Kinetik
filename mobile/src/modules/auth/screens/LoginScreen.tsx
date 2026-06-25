import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../../types/navigation";
import { loginSchema, type LoginFormData } from "../schemas";
import { useLogin } from "../hooks/useAuth";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const loginMutation = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white justify-center px-6"
    >
      <View className="mb-10">
        <Text className="text-3xl font-bold text-amber-600 text-center">
          Kinetik
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          Inicia sesión para continuar
        </Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Usuario
          </Text>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-gray-50"
                placeholder="Tu usuario"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
              />
            )}
          />
          {errors.username && (
            <Text className="text-red-500 text-xs mt-1">
              {errors.username.message}
            </Text>
          )}
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-gray-50"
                placeholder="Tu contraseña"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
              />
            )}
          />
          {errors.password && (
            <Text className="text-red-500 text-xs mt-1">
              {errors.password.message}
            </Text>
          )}
        </View>

        {loginMutation.isError && (
          <Text className="text-red-500 text-sm text-center">
            Usuario o contraseña incorrectos
          </Text>
        )}

        <TouchableOpacity
          className={`bg-amber-500 rounded-lg py-3 items-center mt-2 ${
            loginMutation.isPending ? "opacity-50" : ""
          }`}
          onPress={handleSubmit(onSubmit)}
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Iniciar sesión
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="mt-6"
        onPress={() => navigation.navigate("Register")}
      >
        <Text className="text-gray-600 text-center">
          ¿No tienes cuenta?{" "}
          <Text className="text-amber-600 font-semibold">Regístrate</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
