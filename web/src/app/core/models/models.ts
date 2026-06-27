export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  user_type: 'CLIENTE' | 'COMERCIO' | 'DOMICILIARIO' | 'ADMIN';
  municipio: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
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
  day: number;
  open_time: string;
  close_time: string;
  is_active: boolean;
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

export interface ProductCategory {
  id: number;
  name: string;
  order: number;
  product_count?: number;
}

export interface Order {
  id: number;
  client: number;
  store: number;
  store_name?: string;
  store_logo?: string;
  courier?: number | null;
  municipio: number;
  status: OrderStatus;
  payment_method: string;
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
  product_name: string;
  product_price: string;
  unit_price?: string;
  quantity: number;
  options: Record<string, string>;
  subtotal: string;
}

export type OrderStatus =
  | 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY'
  | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface OrderStats {
  total_orders: number;
  pending: number;
  accepted: number;
  preparing: number;
  ready: number;
  in_transit: number;
  delivered: number;
  cancelled: number;
  today_orders: number;
  today_revenue: number;
}
