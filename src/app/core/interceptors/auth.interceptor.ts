import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    const isFormData = req.body instanceof FormData;

    console.log('AuthInterceptor - URL:', req.url);
    console.log('AuthInterceptor - Token:', token ? 'Token presente' : 'Sin token');

    // Configurar headers base
    let headers: { [key: string]: string } = {};
    
    // Agregar header de ngrok si la URL es de ngrok
    if (req.url.includes('ngrok-free.app') || req.url.includes('ngrok.io')) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }
    
    // Solo se agregan los headers de auth si hay token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const modifiedReq = req.clone({ setHeaders: headers });

    return next.handle(modifiedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('AuthInterceptor - Error:', error.status, error.message);
        if (error.status === 401) {
          console.log('AuthInterceptor - 401 detected');

          if (req.url.includes('/auth/') || req.url.includes('/authentication/')) {
            console.log('AuthInterceptor - Auth endpoint, logging out');
            this.authService.logout();
            this.router.navigate(['/login']);
          } else {
            console.log('AuthInterceptor - Non-auth endpoint, not logging out automatically');
          }
        }
        return throwError(() => error);
      })
    );
  }
}
