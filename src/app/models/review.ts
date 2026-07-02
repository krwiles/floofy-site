export interface Review {
  id: number;
  author: string;
  comment: string;
  created_at: string;
}

export interface ReviewSubmission {
  author: string;
  comment: string;
}

export interface ServerResponse {
  message: string;
}
