import API from "./client";
import type { Review } from "../../types/models";

interface CreateReviewPayload {
  order: number;
  store_rating?: number;
  store_comment?: string;
  courier_rating?: number;
  courier_comment?: string;
}

export const ReviewsAPI = {
  async create(payload: CreateReviewPayload): Promise<Review> {
    const { data } = await API.post<Review>("/reviews/", payload);
    return data;
  },
};
