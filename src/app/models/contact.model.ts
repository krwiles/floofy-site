export interface CreateContactRequest {
  name: string;
  email: string;
  message: string;
}

export interface CreateContactResponse {
  message: string;
}
