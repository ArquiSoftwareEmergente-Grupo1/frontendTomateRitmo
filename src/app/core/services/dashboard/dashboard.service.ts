import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {Observable, switchMap, throwError} from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import {DashboardData} from '../../interfaces/dashboard/dashboard-data.interface';
import {GraficoData} from '../../interfaces/dashboard/grafico-data.interface';
import {EstadisticasDashboard} from '../../interfaces/dashboard/estadisticas-dashboard.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getDashboardData(): Observable<DashboardData> {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id;

    let url = `${this.baseUrl}/dashboardData`;
    if (userId) {
      url += `?userId=${userId}`;
    }

    return this.http.get<DashboardData[]>(url)
      .pipe(
        map(data => data[0] || this.getDefaultDashboardData()),
        catchError(this.handleError)
      );
  }

  updateDashboardData(data: Partial<DashboardData>): Observable<DashboardData> {
    const currentUser = this.authService.getCurrentUser();

    return this.getDashboardData().pipe(
      switchMap(currentData => {
        const updatedData = {
          ...currentData,
          ...data,
          fechaActualizacion: new Date().toISOString(),
          userId: currentUser?.id
        };

        if (currentData.id) {
          return this.http.put<DashboardData>(`${this.baseUrl}/dashboardData/${currentData.id}`, updatedData);
        } else {
          return this.http.post<DashboardData>(`${this.baseUrl}/dashboardData`, updatedData);
        }
      }),
      catchError(this.handleError)
    );
  }


  getGraficoAmbiental(): Observable<GraficoData> {
    return this.http.get<any[]>(`${this.baseUrl}/datosGraficaAmbiental`)
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
              label: 'Luminosidad (lux)',
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

  getGraficoSuelo(): Observable<GraficoData> {
    return this.http.get<any[]>(`${this.baseUrl}/datosGraficaAmbiental`)
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

  getEstadisticasGenerales(): Observable<EstadisticasDashboard> {
    const currentUser = this.authService.getCurrentUser();

    const cultivos$ = this.http.get<any[]>(`${this.baseUrl}/cultivos${currentUser?.id ? '?userId=' + currentUser.id : ''}`);
    const alertas$ = this.http.get<any[]>(`${this.baseUrl}/alertasVisuales?estado=activa`);
    const dashboard$ = this.getDashboardData();

    return cultivos$.pipe(
      map(cultivos => {
        const estadisticas: EstadisticasDashboard = {
          totalCultivos: cultivos.length,
          alertasActivas: 0,
          humedadPromedio: 0,
          temperaturaPromedio: 0,
          ultimaActualizacion: new Date().toISOString()
        };
        return estadisticas;
      }),
      catchError(this.handleError)
    );
  }

  simularDatosEnTiempoReal(): Observable<Partial<DashboardData>> {
    const datosSimulados = {
      humedadActual: Math.floor(Math.random() * (60 - 30) + 30),
      temperaturaActual: Math.floor(Math.random() * (30 - 18) + 18),
      calidadSuelo: {
        ph: Math.round((Math.random() * (7.5 - 6.0) + 6.0) * 10) / 10,
        ec: Math.round((Math.random() * (2.0 - 0.8) + 0.8) * 10) / 10,
        estado: Math.random() > 0.7 ? 'óptimo' : Math.random() > 0.4 ? 'bueno' : 'necesita atención'
      },
      luminosidad: {
        intensidad: Math.floor(Math.random() * (25000 - 5000) + 5000),
        estado: Math.random() > 0.8 ? 'Óptimo' : Math.random() > 0.5 ? 'Bueno' : 'Bajo'
      }
    };

    return new Observable(observer => {
      observer.next(datosSimulados);
      observer.complete();
    });
  }

  private getDefaultDashboardData(): DashboardData {
    return {
      humedadActual: 45,
      temperaturaActual: 24,
      calidadSuelo: {
        ph: 6.5,
        ec: 1.2,
        estado: 'óptimo'
      },
      luminosidad: {
        intensidad: 18000,
        estado: 'Óptimo'
      },
      ultimaDeteccionVisual: {
        imagen: 'assets/images/hoja-anomalia.jpg',
        diagnostico: 'Diagnóstico',
        anomalia: 'Sin datos disponibles'
      },
      tipoRiego: 'Automatico',
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

    console.error('DashboardService Error:', errorMessage);
    return throwError(errorMessage);
  }
}
