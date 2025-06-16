import { Component, OnInit, HostListener } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AnalisisService } from '../../core/services/analisis/analisis.service';
import { ProgressSpinner } from 'primeng/progressspinner';
import { NgIf, NgClass } from '@angular/common';
import { FileUpload } from 'primeng/fileupload';
import { TabView, TabPanel } from 'primeng/tabview';
import {AlertaVisual} from '../../core/interfaces/analisis/alerta-visual.interface';
import {AnalisisResultado} from '../../core/interfaces/analisis/analisis-resultado.interface';
import {Toast} from 'primeng/toast';

@Component({
  selector: 'app-analisis-visual',
  templateUrl: './analisis.component.html',
  imports: [
    NgIf,
    NgClass,
    ProgressSpinner,
    FileUpload,
    TabView,
    TabPanel,
    Toast,

  ],
  styleUrls: ['./analisis.component.css']
})
export class AnalisisVisualComponent implements OnInit {
  alertasVisuales: AlertaVisual[] = [];
  ultimoAnalisis: AnalisisResultado | null = null;
  historialAnalisis: AnalisisResultado[] = [];
  loading = true;
  analizando = false;
  mostrarConfirmacion = false;
  isMobile = false;

  estadisticas = {
    totalAnalisis: 0,
    confianzaPromedio: 0,
    anomaliasDetectadas: 0,
    confirmacionPromedio: 0
  };

  responsiveOptions = [
    {
      breakpoint: '1024px',
      numVisible: 3
    },
    {
      breakpoint: '768px',
      numVisible: 2
    },
    {
      breakpoint: '560px',
      numVisible: 1
    }
  ];

  timelineEvents: any[] = [];

