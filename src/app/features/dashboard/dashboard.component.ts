import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { DashboardService } from '../../core/services/dashboard/dashboard.service';
import { ProgressSpinner } from 'primeng/progressspinner';
import {NgIf, NgClass} from '@angular/common';
import { Button } from 'primeng/button';
import { UIChart } from 'primeng/chart';
import { Card } from 'primeng/card';
import { Knob } from 'primeng/knob';
import { Badge } from 'primeng/badge';
import { SkeletonModule } from 'primeng/skeleton';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import {DashboardData} from '../../core/interfaces/dashboard/dashboard-data.interface';
import {Toast} from 'primeng/toast';

type BadgeSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [
    ProgressSpinner,
    NgIf,
    NgClass,
    Button,
    UIChart,
    Knob,
    Badge,
    SkeletonModule,
    FormsModule,
    Toast
  ],
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  dashboardData: DashboardData | null = null;
  loading = true;
  isMobile = false;
  refreshSubscription?: Subscription;

  ambientalChartData: any;
  suplementosChartData: any;
  chartOptions: any;
  mobileChartOptions: any;

  estadisticas = {
    totalCultivos: 0,
    alertasActivas: 0,
    eficienciaRiego: 0,
    ultimaActualizacion: new Date()
  };

  constructor(private dashboardService: DashboardService) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
    this.updateChartOptions();
  }

  ngOnInit() {
    this.loadDashboardData();
    this.initChartOptions();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  private startAutoRefresh() {
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.refreshData();
    });
  }

  loadDashboardData() {
    this.loading = true;
    
    // Simular delay de carga como si fuera una API real
    setTimeout(() => {
      // Datos simulados de sensores
      this.dashboardData = this.generateSimulatedSensorData();
      this.loading = false;
      this.initCharts();
      this.loadEstadisticas();
    }, 1000);
  }

  private generateSimulatedSensorData(): DashboardData {
    // Generar valores realistas para tomates
    const humedadBase = 55 + Math.random() * 20; // 55-75%
    const tempBase = 20 + Math.random() * 10; // 20-30°C
    const phBase = 6.0 + Math.random() * 1.5; // 6.0-7.5
    const ecBase = 1.0 + Math.random() * 1.5; // 1.0-2.5 mS/cm
    const luzBase = 15000 + Math.random() * 15000; // 15k-30k lux

    return {
      id: 'sensor-001',
      humedadActual: Math.round(humedadBase * 10) / 10,
      temperaturaActual: Math.round(tempBase * 10) / 10,
      calidadSuelo: {
        ph: Math.round(phBase * 10) / 10,
        ec: Math.round(ecBase * 10) / 10,
        estado: this.getEstadoSuelo(phBase, ecBase)
      },
      luminosidad: {
        intensidad: Math.round(luzBase),
        estado: this.getEstadoLuminosidad(luzBase)
      },
      ultimaDeteccionVisual: {
        imagen: 'https://via.placeholder.com/200x150/4CAF50/FFFFFF?text=Tomate+Saludable',
        diagnostico: this.getRandomDiagnostico(),
        anomalia: this.getRandomAnomalia()
      },
      tipoRiego: Math.random() > 0.5 ? 'Automatico' : 'Manual',
      fechaActualizacion: new Date().toISOString(),
      userId: 'user-123'
    };
  }

  private getEstadoSuelo(ph: number, ec: number): string {
    if (ph >= 6.0 && ph <= 7.0 && ec >= 1.0 && ec <= 2.0) {
      return 'Óptimo';
    } else if (ph >= 5.5 && ph <= 7.5 && ec >= 0.8 && ec <= 2.5) {
      return 'Bueno';
    } else {
      return 'Necesita atención';
    }
  }

  private getEstadoLuminosidad(intensidad: number): string {
    if (intensidad >= 20000) {
      return 'Excelente';
    } else if (intensidad >= 15000) {
      return 'Buena';
    } else if (intensidad >= 10000) {
      return 'Moderada';
    } else {
      return 'Insuficiente';
    }
  }

  private getRandomDiagnostico(): string {
    const diagnosticos = [
      'Planta saludable detectada',
      'Crecimiento óptimo observado',
      'Desarrollo normal en curso',
      'Frutos en formación inicial',
      'Floración activa presente',
      'Posible estrés hídrico leve',
      'Deficiencia nutricional menor',
      'Maduración de frutos detectada',
      'Sistema radicular robusto',
      'Follaje denso y verde',
      'Tallo principal firme',
      'Nuevos brotes emergiendo'
    ];
    return diagnosticos[Math.floor(Math.random() * diagnosticos.length)];
  }

  private getRandomAnomalia(): string {
    const anomalias = [
      'Sin anomalías detectadas - Estado óptimo',
      'Leve amarillamiento en hojas inferiores',
      'Pequeñas manchas foliares benignas',
      'Crecimiento ligeramente irregular',
      'Posible presencia menor de áfidos',
      'Frutos desarrollándose normalmente',
      'Tallos robustos con buena estructura',
      'Hojas nuevas con coloración perfecta',
      'Sistema de ramificación equilibrado',
      'Flores bien formadas y polinizadas',
      'Raíces expandiéndose adecuadamente',
      'Nutrición foliar en rango óptimo'
    ];
    return anomalias[Math.floor(Math.random() * anomalias.length)];
  }

  refreshData() {
    // Simular actualización de datos de sensores
    if (this.dashboardData) {
      // Actualizar valores con pequeñas variaciones realistas
      this.dashboardData.humedadActual = Math.round(
        (this.dashboardData.humedadActual + (Math.random() - 0.5) * 5) * 10
      ) / 10;
      
      this.dashboardData.temperaturaActual = Math.round(
        (this.dashboardData.temperaturaActual + (Math.random() - 0.5) * 2) * 10
      ) / 10;
      
      this.dashboardData.luminosidad.intensidad = Math.round(
        this.dashboardData.luminosidad.intensidad + (Math.random() - 0.5) * 2000
      );
      
      // Mantener valores dentro de rangos realistas
      this.dashboardData.humedadActual = Math.max(30, Math.min(80, this.dashboardData.humedadActual));
      this.dashboardData.temperaturaActual = Math.max(15, Math.min(35, this.dashboardData.temperaturaActual));
      this.dashboardData.luminosidad.intensidad = Math.max(5000, Math.min(35000, this.dashboardData.luminosidad.intensidad));
      
      // Actualizar estados basados en los nuevos valores
      this.dashboardData.luminosidad.estado = this.getEstadoLuminosidad(this.dashboardData.luminosidad.intensidad);
      this.dashboardData.fechaActualizacion = new Date().toISOString();
      
      this.estadisticas.ultimaActualizacion = new Date();
      this.updateCharts();
    }
  }

  private loadEstadisticas() {
    // Generar estadísticas simuladas realistas
    const totalCultivos = 5 + Math.floor(Math.random() * 8); // 5-12 cultivos
    const alertasActivas = Math.floor(Math.random() * 4); // 0-3 alertas
    const eficienciaBase = 75 + Math.random() * 20; // 75-95% eficiencia
    
    this.estadisticas = {
      totalCultivos: totalCultivos,
      alertasActivas: alertasActivas,
      eficienciaRiego: Math.round(eficienciaBase),
      ultimaActualizacion: new Date()
    };
  }

  initCharts() {
    // Generar datos de las últimas 24 horas con variaciones realistas
    const hoursLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
    const humedadData = this.generateRealisticHumidityData();
    const temperaturaData = this.generateRealisticTemperatureData();
    
    this.ambientalChartData = {
      labels: hoursLabels,
      datasets: [
        {
          label: 'Humedad (%)',
          data: humedadData,
          borderColor: '#42A5F5',
          backgroundColor: 'rgba(66, 165, 245, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#42A5F5',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4
        },
        {
          label: 'Temperatura (°C)',
          data: temperaturaData,
          borderColor: '#FF7043',
          backgroundColor: 'rgba(255, 112, 67, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#FF7043',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4
        }
      ]
    };

    // Datos del suelo más realistas
    this.suplementosChartData = {
      labels: ['pH', 'EC (mS/cm)', 'Nitrógeno (%)', 'Fósforo (%)', 'Potasio (%)'],
      datasets: [
        {
          label: 'Niveles Actuales',
          data: [
            this.dashboardData?.calidadSuelo.ph || 6.5,
            this.dashboardData?.calidadSuelo.ec || 1.2,
            75 + Math.random() * 20, // Nitrógeno 75-95%
            65 + Math.random() * 25, // Fósforo 65-90%
            80 + Math.random() * 15  // Potasio 80-95%
          ],
          backgroundColor: [
            'rgba(76, 175, 80, 0.8)',
            'rgba(156, 39, 176, 0.8)',
            'rgba(255, 152, 0, 0.8)',
            'rgba(63, 81, 181, 0.8)',
            'rgba(233, 30, 99, 0.8)'
          ],
          borderColor: [
            '#4CAF50',
            '#9C27B0',
            '#FF9800',
            '#3F51B5',
            '#E91E63'
          ],
          borderWidth: 2
        }
      ]
    };
  }

  private generateRealisticHumidityData(): number[] {
    // Simular patrón de humedad: más alta en la madrugada, baja al mediodía
    const baseValues = [70, 68, 65, 45, 40, 55, 65];
    return baseValues.map(base => Math.round((base + (Math.random() - 0.5) * 10) * 10) / 10);
  }

  private generateRealisticTemperatureData(): number[] {
    // Simular patrón de temperatura: fresca en la madrugada, caliente al mediodía
    const baseValues = [18, 16, 20, 28, 30, 25, 22];
    return baseValues.map(base => Math.round((base + (Math.random() - 0.5) * 3) * 10) / 10);
  }

  updateCharts() {
    if (this.dashboardData) {
      const newHumedad = this.dashboardData.humedadActual + (Math.random() - 0.5) * 10;
      const newTemp = this.dashboardData.temperaturaActual + (Math.random() - 0.5) * 5;

      if (this.ambientalChartData?.datasets) {
        this.ambientalChartData.datasets[0].data.shift();
        this.ambientalChartData.datasets[0].data.push(Math.max(0, Math.min(100, newHumedad)));

        this.ambientalChartData.datasets[1].data.shift();
        this.ambientalChartData.datasets[1].data.push(Math.max(10, Math.min(40, newTemp)));
      }
    }
  }

  initChartOptions() {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              weight: '500'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#333',
          bodyColor: '#666',
          borderColor: '#ddd',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context: any) {
              return `${context.dataset.label}: ${context.parsed.y}${context.datasetIndex === 0 ? '%' : '°C'}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: true,
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)',
            font: {
              size: 11
            }
          }
        },
        y: {
          grid: {
            display: true,
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)',
            font: {
              size: 11
            }
          }
        }
      }
    };

    this.mobileChartOptions = {
      ...this.chartOptions,
      plugins: {
        ...this.chartOptions.plugins,
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 10
            }
          }
        }
      }
    };
  }

  updateChartOptions() {
    if (this.isMobile) {
      this.chartOptions = this.mobileChartOptions;
    }
  }

  toggleRiegoMode() {
    if (this.dashboardData) {
      const newMode = this.dashboardData.tipoRiego === 'Manual' ? 'Automatico' : 'Manual';
      this.dashboardData.tipoRiego = newMode;
    }
  }

  getEstadoColor(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'óptimo':
      case 'optimo':
        return '#4CAF50';
      case 'bueno':
        return '#FF9800';
      case 'necesita atención':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  }

  getSeverityByValue(value: number, min: number, max: number): BadgeSeverity  {
    const percentage = ((value - min) / (max - min)) * 100;
    if (percentage >= 70) return 'success';
    if (percentage >= 40) return 'warn';
    return 'danger';
  }
}
