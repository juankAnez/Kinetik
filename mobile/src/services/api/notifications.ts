import API from "./client";
import type { Notification } from "../../types/models";

export const NotificationsAPI = {
  async list(): Promise<Notification[]> {
    const { data } = await API.get<{ results: Notification[] }>(
      "/notifications/",
    );
    return data.results ?? [];
  },

  async markRead(ids: number[]): Promise<void> {
    await API.post("/notifications/mark_read/", { ids });
  },

  async unreadCount(): Promise<number> {
    const { data } = await API.get<{ count: number }>(
      "/notifications/unread_count/",
    );
    return data.count;
  },
};
