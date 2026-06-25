import API from "./client";
import type { Store, Municipio } from "../../types/models";

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
};

export const MunicipiosAPI = {
  async list(): Promise<Municipio[]> {
    const { data } = await API.get<{ results: Municipio[] }>("/municipios/");
    return data.results ?? [];
  },
};
