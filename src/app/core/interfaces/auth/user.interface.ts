export interface User {
  id: string;
  email: string;
  username?: string; // Para compatibilidad con el backend
  avatar?: string;
  plan?: string;
  createdAt?: Date;
  lastLogin?: Date;
}
