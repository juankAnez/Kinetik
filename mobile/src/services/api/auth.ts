import API from "./client";
import type { AuthTokens, RegisterRequest } from "../../types/api";
import type { User } from "../../types/models";

export const AuthAPI = {
  async login(username: string, password: string): Promise<AuthTokens> {
    const { data } = await API.post<AuthTokens>("/auth/login/", {
      username,
      password,
    });
    return data;
  },

  async register(body: RegisterRequest): Promise<User> {
    const { data } = await API.post<User>("/auth/register/", body);
    return data;
  },

  async refresh(refresh: string): Promise<AuthTokens> {
    const { data } = await API.post<AuthTokens>("/auth/refresh/", { refresh });
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await API.get<User>("/auth/me/");
    return data;
  },

  async updateMe(partial: Partial<User>): Promise<User> {
    const { data } = await API.patch<User>("/auth/me/", partial);
    return data;
  },
};
