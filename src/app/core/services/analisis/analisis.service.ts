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
  private iaUrl = environment.iaUrl;

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
    const formData = new FormData();
    formData.append('image', imagen);  // importante: usar la clave 'image'

    return this.http.post<any>(`${this.iaUrl}/predict`, formData).pipe(
      map(respuesta => {
        const diagnostico = respuesta.class === 'healthy' || respuesta.class === 'Healthy'
          ? 'Cultivo saludable'
          : 'Anomalía detectada';

        const recomendacionesPorAnomalia: Record<string, string[]> = {
          'Bacterial_spot': [
            'Aplicar fungicida de cobre',
            'Evitar riego por aspersión',
            'Eliminar hojas afectadas'
          ],
          'Early_blight': [
            'Mejorar ventilación del cultivo',
            'Aplicar fungicida sistémico',
            'Rotar cultivos'
          ],
          'Late_blight': [
            'Aplicar fungicida específico para tizón tardío',
            'Eliminar plantas infectadas',
            'Controlar humedad'
          ],
          'Leaf_Mold': [
            'Usar variedades resistentes',
            'Aplicar tratamiento preventivo',
            'Evitar exceso de humedad'
          ],
          'Septoria_leaf_spot': [
            'Eliminar hojas afectadas',
            'Aplicar fungicida con clorotalonil',
            'Evitar salpicaduras de agua'
          ],
          'Spider_mites': [
            'Usar insecticidas biológicos',
            'Mejorar control ambiental',
            'Introducir depredadores naturales'
          ],
          'Target_Spot': [
            'Eliminar hojas viejas',
            'Controlar el riego',
            'Usar productos autorizados'
          ],
          'Tomato_Yellow_Leaf_Curl_Virus': [
            'Eliminar plantas infectadas',
            'Controlar la mosca blanca',
            'Utilizar mallas anti-insectos'
          ],
          'Tomato_mosaic_virus': [
            'Desinfectar herramientas',
            'Eliminar plantas afectadas',
            'Evitar el contacto humano prolongado'
          ],
          'healthy': [
            'Mantener las condiciones actuales',
            'Continuar con el monitoreo regular'
          ]
        };

        const anomalia = respuesta.class in recomendacionesPorAnomalia
          ? respuesta.class
          : 'healthy';

        const resultado: AnalisisResultado = {
          id: '', // Placeholder for id
          imagen: URL.createObjectURL(imagen),
          diagnostico,
          anomalia,
          confianza: respuesta.confidence,
          recomendaciones: recomendacionesPorAnomalia[anomalia],
          fechaAnalisis: new Date().toISOString(),
          confirmado: false
        };

        // Puedes guardarlo en tu backend si lo deseas
        return resultado;
      }),
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
