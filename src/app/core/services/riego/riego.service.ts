import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {Observable, switchMap, throwError} from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import {RiegoHistorial} from '../../interfaces/riego/riego-historial.interface';
import { RiegoManual } from '../../interfaces/riego/riego-manual.interface';
import {EjecutarRiegoRequest} from '../../interfaces/riego/ejecutar-riego-request.interface';
import {ConfiguracionRiego} from '../../interfaces/riego/configuracion-riego.interface';

@Injectable({
  providedIn: 'root'
})
export class RiegoService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getHistorialRiego(): Observable<RiegoHistorial[]> {
    return this.http.get<RiegoHistorial[]>(`${this.baseUrl}/riegoHistorial`)
      .pipe(
        map(historial => historial.map(item => ({
          ...item,
          fechaPlantacion: new Date(item.fechaPlantacion),
          ultimoRiego: new Date(item.ultimoRiego)
        }))),
        catchError(this.handleError)
      );
  }

  getRiegoHistorialByCultivo(cultivoId: string): Observable<RiegoHistorial[]> {
    return this.http.get<RiegoHistorial[]>(`${this.baseUrl}/riegoHistorial?cultivoId=${cultivoId}`)
      .pipe(
        map(historial => historial.map(item => ({
          ...item,
          fechaPlantacion: new Date(item.fechaPlantacion),
          ultimoRiego: new Date(item.ultimoRiego)
        }))),
        catchError(this.handleError)
      );
  }

  getRiegoManual(): Observable<RiegoManual[]> {
    return this.http.get<RiegoManual[]>(`${this.baseUrl}/riegoManual`)
      .pipe(
        map(riegos => riegos.map(riego => ({
          ...riego,
          fecha: new Date(riego.fecha),
          ultimoRiego: new Date(riego.ultimoRiego)
        })).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())),
        catchError(this.handleError)
      );
  }

  getRiegoManualPendientes(): Observable<RiegoManual[]> {
    return this.http.get<RiegoManual[]>(`${this.baseUrl}/riegoManual?estado=pendiente`)
      .pipe(
        map(riegos => riegos.map(riego => ({
          ...riego,
          fecha: new Date(riego.fecha),
          ultimoRiego: new Date(riego.ultimoRiego)
        }))),
        catchError(this.handleError)
      );
  }

  ejecutarRiegoManual(request: EjecutarRiegoRequest): Observable<boolean> {
    const nuevoRiego: Omit<RiegoManual, 'id'> = {
      fecha: new Date().toISOString(),
      zona: request.zona,
      humedad: Math.floor(Math.random() * (60 - 40) + 40),
      ultimoRiego: new Date().toISOString(),
      cultivoId: request.cultivoId,
      estado: 'completado'
    };

    return this.http.post<RiegoManual>(`${this.baseUrl}/riegoManual`, nuevoRiego)
      .pipe(
        tap(() => {
          if (request.cultivoId) {
            this.actualizarHistorialRiego(request.cultivoId, {
              ultimoRiego: new Date().toISOString(),
              tipoRiego: 'Manual'
            });
          }
        }),
        map(() => true),
        catchError(this.handleError)
      );
  }

  private actualizarHistorialRiego(cultivoId: string, datos: Partial<RiegoHistorial>): Observable<RiegoHistorial> {
    return this.http.get<RiegoHistorial[]>(`${this.baseUrl}/riegoHistorial?cultivoId=${cultivoId}`)
      .pipe(
        map(historial => {
          if (historial.length > 0) {
            const item = historial[0];
            return this.http.put<RiegoHistorial>(`${this.baseUrl}/riegoHistorial/${item.id}`, {
              ...item,
              ...datos
            });
          }
          throw new Error('No se encontró historial para el cultivo');
        }),
        switchMap(putRequest => putRequest),
        catchError(this.handleError)
      );
  }


  programarRiegoManual(riego: Omit<RiegoManual, 'id'>): Observable<RiegoManual> {
    const riegoCompleto = {
      ...riego,
      fecha: riego.fecha instanceof Date ? riego.fecha.toISOString() : riego.fecha,
      ultimoRiego: riego.ultimoRiego instanceof Date ? riego.ultimoRiego.toISOString() : riego.ultimoRiego,
      estado: 'pendiente'
    };

    return this.http.post<RiegoManual>(`${this.baseUrl}/riegoManual`, riegoCompleto)
      .pipe(
        map(riego => ({
          ...riego,
          fecha: new Date(riego.fecha),
          ultimoRiego: new Date(riego.ultimoRiego)
        })),
        catchError(this.handleError)
      );
  }

  cancelarRiegoManual(id: string): Observable<boolean> {
    return this.http.patch<RiegoManual>(`${this.baseUrl}/riegoManual/${id}`, { estado: 'cancelado' })
      .pipe(
        map(() => true),
        catchError(this.handleError)
      );
  }

  getConfiguracion(): Observable<ConfiguracionRiego> {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id;

    let url = `${this.baseUrl}/configuracionRiego`;
    if (userId) {
      url += `?userId=${userId}`;
    }

    return this.http.get<ConfiguracionRiego[]>(url)
      .pipe(
        map(configs => configs[0] || this.getDefaultConfig()),
        catchError(this.handleError)
      );
  }

  updateConfiguracion(config: ConfiguracionRiego): Observable<ConfiguracionRiego> {
    const currentUser = this.authService.getCurrentUser();

    return this.getConfiguracion().pipe(
      switchMap(currentConfig => {
        const updatedConfig = {
          ...currentConfig,
          ...config,
          userId: currentUser?.id,
          fechaActualizacion: new Date().toISOString()
        };

        if (currentConfig.id) {
          return this.http.put<ConfiguracionRiego>(`${this.baseUrl}/configuracionRiego/${currentConfig.id}`, updatedConfig);
        } else {
          return this.http.post<ConfiguracionRiego>(`${this.baseUrl}/configuracionRiego`, updatedConfig);
        }
      }),
      catchError(this.handleError)
    );
  }

  getEstadisticasRiego(): Observable<any> {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);

    const semanaAtras = new Date(hoy);
    semanaAtras.setDate(hoy.getDate() - 7);

    return this.http.get<RiegoManual[]>(`${this.baseUrl}/riegoManual`)
      .pipe(
        map(riegos => {
          const riegosFecha = riegos.map(r => ({
            ...r,
            fecha: new Date(r.fecha)
          }));

          const riegosHoy = riegosFecha.filter(r =>
            r.fecha.toDateString() === hoy.toDateString()
          );

          const riegosAyer = riegosFecha.filter(r =>
            r.fecha.toDateString() === ayer.toDateString()
          );

          const riegosSemana = riegosFecha.filter(r =>
            r.fecha >= semanaAtras
          );

          const riegosCompletados = riegosFecha.filter(r => r.estado === 'completado');
          const riegosPendientes = riegosFecha.filter(r => r.estado === 'pendiente');

          return {
            riegosHoy: riegosHoy.length,
            riegosAyer: riegosAyer.length,
            riegosSemana: riegosSemana.length,
            totalRiegos: riegos.length,
            riegosCompletados: riegosCompletados.length,
            riegosPendientes: riegosPendientes.length,
            eficiencia: riegos.length > 0 ? (riegosCompletados.length / riegos.length) * 100 : 0
          };
        }),
        catchError(this.handleError)
      );
  }

  simularRiegoAutomatico(): Observable<boolean> {
    return this.getHistorialRiego()
      .pipe(
        map(historial => {
          const cultivosSecos = historial.filter(h => h.humedad < 30);

          cultivosSecos.forEach(cultivo => {
            const nuevoRiego: Omit<RiegoManual, 'id'> = {
              fecha: new Date().toISOString(),
              zona: `Sector ${cultivo.sector || cultivo.id}`,
              humedad: Math.floor(Math.random() * (65 - 50) + 50),
              ultimoRiego: new Date().toISOString(),
              cultivoId: cultivo.cultivoId,
              estado: 'completado'
            };

            this.http.post<RiegoManual>(`${this.baseUrl}/riegoManual`, nuevoRiego).subscribe();
          });

          return cultivosSecos.length > 0;
        }),
        catchError(this.handleError)
      );
  }

  private getDefaultConfig(): ConfiguracionRiego {
    return {
      humedadMinima: 30,
      humedadMaxima: 70,
      tipoRiego: 'Automatico',
      horariosRiego: ['06:00', '12:00', '18:00'],
      fechaActualizacion: new Date().toISOString()
    };
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error ${error.status}: ${error.message}`;
    }

    console.error('RiegoService Error:', errorMessage);
    return throwError(errorMessage);
  }
}
