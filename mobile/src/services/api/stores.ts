import API from "./client";
import type { Store, Municipio, Schedule } from "../../types/models";

export interface StoreWritePayload {
  name?: string;
  description?: string;
  logo?: string;
  banner?: string;
  category?: number;
  municipio?: number;
  location?: { type: "Point"; coordinates: [number, number] };
  address?: string;
  phone?: string;
  is_open?: boolean;
  delivery_radius_km?: number;
}

export const StoresAPI = {
  async list(): Promise<Store[]> {
    const { data } = await API.get<{ results: Store[] }>("/stores/");
    return data.results ?? [];
  },

  async getById(id: number): Promise<Store> {
    const { data } = await API.get<Store>(`/stores/${id}/`);
    return data;
  },

  async nearby(lat: number, lng: number, radius?: number): Promise<Store[]> {
    const { data } = await API.get<{ results: Store[] }>("/stores/nearby/", {
      params: { lat, lng, radius },
    });
    return data.results ?? [];
  },

  // Commerce-specific endpoints
  async getMyStore(): Promise<Store> {
    const { data } = await API.get<Store>("/stores/my_store/");
    return data;
  },

  async updateMyStore(payload: StoreWritePayload): Promise<Store> {
    const { data } = await API.patch<Store>("/stores/my_store/", payload);
    return data;
  },

  async create(payload: StoreWritePayload): Promise<Store> {
    const { data } = await API.post<Store>("/stores/", payload);
    return data;
  },

  async update(id: number, payload: StoreWritePayload): Promise<Store> {
    const { data } = await API.patch<Store>(`/stores/${id}/`, payload);
    return data;
  },

  async getSchedules(storeId: number): Promise<Schedule[]> {
    const { data } = await API.get<Schedule[]>(`/stores/${storeId}/schedules/`);
    return data;
  },

  async updateSchedules(storeId: number, schedules: Omit<Schedule, "id">[]): Promise<Schedule[]> {
    const { data } = await API.put<Schedule[]>(`/stores/${storeId}/schedules/`, { schedules });
    return data;
  },
};

export const MunicipiosAPI = {
  async list(): Promise<Municipio[]> {
    const { data } = await API.get<{ results: Municipio[] }>("/municipios/");
    return data.results ?? [];
  },
};
