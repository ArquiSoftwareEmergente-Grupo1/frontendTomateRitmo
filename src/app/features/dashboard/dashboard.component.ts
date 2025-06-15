import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { DashboardService } from '../../core/services/dashboard/dashboard.service';
import { ProgressSpinner } from 'primeng/progressspinner';
import {NgIf, NgClass, DatePipe} from '@angular/common';
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
    DatePipe,
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
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.loading = false;
        this.initCharts();
        this.loadEstadisticas();
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
      }
    });
  }

  refreshData() {
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.estadisticas.ultimaActualizacion = new Date();
        this.updateCharts();
      },
      error: (error) => {
        console.error('Error refreshing data:', error);
      }
    });
  }

  private loadEstadisticas() {
    this.estadisticas = {
      totalCultivos: 8,
      alertasActivas: 3,
      eficienciaRiego: 87,
      ultimaActualizacion: new Date()
    };
  }

  initCharts() {
    this.ambientalChartData = {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      datasets: [
        {
          label: 'Humedad (%)',
          data: [65, 60, 55, 45, 40, 50, 58],
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
          data: [22, 20, 18, 24, 28, 26, 23],
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

    this.suplementosChartData = {
      labels: ['pH', 'EC', 'Nitrógeno', 'Fósforo', 'Potasio'],
      datasets: [
        {
          label: 'Niveles Actuales',
          data: [6.5, 1.2, 85, 75, 90],
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
