import API from "./client";
import type { Product } from "../../types/models";

export interface ProductWritePayload {
  name?: string;
  description?: string;
  price?: string;
  compare_price?: string;
  image?: string;
  is_available?: boolean;
  stock?: number;
  preparation_time?: number;
  category?: number;
  category_name?: string;
  sort_order?: number;
  options?: Array<{
    name: string;
    choices: Array<{ label: string; price: string }>;
    required?: boolean;
    max_choices?: number;
  }>;
}

export interface ProductCategory {
  id: number;
  name: string;
  order: number;
  product_count?: number;
}

export const ProductsAPI = {
  async list(params?: { store?: number; category?: number }): Promise<Product[]> {
    const { data } = await API.get<{ results: Product[] }>("/products/", { params });
    return data.results ?? [];
  },

  async getById(id: number): Promise<Product> {
    const { data } = await API.get<Product>(`/products/${id}/`);
    return data;
  },

  // Commerce-specific endpoints
  async create(payload: ProductWritePayload): Promise<Product> {
    const { data } = await API.post<Product>("/products/", payload);
    return data;
  },

  async update(id: number, payload: ProductWritePayload): Promise<Product> {
    const { data } = await API.patch<Product>(`/products/${id}/`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await API.delete(`/products/${id}/`);
  },

  async toggleAvailability(id: number): Promise<{ is_available: boolean }> {
    const { data } = await API.post<{ is_available: boolean }>(
      `/products/${id}/toggle_availability/`
    );
    return data;
  },

  async listCategories(): Promise<ProductCategory[]> {
    const { data } = await API.get<ProductCategory[]>("/products/categories/");
    return data;
  },

  async createCategory(payload: { name: string; order?: number }): Promise<ProductCategory> {
    const { data } = await API.post<ProductCategory>("/products/categories/", payload);
    return data;
  },

  async updateCategory(id: number, payload: { name: string; order?: number }): Promise<ProductCategory> {
    const { data } = await API.put<ProductCategory>(`/products/categories/${id}/`, payload);
    return data;
  },

  async deleteCategory(id: number): Promise<void> {
    await API.delete(`/products/categories/${id}/`);
  },
};
