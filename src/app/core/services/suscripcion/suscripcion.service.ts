import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {environment} from '../../../../environments/environment';


export interface Plan {
  id: string;
  nombre: string;
  precio: number;
  periodo: string;
  caracteristicas: string[];
  destacado?: boolean;
}

export interface DatosPago {
  numeroTarjeta: string;
  fechaVencimiento: string;
  codigoSeguridad: string;
  email: string;
  nombre: string;
}

export interface RespuestaPago {
  success: boolean;
  message: string;
  transactionId?: string;
  subscriptionId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SuscripcionService {
  private baseUrl = environment.apiUrl;

  private planes: Plan[] = [
    {
      id: 'basic',
      nombre: 'Basic',
      precio: 2.99,
      periodo: 'month',
      caracteristicas: [
        'Basic anomaly detection.',
        'Essential notifications.',
        'Basic monitoring features.'
      ]
    },
    {
      id: 'regular',
      nombre: 'Regular',
      precio: 7.99,
      periodo: 'month',
      caracteristicas: [
        'Everything in the Basic Plan.',
        'Statistical graphs.',
        'Advanced alerts with recommendations.'
      ]
    },
    {
      id: 'premium',
      nombre: 'Premium',
      precio: 14.99,
      periodo: 'month',
      caracteristicas: [
        'Everything in the Regular Plan.',
        'Unlimited crops.',
        'Alert customization.',
        'Full automation of irrigation and AI detection.'
      ],
      destacado: true
    }
  ];

  constructor(private http: HttpClient) {}

  getPlanes(): Observable<Plan[]> {
    return of(this.planes).pipe(delay(500));
  }

  getPlanById(planId: string): Observable<Plan | null> {
    const plan = this.planes.find(p => p.id === planId);
    return of(plan || null).pipe(delay(300));
  }

  procesarPago(datosPago: DatosPago, planId: string): Observable<RespuestaPago> {
    const plan = this.planes.find(p => p.id === planId);

    if (!plan) {
      return of({
        success: false,
        message: 'Plan no encontrado'
      }).pipe(delay(1000));
    }

    const response: RespuestaPago = {
      success: true,
      message: 'Pago procesado exitosamente',
      transactionId: this.generateTransactionId(),
      subscriptionId: this.generateSubscriptionId()
    };

    return of(response).pipe(delay(2000));
  }

  validarTarjeta(numeroTarjeta: string): Observable<boolean> {
    const isValid = this.luhnCheck(numeroTarjeta);
    return of(isValid).pipe(delay(500));
  }

  private generateTransactionId(): string {
    return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateSubscriptionId(): string {
    return 'SUB_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private luhnCheck(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');

    if (digits.length < 13 || digits.length > 19) {
      return false;
    }

    let sum = 0;
    let alternate = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let n = parseInt(digits.charAt(i), 10);

      if (alternate) {
        n *= 2;
        if (n > 9) {
          n = (n % 10) + 1;
        }
      }

      sum += n;
      alternate = !alternate;
    }

    return (sum % 10) === 0;
  }
}
