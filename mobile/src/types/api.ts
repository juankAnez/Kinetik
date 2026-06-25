export interface ApiResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  password2: string;
  email: string;
  phone: string;
  user_type: "CLIENTE" | "COMERCIO" | "DOMICILIARIO";
  first_name: string;
  last_name: string;
  municipio: number;
}

export interface ApiError {
  detail?: string;
  [key: string]: string | string[] | undefined;
}
