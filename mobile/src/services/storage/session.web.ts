const KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
} as const;

export const SessionStorage = {
  async getAccessToken(): Promise<string | null> {
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
  },

  async setAccessToken(token: string): Promise<void> {
    localStorage.setItem(KEYS.ACCESS_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
  },

  async setRefreshToken(token: string): Promise<void> {
    localStorage.setItem(KEYS.REFRESH_TOKEN, token);
  },

  async getStoredUser<T>(): Promise<T | null> {
    const raw = localStorage.getItem(KEYS.USER_DATA);
    return raw ? JSON.parse(raw) : null;
  },

  async setStoredUser<T>(user: T): Promise<void> {
    localStorage.setItem(KEYS.USER_DATA, JSON.stringify(user));
  },

  async clear(): Promise<void> {
    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    localStorage.removeItem(KEYS.USER_DATA);
  },
};
