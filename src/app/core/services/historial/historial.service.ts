import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {FiltroHistorial} from '../../interfaces/historial/filtro-historial.interface';
import {EventoHistorico} from '../../interfaces/historial/historial-historico.interface';

@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getEventosHistoricos(filtros?: FiltroHistorial): Observable<EventoHistorico[]> {
    let url = `${this.baseUrl}/eventosHistoricos`;
    const params: string[] = [];

    if (filtros) {
      if (filtros.tipo) {
        params.push(`tipo=${filtros.tipo}`);
      } 
      if (filtros.cultivoName) {
        params.push(`cultivoName_like=${encodeURIComponent(filtros.cultivoName)}`);
      }
      if (filtros.fechaInicio && filtros.fechaFin) {
        params.push(`fechaInicio=${filtros.fechaInicio.toISOString()}`);
        params.push(`fechaFin=${filtros.fechaFin.toISOString()}`);
      }
    }

    // Si no hay filtros, usar el endpoint /all
    if (params.length === 0) {
      url += '/all';
    } else {
      url += '?' + params.join('&');
    }

    return this.http.get<EventoHistorico[]>(url)
      .pipe(
        map(eventos => eventos.map(evento => ({
          ...evento,
          fecha: new Date(evento.fecha)
        })).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())),
        catchError(this.handleError)
      );
  }

  getEventoById(id: string): Observable<EventoHistorico> {
    return this.http.get<EventoHistorico>(`${this.baseUrl}/eventosHistoricos/${id}`)
      .pipe(
        map(evento => ({
          ...evento,
          fecha: new Date(evento.fecha)
        })),
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

    console.error('HistorialService Error:', errorMessage);
    return throwError(errorMessage);
  }
}
