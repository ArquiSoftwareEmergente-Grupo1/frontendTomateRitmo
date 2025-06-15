import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import {LoginRequest} from '../../interfaces/auth/login-request.interface';
import {AuthResponse} from '../../interfaces/auth/auth-response.interface';
import {RegisterRequest} from '../../interfaces/auth/register-request.interface';
import {User} from '../../interfaces/auth/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000';
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

  login(credentials: LoginRequest): Observable<AuthResponse> {
    if (credentials.email === 'demo@tomateritmo.com' && credentials.password === '123456') {
      const mockUser: User = {
        id: '1',
        name: 'Usuario Demo',
        email: 'demo@tomateritmo.com',
        country: 'Perú',
        city: 'Lima',
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

    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.user && response.token) {
          this.setAuthData(response.user, response.token, credentials.rememberMe);
        }
      }),
      catchError(this.handleError)
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    const mockUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      lastName: userData.lastName,
      email: userData.email,
      country: userData.country,
      city: userData.city,
      plan: 'Basic',
      createdAt: new Date()
    };

    const response: AuthResponse = {
      success: true,
      message: 'Registro exitoso',
      user: mockUser,
      token: `token-${Date.now()}`
    };

    return of(response).pipe(
      tap(response => {
        if (response.success && response.user && response.token) {
          this.setAuthData(response.user, response.token, false);
        }
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
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = `Error: ${error.status} - ${error.message}`;
      }
    }

    return throwError(() => ({ success: false, message: errorMessage }));
  }
}
