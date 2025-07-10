import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import {LoginRequest} from '../../interfaces/auth/login-request.interface';
import {AuthResponse} from '../../interfaces/auth/auth-response.interface';
import {BackendAuthResponse} from '../../interfaces/auth/backend-auth-response.interface';
import {RegisterRequest} from '../../interfaces/auth/register-request.interface';
import {User} from '../../interfaces/auth/user.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'tomateritmo_token';
  private readonly USER_KEY = 'tomateritmo_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const userData = localStorage.getItem(this.USER_KEY);

      if (token && userData) {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      this.logout();
    }
  }

  login(credentials: any): Observable<AuthResponse> {
    // Verificar credenciales demo
    if (credentials.email === 'demo@tomateritmo.com' && credentials.password === '123456') {
      const mockUser: User = {
        id: '1',
        email: 'demo@tomateritmo.com',
        username: 'demo@tomateritmo.com',
        plan: 'Premium',
        createdAt: new Date(),
        lastLogin: new Date()
      };

      const response: AuthResponse = {
        success: true,
        message: 'Inicio de sesión exitoso',
        user: mockUser,
        token: 'demo-token-123456'
      };

      return of(response).pipe(
        tap(response => {
          if (response.success && response.user && response.token) {
            this.setAuthData(response.user, response.token, credentials.rememberMe);
          }
        })
      );
    }

    // Mapear email a username para el backend
    const backendCredentials = {
      username: credentials.email,
      password: credentials.password
    };

    return this.http.post<BackendAuthResponse>(`${this.API_URL}/authentication/sign-in`, backendCredentials).pipe(
      map(backendResponse => {
        // Convertir la respuesta del backend al formato esperado por el frontend
        const user: User = {
          id: backendResponse.id.toString(),
          email: backendResponse.username,
          username: backendResponse.username,
          plan: 'Basic'
        };

        const response: AuthResponse = {
          success: true,
          message: 'Inicio de sesión exitoso',
          user: user,
          token: backendResponse.token
        };

        return response;
      }),
      tap(response => {
        if (response.success && response.user && response.token) {
          this.setAuthData(response.user, response.token, credentials.rememberMe);
        }
      }),
      catchError(this.handleError)
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    // Mapear los datos del frontend al formato esperado por el backend
    const backendRegisterData = {
      username: userData.email,  // El backend usa 'username' (que será el email)
      password: userData.password
    };

    console.log('Enviando datos de registro al backend:', backendRegisterData);

    return this.http.post<any>(`${this.API_URL}/authentication/sign-up`, backendRegisterData).pipe(
      map(backendResponse => {
        console.log('Respuesta del backend para registro:', backendResponse);
        
        // Convertir la respuesta del backend al formato esperado por el frontend
        const user: User = {
          id: backendResponse.id?.toString() || Date.now().toString(),
          email: userData.email,
          username: userData.email,
          plan: 'Basic',
          createdAt: new Date()
        };

        const response: AuthResponse = {
          success: true,
          message: 'Registro exitoso',
          user: user,
          token: backendResponse.token || `token-${Date.now()}` // Usar token del backend si está disponible
        };

        return response;
      }),
      tap(response => {
        if (response.success && response.user && response.token) {
          this.setAuthData(response.user, response.token, false);
        }
      }),
      catchError(error => {
        console.error('Error en registro:', error);
        return this.handleError(error);
      })
    );
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) {
      return throwError(() => new Error('No hay usuario autenticado'));
    }

    const updatedUser = { ...currentUser, ...userData };

    return of(updatedUser).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      })
    );

  }

  logout(): void {

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);

    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

  }

  refreshToken(): Observable<AuthResponse> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/auth/refresh`, { token }).pipe(
      tap(response => {
        if (response.success && response.user && response.token) {
          this.setAuthData(response.user, response.token, true);
        }
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/auth/change-password`, {
      oldPassword,
      newPassword
    }).pipe(
      catchError(this.handleError)
    );
  }

  resetPassword(email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/auth/reset-password`, {
      email
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteAccount(): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.API_URL}/auth/delete-account`).pipe(
      tap(response => {
        if (response.success) {
          this.logout();
        }
      }),
      catchError(this.handleError)
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  private setAuthData(user: User, token: string, remember: boolean = false): void {
    const storage = remember ? localStorage : sessionStorage;

    storage.setItem(this.TOKEN_KEY, token);
    storage.setItem(this.USER_KEY, JSON.stringify(user));

    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Datos inválidos';
          break;
        case 401:
          errorMessage = 'Credenciales incorrectas';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 422:
          errorMessage = error.error?.message || 'Error de validación';
          break;
        case 500:
          // Manejo específico para el error "User not found"
          if (error.error?.message?.includes('User not found') || 
              error.error?.error?.includes('User not found')) {
            errorMessage = 'Usuario no encontrado. Asegúrate de registrarte primero o usa las credenciales demo: demo@tomateritmo.com / 123456';
          } else {
            errorMessage = 'Error interno del servidor';
          }
          break;
        default:
          errorMessage = `Error: ${error.status} - ${error.message}`;
      }
    }

    return throwError(() => ({ success: false, message: errorMessage }));
  }
}
