export interface RegisterRequest {
  name: string;
  lastName?: string;
  email: string;
  password: string;
  country?: string;
  city?: string;
  acceptTerms: boolean;
}
