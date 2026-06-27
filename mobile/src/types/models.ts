export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  user_type: "CLIENTE" | "COMERCIO" | "DOMICILIARIO" | "ADMIN";
  municipio: number;
  municipio_nombre?: string;
}

export interface Municipio {
  id: number;
  codigo_dane: string;
  nombre: string;
  centro_lat: number;
  centro_lng: number;
  radio_km: number;
  activo: boolean;
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  banner?: string;
  category: number;
  category_name?: string;
  municipio: number;
  is_active: boolean;
  is_open?: boolean;
  location: GeoPoint;
  address?: string;
  phone?: string;
  delivery_radius_km: number;
  avg_rating?: number;
  review_count?: number;
  distance_km?: number;
  schedules?: Schedule[];
  plan?: string;
  commission_rate?: number;
  total_orders?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Schedule {
  id: number;
  store?: number;
  day?: number;
  day_of_week?: number;
  open_time: string;
  close_time: string;
  opens?: string;
  closes?: string;
  is_active?: boolean;
  is_closed?: boolean;
}

export interface Product {
  id: number;
  store: number;
  name: string;
  description: string;
  price: string;
  compare_price?: string;
  image?: string;
  category: number;
  category_name?: string;
  category_detail?: { id: number; name: string; order: number };
  is_available: boolean;
  stock?: number;
  preparation_time?: number;
  sort_order?: number;
  options?: ProductOption[];
  created_at?: string;
  updated_at?: string;
}

export interface ProductOption {
  name: string;
  choices: { label: string; price: string }[];
}

export interface Order {
  id: number;
  client: number;
  store: number;
  store_name?: string;
  store_logo?: string;
  store_address?: string;
  store_location?: GeoPoint;
  courier?: number | null;
  municipio: number;
  status: OrderStatus;
  payment_method: PaymentMethodType;
  payment_status: PaymentStatus;
  delivery_address: string;
  delivery_location: GeoPoint;
  delivery_notes?: string;
  items: OrderItem[];
  subtotal: string;
  delivery_fee: string;
  discount: string;
  total: string;
  commission: string;
  courier_earnings: string;
  created_at: string;
  accepted_at?: string;
  prepared_at?: string;
  ready_at?: string;
  assigned_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  estimated_delivery_time?: string;
  cancel_reason?: string;
}

export interface OrderItem {
  id: number;
  product_name: string;
  product_price: string;
  quantity: number;
  options: Record<string, string>;
  subtotal: string;
}

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "ASSIGNED"
  | "PICKED_UP"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentMethodType = "CARD" | "PSE" | "NEQUI" | "CASH";
export type PaymentStatus = "PENDING" | "COLLECTED" | "REFUNDED";

export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface Transaction {
  id: number;
  order: number;
  amount: string;
  gateway: string;
  gateway_transaction_id: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  payment_method: string;
  fee: string;
  created_at: string;
}

export interface Wallet {
  id: number;
  user: number;
  balance: string;
  blocked_balance: string;
  last_payout_at?: string;
}

export interface Notification {
  id: number;
  recipient: number;
  notification_type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: number;
  order: number;
  participants: number[];
  created_at: string;
  last_message?: Message;
}

export interface Message {
  id: number;
  conversation: number;
  sender: number;
  content: string;
  created_at: string;
}

export interface Review {
  id: number;
  order: number;
  reviewer: number;
  store_rating?: number;
  store_comment?: string;
  courier_rating?: number;
  courier_comment?: string;
  created_at: string;
}

export interface CourierStatus {
  is_online: boolean;
  current_order_count: number;
  avg_rating: number;
}

export interface TrackingPoint {
  id: number;
  order: number;
  courier: number;
  location: GeoPoint;
  timestamp: string;
}
