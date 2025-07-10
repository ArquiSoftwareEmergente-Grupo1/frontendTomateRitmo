import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
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

  analizarImagen(imagen: File, cultivoId?: string): Observable<AnalisisResultado> {
    const formData = new FormData();
    formData.append('image', imagen);
    formData.append('cultivoId', cultivoId || '1');
    
    const headers = new HttpHeaders({
      // Headers básicos para el envío de archivo
    });

    // Llamar a Azure Function para análisis y guardado de imagen
    return this.http.post<any>(`${this.iaUrl}/predict`, formData, { headers }).pipe(
      map(respuesta => {
        const clase = respuesta.class || respuesta.prediction || 'unknown';
        const confianza = respuesta.confidence || respuesta.score || 0.5;
        const imagenGuardadaPath = respuesta.saved_image_path || '';
        const imagenUrl = respuesta.saved_image_url ? `${this.iaUrl}${respuesta.saved_image_url}` : '';
        
        const diagnostico = clase === 'healthy' || clase === 'Healthy'
          ? 'Cultivo saludable'
          : 'Anomalía detectada';

        // Crear el resultado del análisis
        const resultado: AnalisisResultado = {
          id: this.generateId(),
          imagen: imagenUrl || URL.createObjectURL(imagen), // Usar URL del servidor o fallback temporal
          diagnostico: diagnostico, // Usar diagnóstico genérico
          anomalia: clase,
          confianza: typeof confianza === 'number' ? confianza : parseFloat(confianza) || 0.5,
          recomendaciones: this.getRecomendacionesPorAnomalia(clase),
          cultivoId: cultivoId || '1',
          fechaAnalisis: new Date().toISOString(),
          confirmado: false,
          imagenPath: imagenGuardadaPath // Guardar la ruta donde se guardó la imagen
        };

        // Retornar el resultado y también guardarlo en el backend de forma asíncrona
        // No bloquear la UI esperando el guardado
        this.guardarAnalisisEnBackend(resultado, cultivoId).subscribe({
          next: (resultadoGuardado) => {
            console.log('✅ Análisis guardado exitosamente en backend:', resultadoGuardado);
          },
          error: (error) => {
            console.error('❌ Error guardando análisis en backend:', error);
          }
        });

        return resultado;
      }),
      catchError(error => {
        console.error('Error en Azure Function:', error);
        return throwError(() => new Error('Error procesando imagen con IA: ' + error.message));
      })
    );
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private getRecomendacionesPorAnomalia(anomalia: string): string[] {
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
      'Spider_mites Two-spotted_spider_mite': [
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
      'powdery_mildew': [
        'Aplicar fungicida sistémico',
        'Mejorar ventilación',
        'Reducir humedad relativa',
        'Eliminar hojas afectadas'
      ],
      'healthy': [
        'Mantener las condiciones actuales',
        'Continuar con el monitoreo regular'
      ]
    };

    return recomendacionesPorAnomalia[anomalia] || recomendacionesPorAnomalia['healthy'];
  }

  private getDescripcionAnomalia(anomalia: string): string {
    const descripcionesPorAnomalia: Record<string, string> = {
      'Bacterial_spot': 'Mancha Bacteriana - Infección que causa manchas oscuras en hojas y frutos',
      'Early_blight': 'Tizón Temprano - Enfermedad fúngica que afecta hojas y tallos',
      'Late_blight': 'Tizón Tardío - Enfermedad devastadora que puede destruir el cultivo',
      'Leaf_Mold': 'Moho de la Hoja - Hongo que causa manchas amarillas en las hojas',
      'Septoria_leaf_spot': 'Mancha Foliar por Septoria - Pequeñas manchas circulares en las hojas',
      'Spider_mites Two-spotted_spider_mite': 'Araña Roja - Plaga que causa punteado amarillo en las hojas',
      'Spider_mites': 'Araña Roja - Plaga que causa punteado amarillo en las hojas',
      'Target_Spot': 'Mancha Anular - Manchas concéntricas en hojas y frutos',
      'Tomato_Yellow_Leaf_Curl_Virus': 'Virus del Enrollamiento Amarillo - Causa enrollamiento y amarillamiento',
      'Tomato_mosaic_virus': 'Virus del Mosaico del Tomate - Causa patrones de mosaico en las hojas',
      'powdery_mildew': 'Oídio - Hongo que forma un polvo blanco en hojas y tallos',
      'healthy': 'Planta Saludable - No se detectaron problemas fitosanitarios'
    };

    return descripcionesPorAnomalia[anomalia] || 'Anomalía no identificada - Se requiere análisis adicional';
  }

  private guardarAnalisisEnBackend(resultado: AnalisisResultado, cultivoId?: string): Observable<any> {
    const analisisData = {
      imagen: resultado.imagen,
      diagnostico: resultado.diagnostico,
      anomalia: resultado.anomalia,
      confianza: resultado.confianza,
      recomendaciones: resultado.recomendaciones,
      cultivoId: cultivoId || resultado.cultivoId,
      imagenPath: resultado.imagenPath,
      fechaAnalisis: resultado.fechaAnalisis,
      confirmado: resultado.confirmado || false
    };
    
    console.log('� ENVIANDO al backend (URL: ' + this.baseUrl + '):', analisisData);
    
    return this.http.post(`${this.baseUrl}/analisisResultados`, analisisData).pipe(
      map(response => {
        console.log('✅ GUARDADO exitosamente:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ ERROR guardando análisis:', error);
        console.error('Error details:', error.error);
        console.error('Status:', error.status);
        console.error('URL:', error.url);
        return throwError(() => error);
      })
    );
  }

  getAnalisisResultados(): Observable<AnalisisResultado[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    return this.http.get<AnalisisResultado[]>(`${this.baseUrl}/analisisResultados`, { headers })
      .pipe(
        map(resultados => {
          if (!resultados || resultados.length === 0) {
            return [];
          }
          return resultados.sort((a, b) =>
            new Date(b.fechaAnalisis || '').getTime() - new Date(a.fechaAnalisis || '').getTime()
          );
        }),
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
          if (!resultados || resultados.length === 0) {
            return {
              totalAnalisis: 0,
              confirmados: 0,
              porcentajeConfirmacion: 0,
              anomaliasDetectadas: 0,
              porcentajeAnomalias: 0,
              confianzaPromedio: 0
            };
          }

          const total = resultados.length;
          const confirmados = resultados.filter(r => r.confirmado).length;
          const conAnomalias = resultados.filter(r => r.anomalia !== 'Sin anomalías detectadas' && r.anomalia !== 'healthy').length;
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

  // Método para obtener lista de imágenes guardadas en el servidor
  getImagenesGuardadas(): Observable<any> {
    return this.http.get<any>(`${this.iaUrl}/images`).pipe(
      catchError(error => {
        console.error('Error obteniendo imágenes guardadas:', error);
        return throwError(() => error);
      })
    );
  }

  // Método para obtener URL completa de una imagen
  getImagenUrl(filename: string): string {
    return `${this.iaUrl}/images/${filename}`;
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
