import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {FiltroHistorial} from '../../interfaces/historial/filtro-historial.interface';
import {EventoHistorico} from '../../interfaces/historial/historial-historico.interface';
import {DatosGrafica} from '../../interfaces/historial/datos-grafica.interface';

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
      if (filtros.zona) {
        params.push(`zona_like=${encodeURIComponent(filtros.zona)}`);
      }
      if (filtros.cultivoId) {
        params.push(`cultivoId=${filtros.cultivoId}`);
      }
      if (filtros.fechaInicio && filtros.fechaFin) {
        params.push(`fecha_gte=${filtros.fechaInicio.toISOString()}`);
        params.push(`fecha_lte=${filtros.fechaFin.toISOString()}`);
      }
    }

    if (params.length > 0) {
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

  createEvento(evento: Omit<EventoHistorico, 'id'>): Observable<EventoHistorico> {
    const nuevoEvento = {
      ...evento,
      fecha: evento.fecha instanceof Date ? evento.fecha.toISOString() : evento.fecha
    };

    return this.http.post<EventoHistorico>(`${this.baseUrl}/eventosHistoricos`, nuevoEvento)
      .pipe(
        map(evento => ({
          ...evento,
          fecha: new Date(evento.fecha)
        })),
        catchError(this.handleError)
      );
  }

  deleteEvento(id: string): Observable<boolean> {
    return this.http.delete(`${this.baseUrl}/eventosHistoricos/${id}`)
      .pipe(
        map(() => true),
        catchError(this.handleError)
      );
  }

  getDatosGraficaAmbiental(fechaInicio?: Date, fechaFin?: Date): Observable<DatosGrafica> {
    let url = `${this.baseUrl}/datosGraficaAmbiental`;
    const params: string[] = [];

    if (fechaInicio && fechaFin) {
      params.push(`fecha_gte=${fechaInicio.toISOString()}`);
      params.push(`fecha_lte=${fechaFin.toISOString()}`);
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<any[]>(url)
      .pipe(
        map(datos => {
          const labels = datos.map(d => d.hora);
          const datasets = [
            {
              label: 'Humedad (%)',
              data: datos.map(d => d.humedad),
              borderColor: '#42A5F5',
              backgroundColor: 'rgba(66, 165, 245, 0.2)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Temperatura (°C)',
              data: datos.map(d => d.temperatura),
              borderColor: '#FF7043',
              backgroundColor: 'rgba(255, 112, 67, 0.2)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Luminosidad (klux)',
              data: datos.map(d => d.luminosidad / 1000),
              borderColor: '#FFA726',
              backgroundColor: 'rgba(255, 167, 38, 0.2)',
              tension: 0.4,
              fill: false,
              yAxisID: 'y1'
            }
          ];

          return { labels, datasets };
        }),
        catchError(this.handleError)
      );
  }

  getDatosGraficaSuelo(fechaInicio?: Date, fechaFin?: Date): Observable<DatosGrafica> {
    let url = `${this.baseUrl}/datosGraficaAmbiental`;
    const params: string[] = [];

    if (fechaInicio && fechaFin) {
      params.push(`fecha_gte=${fechaInicio.toISOString()}`);
      params.push(`fecha_lte=${fechaFin.toISOString()}`);
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<any[]>(url)
      .pipe(
        map(datos => {
          const labels = datos.map(d => d.hora);
          const datasets = [
            {
              label: 'pH',
              data: datos.map(d => d.ph),
              borderColor: '#66BB6A',
              backgroundColor: 'rgba(102, 187, 106, 0.2)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'EC (mS/cm)',
              data: datos.map(d => d.ec),
              borderColor: '#AB47BC',
              backgroundColor: 'rgba(171, 71, 188, 0.2)',
              tension: 0.4,
              fill: true
            }
          ];

          return { labels, datasets };
        }),
        catchError(this.handleError)
      );
  }

  exportarDatos(fechaInicio: Date, fechaFin: Date, formato: 'csv' | 'json' = 'csv'): Observable<string> {
    return this.getEventosHistoricos({ fechaInicio, fechaFin })
      .pipe(
        map(eventos => {
          if (formato === 'json') {
            return JSON.stringify(eventos, null, 2);
          } else {
            const headers = ['Fecha', 'Evento', 'Zona', 'Tipo', 'Detalles'];
            const csvContent = [
              headers.join(','),
              ...eventos.map(evento => [
                evento.fecha instanceof Date ? evento.fecha.toISOString() : evento.fecha,
                `"${evento.evento}"`,
                `"${evento.zona}"`,
                evento.tipo || '',
                `"${evento.detalles || ''}"`
              ].join(','))
            ].join('\n');

            return csvContent;
          }
        }),
        catchError(this.handleError)
      );
  }

  getEstadisticasHistorial(fechaInicio?: Date, fechaFin?: Date): Observable<any> {
    return this.getEventosHistoricos({ fechaInicio, fechaFin })
      .pipe(
        map(eventos => {
          const estadisticas = {
            totalEventos: eventos.length,
            eventosPorTipo: {} as any,
            eventosPorZona: {} as any,
            eventosRecientes: eventos.slice(0, 5)
          };

          eventos.forEach(evento => {
            const tipo = evento.tipo || 'otros';
            estadisticas.eventosPorTipo[tipo] = (estadisticas.eventosPorTipo[tipo] || 0) + 1;
          });

          eventos.forEach(evento => {
            const zona = evento.zona;
            estadisticas.eventosPorZona[zona] = (estadisticas.eventosPorZona[zona] || 0) + 1;
          });

          return estadisticas;
        }),
        catchError(this.handleError)
      );
  }

  getEventosPorPeriodo(periodo: 'dia' | 'semana' | 'mes'): Observable<EventoHistorico[]> {
    const ahora = new Date();
    let fechaInicio: Date;

    switch (periodo) {
      case 'dia':
        fechaInicio = new Date(ahora);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        fechaInicio = new Date(ahora);
        fechaInicio.setDate(ahora.getDate() - 7);
        break;
      case 'mes':
        fechaInicio = new Date(ahora);
        fechaInicio.setMonth(ahora.getMonth() - 1);
        break;
    }

    return this.getEventosHistoricos({ fechaInicio, fechaFin: ahora });
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
