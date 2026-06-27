import { Platform } from "react-native";

const PROD_API_URL = "https://api.kinetik.app/api/v1";

function getDevApiUrl(): string {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8080/api/v1";
  }
  return "http://localhost:8080/api/v1";
}

export const API_URL = __DEV__ ? getDevApiUrl() : PROD_API_URL;

export const WS_URL = API_URL.replace("/api/v1", "/ws");
