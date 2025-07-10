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
    // Primero intentamos obtener datos reales del backend de sensores
    return this.http.get<any>(`${this.baseUrl}/sensores/dashboard`)
      .pipe(
        map(sensorData => this.mapSensorDataToDashboard(sensorData)),
        catchError(error => {
          console.warn('No se pudieron obtener datos de sensores, usando datos por defecto:', error);
          // Si falla, devolvemos datos por defecto
          return this.http.get<DashboardData[]>(`${this.baseUrl}/dashboardData`)
            .pipe(
              map(data => data[0] || this.getDefaultDashboardData()),
              catchError(() => [this.getDefaultDashboardData()])
            );
        })
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
    // Obtener lecturas recientes de sensores ambientales
    return this.http.get<any[]>(`${this.baseUrl}/sensores/lecturas?limit=24`)
      .pipe(
        map(lecturas => {
          // Agrupar por timestamp y extraer valores por tipo de sensor
          const datosAgrupados = this.agruparLecturasPorTiempo(lecturas);
          
          const labels = Object.keys(datosAgrupados).map(timestamp => 
            new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          );

          const datasets = [
            {
              label: 'Humedad Suelo (%)',
              data: Object.values(datosAgrupados).map((d: any) => d.humedadSuelo || 0),
              borderColor: '#42A5F5',
              backgroundColor: 'rgba(66, 165, 245, 0.2)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Temperatura (°C)',
              data: Object.values(datosAgrupados).map((d: any) => d.temperatura || 0),
              borderColor: '#FF7043',
              backgroundColor: 'rgba(255, 112, 67, 0.2)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Luminosidad (klux)',
              data: Object.values(datosAgrupados).map((d: any) => (d.luminosidad || 0) / 1000),
              borderColor: '#FFA726',
              backgroundColor: 'rgba(255, 167, 38, 0.2)',
              tension: 0.4,
              fill: false,
              yAxisID: 'y1'
            }
          ];

          return { labels, datasets };
        }),
        catchError(error => {
          console.warn('Error obteniendo datos de gráfico ambiental, usando datos por defecto:', error);
          return this.getGraficoAmbientalPorDefecto();
        })
      );
  }

  getGraficoSuelo(): Observable<GraficoData> {
    // Obtener lecturas recientes de sensores de suelo (pH y EC)
    return this.http.get<any[]>(`${this.baseUrl}/sensores/lecturas?limit=24`)
      .pipe(
        map(lecturas => {
          // Filtrar solo lecturas de pH y EC, y agrupar por tiempo
          const lecturasSuelo = lecturas.filter(l => l.tipoSensor === 'PH' || l.tipoSensor === 'EC');
          const datosAgrupados = this.agruparLecturasPorTiempo(lecturasSuelo);
          
          const labels = Object.keys(datosAgrupados).map(timestamp => 
            new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          );

          const datasets = [
            {
              label: 'pH',
              data: Object.values(datosAgrupados).map((d: any) => d.ph || 0),
              borderColor: '#66BB6A',
              backgroundColor: 'rgba(102, 187, 106, 0.2)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'EC (mS/cm)',
              data: Object.values(datosAgrupados).map((d: any) => d.ec || 0),
              borderColor: '#AB47BC',
              backgroundColor: 'rgba(171, 71, 188, 0.2)',
              tension: 0.4,
              fill: true
            }
          ];

          return { labels, datasets };
        }),
        catchError(error => {
          console.warn('Error obteniendo datos de gráfico de suelo, usando datos por defecto:', error);
          return this.getGraficoSueloPorDefecto();
        })
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

  getLatestSensorData(): Observable<Partial<DashboardData>> {
    // Obtener los datos más recientes de sensores
    return this.http.get<any>(`${this.baseUrl}/sensores/dashboard`)
      .pipe(
        map((sensorData: any) => ({
          humedadActual: sensorData.humedadSuelo,
          temperaturaActual: sensorData.temperatura,
          calidadSuelo: {
            ph: sensorData.ph,
            ec: sensorData.ec,
            estado: this.determinarEstadoSuelo(sensorData.ph, sensorData.ec)
          },
          luminosidad: {
            intensidad: sensorData.luminosidad,
            estado: this.determinarEstadoLuminosidad(sensorData.luminosidad)
          },
          fechaActualizacion: sensorData.ultimaActualizacion || new Date().toISOString()
        }) as Partial<DashboardData>),
        catchError(error => {
          console.warn('Error obteniendo datos de sensores:', error);
          return new Observable<Partial<DashboardData>>(observer => {
            observer.next(this.getDefaultDashboardData());
            observer.complete();
          });
        })
      );
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

  private mapSensorDataToDashboard(sensorData: any): DashboardData {
    // Mapear los datos del backend de sensores al formato DashboardData
    return {
      humedadActual: sensorData.humedadSuelo || 0,
      temperaturaActual: sensorData.temperatura || 0,
      calidadSuelo: {
        ph: sensorData.ph || 0,
        ec: sensorData.ec || 0,
        estado: this.determinarEstadoSuelo(sensorData.ph, sensorData.ec)
      },
      luminosidad: {
        intensidad: sensorData.luminosidad || 0,
        estado: this.determinarEstadoLuminosidad(sensorData.luminosidad)
      },
      ultimaDeteccionVisual: {
        imagen: 'assets/images/hoja-anomalia.jpg',
        diagnostico: 'Diagnóstico automático',
        anomalia: 'Sin anomalías detectadas'
      },
      tipoRiego: 'Automatico',
      fechaActualizacion: sensorData.ultimaActualizacion || new Date().toISOString()
    };
  }

  private determinarEstadoSuelo(ph: number, ec: number): string {
    if (!ph || !ec) return 'Sin datos';
    
    // Rangos ajustados para tomates según los datos del IoT
    const phOptimo = ph >= 6.0 && ph <= 8.0; // Ampliado el rango superior
    const ecOptimo = ec >= 0.8 && ec <= 3.0; // Ampliado el rango para EC
    
    if (phOptimo && ecOptimo) return 'óptimo';
    if (phOptimo || ecOptimo) return 'bueno';
    return 'necesita atención';
  }

  private determinarEstadoLuminosidad(luminosidad: number): string {
    if (!luminosidad) return 'Sin datos';
    
    // Rangos ajustados para los valores reales del sensor IoT
    if (luminosidad >= 50000) return 'Excelente'; // Para valores muy altos como 70964
    if (luminosidad >= 25000) return 'Óptimo';
    if (luminosidad >= 15000) return 'Bueno';
    if (luminosidad >= 8000) return 'Moderado';
    return 'Bajo';
  }

  private agruparLecturasPorTiempo(lecturas: any[]): { [timestamp: string]: any } {
    const agrupados: { [timestamp: string]: any } = {};
    
    lecturas.forEach(lectura => {
      const timestamp = lectura.timestamp;
      if (!agrupados[timestamp]) {
        agrupados[timestamp] = {};
      }
      
      // Mapear tipos de sensor a propiedades
      switch (lectura.tipoSensor) {
        case 'TEMPERATURA':
          agrupados[timestamp].temperatura = lectura.valor;
          break;
        case 'HUMEDAD_SUELO':
          agrupados[timestamp].humedadSuelo = lectura.valor;
          break;
        case 'LUMINOSIDAD':
          agrupados[timestamp].luminosidad = lectura.valor;
          break;
        case 'PH':
          agrupados[timestamp].ph = lectura.valor;
          break;
        case 'EC':
          agrupados[timestamp].ec = lectura.valor;
          break;
      }
    });
    
    return agrupados;
  }

  private getGraficoAmbientalPorDefecto(): Observable<GraficoData> {
    const labels = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const datasets = [
      {
        label: 'Humedad Suelo (%)',
        data: [45, 42, 38, 35, 33, 30],
        borderColor: '#42A5F5',
        backgroundColor: 'rgba(66, 165, 245, 0.2)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Temperatura (°C)',
        data: [22, 24, 26, 28, 27, 25],
        borderColor: '#FF7043',
        backgroundColor: 'rgba(255, 112, 67, 0.2)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Luminosidad (klux)',
        data: [15, 25, 35, 45, 40, 30],
        borderColor: '#FFA726',
        backgroundColor: 'rgba(255, 167, 38, 0.2)',
        tension: 0.4,
        fill: false,
        yAxisID: 'y1'
      }
    ];
    
    return new Observable(observer => {
      observer.next({ labels, datasets });
      observer.complete();
    });
  }

  private getGraficoSueloPorDefecto(): Observable<GraficoData> {
    const labels = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const datasets = [
      {
        label: 'pH',
        data: [6.8, 6.5, 6.7, 6.9, 7.0, 6.8],
        borderColor: '#66BB6A',
        backgroundColor: 'rgba(102, 187, 106, 0.2)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'EC (mS/cm)',
        data: [1.2, 1.4, 1.3, 1.5, 1.8, 1.6],
        borderColor: '#AB47BC',
        backgroundColor: 'rgba(171, 71, 188, 0.2)',
        tension: 0.4,
        fill: true
      }
    ];
    
    return new Observable(observer => {
      observer.next({ labels, datasets });
      observer.complete();
    });
  }
}
