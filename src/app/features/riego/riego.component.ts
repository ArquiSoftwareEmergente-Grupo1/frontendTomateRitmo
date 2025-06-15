import { Component, OnInit, HostListener } from '@angular/core';
import { MessageService } from 'primeng/api';
import { RiegoService } from '../../core/services/riego/riego.service';
import { Button } from 'primeng/button';
import { DatePipe, NgIf, NgForOf, NgClass } from '@angular/common';
import { ProgressSpinner } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { Slider } from 'primeng/slider';
import { FormsModule } from '@angular/forms';
import { Card } from 'primeng/card';
import { ToggleButton } from 'primeng/togglebutton';
import { Knob } from 'primeng/knob';
import { Badge } from 'primeng/badge';
import { ProgressBar } from 'primeng/progressbar';
import { Timeline } from 'primeng/timeline';
import { InputSwitch } from 'primeng/inputswitch';
import { TabView, TabPanel } from 'primeng/tabview';
import { UIChart } from 'primeng/chart';
import {ConfiguracionRiego} from '../../core/interfaces/riego/configuracion-riego.interface';
import {RiegoHistorial} from '../../core/interfaces/riego/riego-historial.interface';
import {RiegoManual} from '../../core/interfaces/riego/riego-manual.interface';
import {EjecutarRiegoRequest} from '../../core/interfaces/riego/ejecutar-riego-request.interface';
import {Tooltip} from 'primeng/tooltip';
import {Toast} from 'primeng/toast';

@Component({
  selector: 'app-riego',
  templateUrl: './riego.component.html',
  imports: [
    Button,
    DatePipe,
    ProgressSpinner,
    TableModule,
    Slider,
    FormsModule,
    NgIf,
    Badge,
    Tooltip,
    Toast,
  ],
  styleUrls: ['./riego.component.css']
})
export class RiegoComponent implements OnInit {
  tipoRiego: 'Manual' | 'Automatico' = 'Automatico';
  configuracion: ConfiguracionRiego | null = null;
  historialRiego: RiegoHistorial[] = [];
  riegoManual: RiegoManual[] = [];
  loading = true;
  isMobile = false;

  sistemaActivo = true;
  riegoEnProceso = false;

  consumoChartData: any;
  chartOptions: any;

  timelineEvents: any[] = [];

  estadisticas = {
    consumoDiario: 0,
    eficiencia: 0,
    riegosHoy: 0,
    ahorroAgua: 0
  };

  constructor(
    private riegoService: RiegoService,
    private messageService: MessageService
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.initChartOptions();
    this.loadData();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  loadData() {
    this.loading = true;

    Promise.all([
      this.riegoService.getConfiguracion().toPromise(),
      this.riegoService.getHistorialRiego().toPromise(),
      this.riegoService.getRiegoManual().toPromise(),
      this.loadEstadisticas()
    ]).then(([config, historial, manual]) => {
      this.configuracion = config!;
      this.tipoRiego = config!.tipoRiego;
      this.sistemaActivo = config!.activo || true;
      this.historialRiego = historial!;
      this.riegoManual = manual!;
      this.createTimelineEvents();
      this.initConsumoChart();
      this.loading = false;
    }).catch(error => {
      console.error('Error loading data:', error);
      this.loading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar la configuración de riego'
      });
    });
  }

  private loadEstadisticas(): Promise<void> {
    return new Promise((resolve) => {
      this.estadisticas = {
        consumoDiario: 245.5,
        eficiencia: 87,
        riegosHoy: 6,
        ahorroAgua: 23.8
      };
      resolve();
    });
  }

  private createTimelineEvents() {
    this.timelineEvents = this.historialRiego
      .slice(0, 8)
      .map(item => ({
        date: new Date(item.ultimoRiego).toLocaleDateString(),
        time: new Date(item.ultimoRiego).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        icon: 'pi pi-tint',
        color: '#42A5F5',
        evento: `Riego ${item.tipoRiego.toLowerCase()} - ${item.nombre}`,
        zona: 'N/A',
        duracion: Math.floor(Math.random() * 30) + 10 + ' min',
        consumo: (Math.random() * 50 + 20).toFixed(1) + ' L'
      }));
  }

  private initConsumoChart() {
    this.consumoChartData = {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      datasets: [
        {
          label: 'Consumo de Agua (L)',
          data: [15, 25, 45, 60, 40, 30, 20],
          borderColor: '#42A5F5',
          backgroundColor: 'rgba(66, 165, 245, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#42A5F5',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4
        }
      ]
    };
  }

  private initChartOptions() {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#333',
          bodyColor: '#666',
          borderColor: '#ddd',
          borderWidth: 1,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#666', font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(0,0,0,0.1)' },
          ticks: { color: '#666', font: { size: 11 } }
        }
      }
    };
  }

  onTipoRiegoChange() {
    if (this.configuracion) {
      this.configuracion.tipoRiego = this.tipoRiego;
      this.updateConfiguracion();
    }
  }

  onSistemaToggle() {
    if (this.configuracion) {
      this.configuracion.activo = this.sistemaActivo;
      this.updateConfiguracion();

      this.messageService.add({
        severity: this.sistemaActivo ? 'success' : 'info',
        summary: 'Sistema de Riego',
        detail: `Sistema ${this.sistemaActivo ? 'activado' : 'desactivado'} correctamente`
      });
    }
  }

  updateConfiguracion() {
    if (this.configuracion) {
      this.riegoService.updateConfiguracion(this.configuracion).subscribe({
        next: (config) => {
          this.configuracion = config;
          this.messageService.add({
            severity: 'success',
            summary: 'Configuración Actualizada',
            detail: 'Los cambios se han guardado correctamente',
            life: 3000
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al actualizar la configuración'
          });
        }
      });
    }
  }

  ejecutarRiego(zona: EjecutarRiegoRequest) {
    this.riegoEnProceso = true;

    this.riegoService.ejecutarRiegoManual(zona).subscribe({
      next: (success) => {
        this.riegoEnProceso = false;
        if (success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Riego Ejecutado',
            detail: `Riego manual iniciado en ${zona}`,
            life: 4000
          });

          this.loadData();
        }
      },
      error: (error) => {
        this.riegoEnProceso = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error en Riego',
          detail: 'No se pudo ejecutar el riego manual'
        });
      }
    });
  }

  onHumedadChange() {
    if (this.configuracion) {
      if (this.configuracion.humedadMinima >= this.configuracion.humedadMaxima) {
        this.configuracion.humedadMaxima = this.configuracion.humedadMinima + 10;
      }

      this.updateConfiguracion();
    }
  }

  ejecutarRiegoEmergencia() {
    this.messageService.add({
      severity: 'warning',
      summary: 'Riego de Emergencia',
      detail: 'Ejecutando riego de emergencia en todas las zonas...',
      life: 5000
    });
  }

  programarRiego() {
    this.messageService.add({
      severity: 'info',
      summary: 'Programación',
      detail: 'Función de programación de riego en desarrollo'
    });
  }

  getHumedadColor(humedad: number): string {
    if (humedad < 30) return '#F44336';
    if (humedad < 60) return '#FF9800';
    return '#4CAF50';
  }

  getHumedadSeverity(humedad: number): 'success' | 'warning' | 'danger' {
    if (humedad < 30) return 'danger';
    if (humedad < 60) return 'warning';
    return 'success';
  }

  needsWatering(item: RiegoManual): boolean {
    return item.humedad < (this.configuracion?.humedadMinima || 40);
  }
}
