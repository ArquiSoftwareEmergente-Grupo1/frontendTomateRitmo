import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import {AlertaVisual} from '../../interfaces/analisis/alerta-visual.interface';
import {AnalisisResultado} from '../../interfaces/analisis/analisis-resultado.interface';


@Injectable({
  providedIn: 'root'
})
export class AnalisisService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAlertasVisuales(): Observable<AlertaVisual[]> {
    return this.http.get<AlertaVisual[]>(`${this.baseUrl}/alertasVisuales`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getAlertasByEstado(estado: string): Observable<AlertaVisual[]> {
    return this.http.get<AlertaVisual[]>(`${this.baseUrl}/alertasVisuales?estado=${estado}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getAlertasBySeveridad(severidad: string): Observable<AlertaVisual[]> {
    return this.http.get<AlertaVisual[]>(`${this.baseUrl}/alertasVisuales?severidad=${severidad}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createAlerta(alerta: Omit<AlertaVisual, 'id'>): Observable<AlertaVisual> {
    const nuevaAlerta = {
      ...alerta,
      fechaDeteccion: new Date().toISOString(),
      estado: 'activa'
    };

    return this.http.post<AlertaVisual>(`${this.baseUrl}/alertasVisuales`, nuevaAlerta)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateAlerta(id: string, alerta: Partial<AlertaVisual>): Observable<AlertaVisual> {
    return this.http.put<AlertaVisual>(`${this.baseUrl}/alertasVisuales/${id}`, alerta)
      .pipe(
        catchError(this.handleError)
      );
  }

  analizarImagen(imagen: File): Observable<AnalisisResultado> {
    const imageUrl = URL.createObjectURL(imagen);

    const anomalias = [
      'Mancha foliar por Alternaria solani',
      'Infestación de pulgones (Aphis gossypii)',
      'Deficiencia nutricional de Nitrógeno',
      'Virus del mosaico del tomate',
      'Sin anomalías detectadas'
    ];

    const recomendacionesPorAnomalia = {
      'Mancha foliar por Alternaria solani': [
        'Aplicar fungicida orgánico',
        'Mejorar ventilación del cultivo',
        'Reducir humedad ambiental'
      ],
      'Infestación de pulgones (Aphis gossypii)': [
        'Aplicar insecticida natural',
        'Introducir enemigos naturales',
        'Revisar riego y nutrición'
      ],
      'Deficiencia nutricional de Nitrógeno': [
        'Aplicar fertilizante rico en nitrógeno',
        'Ajustar pH del suelo',
        'Mejorar drenaje del cultivo'
      ],
      'Virus del mosaico del tomate': [
        'Eliminar plantas infectadas',
        'Controlar vectores de transmisión',
        'Desinfectar herramientas'
      ],
      'Sin anomalías detectadas': [
        'Mantener las condiciones actuales',
        'Continuar con el monitoreo regular'
      ]
    };

    const anomaliaSeleccionada = anomalias[Math.floor(Math.random() * anomalias.length)];
    const esSaludable = anomaliaSeleccionada === 'Sin anomalías detectadas';

    const resultado: Omit<AnalisisResultado, 'id'> = {
      imagen: imageUrl,
      diagnostico: esSaludable ? 'Cultivo saludable' : 'Anomalía detectada',
      anomalia: anomaliaSeleccionada,
      confianza: Math.random() * (0.95 - 0.75) + 0.75,
      recomendaciones: recomendacionesPorAnomalia[anomaliaSeleccionada as keyof typeof recomendacionesPorAnomalia],
      fechaAnalisis: new Date().toISOString(),
      confirmado: false
    };

    return this.http.post<AnalisisResultado>(`${this.baseUrl}/analisisResultados`, resultado)
      .pipe(
        catchError(this.handleError)
      );
  }

  getAnalisisResultados(): Observable<AnalisisResultado[]> {
    return this.http.get<AnalisisResultado[]>(`${this.baseUrl}/analisisResultados`)
      .pipe(
        map(resultados => resultados.sort((a, b) =>
          new Date(b.fechaAnalisis || '').getTime() - new Date(a.fechaAnalisis || '').getTime()
        )),
        catchError(this.handleError)
      );
  }

  getAnalisisById(id: string): Observable<AnalisisResultado> {
    return this.http.get<AnalisisResultado>(`${this.baseUrl}/analisisResultados/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  confirmarDiagnostico(id: string, confirmado: boolean): Observable<AnalisisResultado> {
    return this.http.patch<AnalisisResultado>(`${this.baseUrl}/analisisResultados/${id}`, {
      confirmado: confirmado
    })
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteAnalisis(id: string): Observable<boolean> {
    return this.http.delete(`${this.baseUrl}/analisisResultados/${id}`)
      .pipe(
        map(() => true),
        catchError(this.handleError)
      );
  }

  getEstadisticasAnalisis(): Observable<any> {
    return this.http.get<AnalisisResultado[]>(`${this.baseUrl}/analisisResultados`)
      .pipe(
        map(resultados => {
          const total = resultados.length;
          const confirmados = resultados.filter(r => r.confirmado).length;
          const conAnomalias = resultados.filter(r => r.anomalia !== 'Sin anomalías detectadas').length;
          const confianzaPromedio = resultados.reduce((sum, r) => sum + r.confianza, 0) / total;

          return {
            totalAnalisis: total,
            confirmados: confirmados,
            porcentajeConfirmacion: total > 0 ? (confirmados / total) * 100 : 0,
            anomaliasDetectadas: conAnomalias,
            porcentajeAnomalias: total > 0 ? (conAnomalias / total) * 100 : 0,
            confianzaPromedio: confianzaPromedio || 0
          };
        }),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error ${error.status}: ${error.message}`;
    }

    console.error('AnalisisService Error:', errorMessage);
    return throwError(errorMessage);
  }
}
