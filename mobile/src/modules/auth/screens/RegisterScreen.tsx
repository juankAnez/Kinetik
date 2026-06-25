import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../../types/navigation";
import { registerSchema, type RegisterFormData } from "../schemas";
import { useRegister } from "../hooks/useAuth";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

const USER_TYPES = [
  { value: "CLIENTE" as const, label: "Cliente", desc: "Quiero pedir domicilios" },
  { value: "COMERCIO" as const, label: "Comercio", desc: "Tengo un negocio" },
  { value: "DOMICILIARIO" as const, label: "Domiciliario", desc: "Quiero repartir" },
];

export default function RegisterScreen({ navigation }: Props) {
  const registerMutation = useRegister();
  const [step, setStep] = useState<"type" | "form">("type");

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      first_name: "",
      last_name: "",
      password: "",
      password2: "",
      user_type: "CLIENTE",
      municipio: 0,
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  if (step === "type") {
    return (
      <View className="flex-1 bg-white justify-center px-6">
        <Text className="text-2xl font-bold text-center mb-6">
          ¿Qué tipo de cuenta quieres crear?
        </Text>
        {USER_TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            className="border border-gray-200 rounded-xl p-4 mb-3 bg-gray-50"
            onPress={() => {
              setValue("user_type", t.value);
              setStep("form");
            }}
          >
            <Text className="text-lg font-semibold text-gray-800">
              {t.label}
            </Text>
            <Text className="text-gray-500 text-sm">{t.desc}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          className="mt-4"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-gray-600 text-center">
            ¿Ya tienes cuenta?{" "}
            <Text className="text-amber-600 font-semibold">Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView className="flex-1 px-6 pt-4">
        <Text className="text-2xl font-bold mb-6">Crea tu cuenta</Text>

        <View className="space-y-3">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Nombre
            </Text>
            <Controller
              control={control}
              name="first_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                  placeholder="Tu nombre"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.first_name && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.first_name.message}
              </Text>
            )}
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Apellido
            </Text>
            <Controller
              control={control}
              name="last_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                  placeholder="Tu apellido"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.last_name && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.last_name.message}
              </Text>
            )}
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Usuario
            </Text>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                  placeholder="Nombre de usuario"
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
              Email
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                  placeholder="correo@ejemplo.com"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </Text>
            )}
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                  placeholder="3001234567"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="phone-pad"
                />
              )}
            />
            {errors.phone && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.phone.message}
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
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                  placeholder="Mínimo 6 caracteres"
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

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </Text>
            <Controller
              control={control}
              name="password2"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                  placeholder="Repite la contraseña"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry
                />
              )}
            />
            {errors.password2 && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.password2.message}
              </Text>
            )}
          </View>
        </View>

        {registerMutation.isError && (
          <Text className="text-red-500 text-sm text-center mt-3">
            Error al registrarse, intenta de nuevo
          </Text>
        )}

        <TouchableOpacity
          className={`bg-amber-500 rounded-lg py-3 items-center mt-6 mb-8 ${
            registerMutation.isPending ? "opacity-50" : ""
          }`}
          onPress={handleSubmit(onSubmit)}
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Crear cuenta
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
