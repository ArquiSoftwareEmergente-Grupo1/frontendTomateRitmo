import {User} from './user.interface';

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}
