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

export const OrdersAPI = {
  async list(): Promise<Order[]> {
    const { data } = await API.get<{ results: Order[] }>("/orders/");
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

  async updateStatus(id: number, status: string): Promise<Order> {
    const { data } = await API.post<Order>(`/orders/${id}/status/`, {
      status,
    });
    return data;
  },

  async active(): Promise<Order[]> {
    const { data } = await API.get<Order[]>("/orders/active/");
    return data;
  },
};
