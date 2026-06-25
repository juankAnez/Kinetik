import API from "./client";
import type { Product } from "../../types/models";

export const ProductsAPI = {
  async list(storeId?: number): Promise<Product[]> {
    const params = storeId ? { store: storeId } : {};
    const { data } = await API.get<{ results: Product[] }>("/products/", {
      params,
    });
    return data.results ?? [];
  },

  async getById(id: number): Promise<Product> {
    const { data } = await API.get<Product>(`/products/${id}/`);
    return data;
  },
};
