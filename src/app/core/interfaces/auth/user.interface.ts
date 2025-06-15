export interface User {
  id: string;
  name: string;
  lastName?: string;
  email: string;
  country?: string;
  city?: string;
  avatar?: string;
  plan?: string;
  createdAt?: Date;
  lastLogin?: Date;
}
