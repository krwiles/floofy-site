export interface CreateCommissionRequest {
  name: string;
  email: string;
  commissionType: string;
  description: string;
  referenceLinks: string;
  usageType: string;
  usageExplanation: string;
  estimatedPrice: number;
  deadline: string;
  additionalNotes: string;
}

export interface CreateCommissionResponse {
  message: string;
}