  constructor(
    private analisisService: AnalisisService,
    private messageService: MessageService
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.loadData();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  loadData() {
    this.loading = true;

    Promise.all([
      this.loadAlertas(),
      this.loadHistorialAnalisis(),
      this.loadEstadisticas()
    ]).then(() => {
      this.loading = false;
    }).catch(error => {
      console.error('Error loading data:', error);
      this.loading = false;
    });
  }

  private loadAlertas(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.analisisService.getAlertasVisuales().subscribe({
        next: (alertas) => {
          this.alertasVisuales = alertas.slice(0, 5);
          this.createTimelineEvents();
          resolve();
        },
        error: reject
      });
    });
  }

  private loadHistorialAnalisis(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.analisisService.getAnalisisResultados().subscribe({
        next: (resultados) => {
          this.historialAnalisis = resultados.slice(0, 10);
          if (resultados.length > 0) {
            this.ultimoAnalisis = resultados[0];
          }
          resolve();
        },
        error: reject
      });
    });
  }

  private loadEstadisticas(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.analisisService.getEstadisticasAnalisis().subscribe({
        next: (stats) => {
          this.estadisticas = stats;
          resolve();
        },
        error: reject
      });
    });
  }

  private createTimelineEvents() {
    this.timelineEvents = this.alertasVisuales.map(alerta => ({
      status: this.getAlertaStatus(alerta.severidad),
      date: new Date(alerta.fechaDeteccion || new Date()).toLocaleDateString(),
      icon: this.getAlertaIcon(alerta.severidad),
      color: this.getAlertaColor(alerta.severidad),
      alerta: alerta
    }));
  }

  onFileUpload(event: any) {
    const file = event.files?.[0];
    if (file) {
      this.analizarImagen(file);
    }
  }

  analizarImagen(file: File) {

    this.analizando = true;
    this.mostrarConfirmacion = false;

    this.analisisService.analizarImagen(file).subscribe({
      next: (resultado) => {

        this.ultimoAnalisis = resultado;
        this.analizando = false;
        this.mostrarConfirmacion = true;

        this.historialAnalisis.unshift(resultado);
        if (this.historialAnalisis.length > 10) {
          this.historialAnalisis = this.historialAnalisis.slice(0, 10);
        }

        this.messageService.add({
          severity: resultado.anomalia === 'healthy' ? 'success' : 'warn',
          summary: 'Análisis Completado',
          detail: `${resultado.diagnostico} - Confianza: ${(resultado.confianza * 100).toFixed(0)}%`,
          life: 5000
        });

        this.loadEstadisticas();
      },
      error: (error) => {

        this.analizando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al analizar la imagen'
        });
      }
    });
  }


  confirmarDiagnostico() {
    if (this.ultimoAnalisis) {
      this.analisisService.confirmarDiagnostico(this.ultimoAnalisis.id, true).subscribe({
        next: (resultado) => {
          this.ultimoAnalisis = resultado;
          this.messageService.add({
            severity: 'success',
            summary: 'Confirmado',
            detail: 'Diagnóstico confirmado correctamente',
            life: 3000
          });
          this.mostrarConfirmacion = false;
          this.loadEstadisticas();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al confirmar diagnóstico'
          });
        }
      });
    }
  }

  marcarComoError() {
    if (this.ultimoAnalisis) {
      this.analisisService.confirmarDiagnostico(this.ultimoAnalisis.id, false).subscribe({
        next: (resultado) => {
          this.ultimoAnalisis = resultado;
          this.messageService.add({
            severity: 'info',
            summary: 'Feedback Enviado',
            detail: 'Marcado como diagnóstico incorrecto'
          });
          this.mostrarConfirmacion = false;
          this.loadEstadisticas();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al enviar feedback'
          });
        }
      });
    }
  }

  subirNuevaImagen() {
    this.ultimoAnalisis = null;
    this.mostrarConfirmacion = false;
  }

  verDetalleAlerta(alerta: AlertaVisual) {
    this.messageService.add({
      severity: 'info',
      summary: 'Detalle de Alerta',
      detail: `${alerta.tipoAnomalia} en ${alerta.zonaAfectada}`,
      life: 4000
    });
  }

  verDetalleAnalisis(analisis: AnalisisResultado) {
    this.ultimoAnalisis = analisis;
    this.mostrarConfirmacion = false;
  }

  exportarResultados() {
    this.messageService.add({
      severity: 'info',
      summary: 'Exportar',
      detail: 'Función de exportación en desarrollo'
    });
  }

  getAlertaStatus(severidad?: string): string {
    switch (severidad) {
      case 'alta': return 'Crítica';
      case 'media': return 'Moderada';
      case 'baja': return 'Leve';
      default: return 'Normal';
    }
  }

  getAlertaIcon(severidad?: string): string {
    switch (severidad) {
      case 'alta': return 'pi pi-exclamation-triangle';
      case 'media': return 'pi pi-info-circle';
      case 'baja': return 'pi pi-check-circle';
      default: return 'pi pi-circle';
    }
  }

  getAlertaColor(severidad?: string): string {
    switch (severidad) {
      case 'alta': return '#F44336';
      case 'media': return '#FF9800';
      case 'baja': return '#4CAF50';
      default: return '#9E9E9E';
    }
  }

  getSeverityClass(severidad?: string): string {
    switch (severidad) {
      case 'alta': return 'danger';
      case 'media': return 'warning';
      case 'baja': return 'success';
      default: return 'info';
    }
  }

  getConfianzaColor(confianza: number): string {
    if (confianza >= 0.8) return '#4CAF50';
    if (confianza >= 0.6) return '#FF9800';
    return '#F44336';
  }

  getConfianzaSeverity(confianza: number): 'success' | 'warning' | 'danger' {
    if (confianza >= 0.8) return 'success';
    if (confianza >= 0.6) return 'warning';
    return 'danger';
  }

  formatConfianza(confianza: number): string {
    return (confianza * 100).toFixed(1) + '%';
  }

  trackByAnalisis(index: number, item: AnalisisResultado): string {
    return item.id;
  }

  trackByAlerta(index: number, item: AlertaVisual): string {
    return item.id;
  }
}
