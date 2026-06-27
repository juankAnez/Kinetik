import API from "./client";
import type { Order, GeoPoint } from "../../types/models";

interface CreateOrderPayload {
  store: number;
  municipio: number;
  payment_method: string;
  delivery_address: string;
  delivery_location: GeoPoint;
  delivery_notes?: string;
  items: Array<{
    product_name: string;
    product_price: string;
    quantity: number;
    subtotal: string;
  }>;
  subtotal: string;
  delivery_fee: string;
  total: string;
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

export const OrdersAPI = {
  async list(status?: string): Promise<Order[]> {
    const params = status ? { status } : {};
    const { data } = await API.get<{ results: Order[] }>("/orders/", { params });
    return data.results ?? [];
  },

  async getById(id: number): Promise<Order> {
    const { data } = await API.get<Order>(`/orders/${id}/`);
    return data;
  },

  async create(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await API.post<Order>("/orders/", payload);
    return data;
  },

  async updateStatus(id: number, status: string, cancelReason?: string): Promise<Order> {
    const body: Record<string, string> = { status };
    if (cancelReason) body.cancel_reason = cancelReason;
    const { data } = await API.post<Order>(`/orders/${id}/status/`, body);
    return data;
  },

  async active(): Promise<Order[]> {
    const { data } = await API.get<Order[]>("/orders/active/");
    return data;
  },

  async stats(): Promise<OrderStats> {
    const { data } = await API.get<OrderStats>("/orders/stats/");
    return data;
  },
};
