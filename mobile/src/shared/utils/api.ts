const DEV_API_URL = "http://10.0.2.2:8000/api/v1";
const PROD_API_URL = "https://api.kinetik.app/api/v1";

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

export const WS_URL = API_URL.replace("/api/v1", "/ws");
