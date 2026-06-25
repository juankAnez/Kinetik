import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Image,
  ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../../types/navigation";
import { loginSchema, type LoginFormData } from "../schemas";
import { useLogin } from "../hooks/useAuth";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

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

  const renderForm = () => (
    <View className="w-full max-w-md px-6 py-8 md:px-8 bg-white rounded-3xl shadow-2xl border border-slate-100/50">
      {/* Brand Header */}
      <View className="items-center mb-8">
        <View className="w-14 h-14 bg-[#6C4CF1] rounded-2xl items-center justify-center shadow-lg shadow-[#6C4CF1]/20 mb-4">
          <Feather name="truck" size={28} color="white" />
        </View>
        <Text className="text-3xl font-black text-[#111827] tracking-tight">
          Kinetik
        </Text>
        <Text className="text-[#6B7280] text-sm text-center mt-2 font-medium">
          ¡Bienvenido de vuelta! Inicia sesión para continuar
        </Text>
      </View>

      {/* Form Fields */}
      <View className="space-y-4">
        {/* Username/Email Field */}
        <View>
          <Text className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-2">
            Usuario o Correo
          </Text>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className={`flex-row items-center border rounded-xl px-3 bg-slate-50/50 ${
                  isUsernameFocused ? "border-[#6C4CF1] bg-white" : "border-slate-200"
                }`}
              >
                <Feather
                  name="user"
                  size={18}
                  color={isUsernameFocused ? "#6C4CF1" : "#94A3B8"}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  className="flex-1 py-3 text-base text-[#111827]"
                  placeholder="name@example.com"
                  placeholderTextColor="#94A3B8"
                  onBlur={() => {
                    onBlur();
                    setIsUsernameFocused(false);
                  }}
                  onFocus={() => setIsUsernameFocused(true)}
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize="none"
                />
              </View>
            )}
          />
          {errors.username && (
            <View className="flex-row items-center mt-1.5 ml-1">
              <Feather name="alert-circle" size={12} color="#EF4444" style={{ marginRight: 4 }} />
              <Text className="text-red-500 text-xs font-medium">
                {errors.username.message}
              </Text>
            </View>
          )}
        </View>

        {/* Password Field */}
        <View>
          <Text className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-2">
            Contraseña
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className={`flex-row items-center border rounded-xl px-3 bg-slate-50/50 ${
                  isPasswordFocused ? "border-[#6C4CF1] bg-white" : "border-slate-200"
                }`}
              >
                <Feather
                  name="lock"
                  size={18}
                  color={isPasswordFocused ? "#6C4CF1" : "#94A3B8"}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  className="flex-1 py-3 text-base text-[#111827]"
                  placeholder="Tu contraseña"
                  placeholderTextColor="#94A3B8"
                  onBlur={() => {
                    onBlur();
                    setIsPasswordFocused(false);
                  }}
                  onFocus={() => setIsPasswordFocused(true)}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                  <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.password && (
            <View className="flex-row items-center mt-1.5 ml-1">
              <Feather name="alert-circle" size={12} color="#EF4444" style={{ marginRight: 4 }} />
              <Text className="text-red-500 text-xs font-medium">
                {errors.password.message}
              </Text>
            </View>
          )}
        </View>

        {/* Remember me & Forgot Password */}
        <View className="flex-row items-center justify-between py-1">
          <TouchableOpacity
            onPress={() => setRememberMe(!rememberMe)}
            className="flex-row items-center"
            activeOpacity={0.8}
          >
            <Feather
              name={rememberMe ? "check-square" : "square"}
              size={18}
              color={rememberMe ? "#6C4CF1" : "#94A3B8"}
              style={{ marginRight: 6 }}
            />
            <Text className="text-sm text-[#6B7280] font-medium">Recordarme</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7}>
            <Text className="text-sm text-[#6C4CF1] font-bold">
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>
        </View>

        {loginMutation.isError && (
          <View className="flex-row items-center justify-center bg-red-50 border border-red-100 rounded-xl p-3 mt-2">
            <Feather name="x-circle" size={16} color="#EF4444" style={{ marginRight: 8 }} />
            <Text className="text-red-600 text-sm font-medium">
              Usuario o contraseña incorrectos
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          className={`bg-[#6C4CF1] active:bg-[#8B5CF6] rounded-xl py-3.5 items-center mt-4 shadow-lg shadow-[#6C4CF1]/20 ${
            loginMutation.isPending ? "opacity-75" : ""
          }`}
          onPress={handleSubmit(onSubmit)}
          disabled={loginMutation.isPending}
          activeOpacity={0.9}
        >
          {loginMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base tracking-wide">
              Iniciar Sesión
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View className="flex-row items-center my-6">
        <View className="flex-1 h-[1px] bg-slate-100" />
        <Text className="text-xs font-semibold text-[#94A3B8] px-3 uppercase tracking-wider">
          O continuar con
        </Text>
        <View className="flex-1 h-[1px] bg-slate-100" />
      </View>

      {/* Social Logins */}
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity
          className="flex-row items-center justify-center border border-slate-200 active:bg-slate-50 rounded-xl py-3 flex-1 mr-2"
          activeOpacity={0.8}
        >
          <FontAwesome name="google" size={16} color="#111827" style={{ marginRight: 8 }} />
          <Text className="text-sm font-semibold text-[#111827]">Google</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center justify-center border border-slate-200 active:bg-slate-50 rounded-xl py-3 flex-1 ml-2"
          activeOpacity={0.8}
        >
          <FontAwesome name="apple" size={16} color="#111827" style={{ marginRight: 8 }} />
          <Text className="text-sm font-semibold text-[#111827]">Apple</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Up Link */}
      <TouchableOpacity
        className="mt-4"
        onPress={() => navigation.navigate("Register")}
        activeOpacity={0.7}
      >
        <Text className="text-[#6B7280] text-center text-sm font-medium">
          ¿No tienes cuenta?{" "}
          <Text className="text-[#6C4CF1] font-bold">Regístrate</Text>
        </Text>
      </TouchableOpacity>

      {/* Footer */}
      <View className="mt-8 border-t border-slate-100 pt-4 items-center">
        <Text className="text-xs text-[#94A3B8] font-medium text-center">
          © {new Date().getFullYear()} Kinetik Inc. Todos los derechos reservados.
        </Text>
      </View>
    </View>
  );

  if (isLargeScreen) {
    return (
      <View className="flex-1 flex-row items-stretch bg-slate-50">
        {/* Left Column: Brand & Illustration */}
        <View className="flex-1 bg-[#6C4CF1] items-center justify-center p-12 relative overflow-hidden">
          <LinearGradient
            colors={["#6C4CF1", "#8B5CF6"]}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          />
          {/* Decorative circles */}
          <View
            className="absolute rounded-full bg-white/5"
            style={{ top: -100, left: -100, width: 400, height: 400 }}
          />
          <View
            className="absolute rounded-full bg-white/5"
            style={{ bottom: -150, right: -150, width: 500, height: 500 }}
          />

          <View className="w-full max-w-lg items-center z-10">
            <Image
              source={require("../../../../assets/delivery_illustration.png")}
              style={{ width: 350, height: 350, resizeMode: "contain" }}
              className="mb-8"
            />
            <Text className="text-white text-4xl font-extrabold tracking-tight mb-4 text-center">
              Entregas ultra rápidas
            </Text>
            <Text className="text-indigo-100 text-lg font-medium text-center leading-relaxed">
              La plataforma de domicilios líder para tu negocio y hogar. Tus comercios favoritos al alcance de un clic.
            </Text>
          </View>
        </View>

        {/* Right Column: Form */}
        <View className="flex-1 items-center justify-center p-8 bg-slate-50">
          {renderForm()}
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#F8FAFC", "#EEF2FF"]}
      className="flex-1"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
        >
          {/* Mobile View */}
          <View className="flex-1 items-center justify-center p-4">
            {renderForm()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
