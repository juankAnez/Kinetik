import API from "./client";
import type { TrackingPoint } from "../../types/models";

export const TrackingAPI = {
  async getOrderHistory(orderId: number): Promise<TrackingPoint[]> {
    const { data } = await API.get<{ results: TrackingPoint[] }>(
      "/tracking/order_history/",
      { params: { order_id: orderId } },
    );
    return data.results ?? [];
  },
};
