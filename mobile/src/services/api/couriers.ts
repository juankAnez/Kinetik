import API from "./client";

export const CouriersAPI = {
  async toggleAvailability(): Promise<{ is_available: boolean }> {
    const { data } = await API.post<{ is_available: boolean }>(
      "/couriers/toggle_availability/",
    );
    return data;
  },

  async acceptOrder(orderId: number): Promise<void> {
    await API.post("/couriers/accept_order/", { order_id: orderId });
  },

  async rejectOrder(orderId: number): Promise<void> {
    await API.post("/couriers/reject_order/", { order_id: orderId });
  },
};
