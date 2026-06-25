import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../../stores/authStore";
import { AuthAPI } from "../../../services/api/auth";
import type { RegisterFormData } from "../schemas";

export function useLogin() {
  const { setUser, setTokens } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      const tokens = await AuthAPI.login(username, password);
      await setTokens(tokens.access, tokens.refresh);

      const user = await AuthAPI.getMe();
      await setUser(user);

      return user;
    },
  });
}

export function useRegister() {
  const { setUser, setTokens } = useAuthStore();

  return useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const user = await AuthAPI.register({
        username: data.username,
        password: data.password,
        password2: data.password2,
        email: data.email,
        phone: data.phone,
        user_type: data.user_type,
        first_name: data.first_name,
        last_name: data.last_name,
        municipio: data.municipio,
      });

      const tokens = await AuthAPI.login(data.username, data.password);
      await setTokens(tokens.access, tokens.refresh);
      await setUser(user);

      return user;
    },
  });
}
