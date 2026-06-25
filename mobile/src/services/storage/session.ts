import * as SecureStore from "expo-secure-store";

const KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
} as const;

export const SessionStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  },

  async setAccessToken(token: string): Promise<void> {
    return SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },

  async setRefreshToken(token: string): Promise<void> {
    return SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
  },

  async getStoredUser<T>(): Promise<T | null> {
    const raw = await SecureStore.getItemAsync(KEYS.USER_DATA);
    return raw ? JSON.parse(raw) : null;
  },

  async setStoredUser<T>(user: T): Promise<void> {
    return SecureStore.setItemAsync(KEYS.USER_DATA, JSON.stringify(user));
  },

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(KEYS.USER_DATA),
    ]);
  },
};
