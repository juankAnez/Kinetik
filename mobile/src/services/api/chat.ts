import API from "./client";
import type { Conversation, Message } from "../../types/models";

export const ChatAPI = {
  async listConversations(): Promise<Conversation[]> {
    const { data } = await API.get<{ results: Conversation[] }>(
      "/chat/conversations/",
    );
    return data.results ?? [];
  },

  async getMessages(conversationId: number): Promise<Message[]> {
    const { data } = await API.get<{ results: Message[] }>(
      `/chat/conversations/${conversationId}/messages/`,
    );
    return data.results ?? [];
  },
};
