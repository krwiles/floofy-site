export interface Review {
  id: number;
  author: string;
  comment: string;
  created_at: string;
}

export interface CreateReviewRequest {
  author: string;
  comment: string;
}

export interface CreateReviewResponse {
  message: string;
}
