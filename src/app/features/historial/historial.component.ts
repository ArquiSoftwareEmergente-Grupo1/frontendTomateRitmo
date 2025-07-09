import { Component, OnInit, HostListener } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HistorialService } from '../../core/services/historial/historial.service';
import { Button } from 'primeng/button';
import { ProgressSpinner } from 'primeng/progressspinner';
import {DatePipe, NgClass, NgIf} from '@angular/common';
import { TableModule } from 'primeng/table';
import { Calendar } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';
import {DropdownModule} from 'primeng/dropdown';
import { TabView, TabPanel } from 'primeng/tabview';
import { Badge } from 'primeng/badge';
import { Chip } from 'primeng/chip';
import {EventoHistorico} from '../../core/interfaces/historial/historial-historico.interface';
import {DatosGrafica} from '../../core/interfaces/historial/datos-grafica.interface';
import {Toast} from 'primeng/toast';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  imports: [
    Button,
    ProgressSpinner,
    NgIf,
    DatePipe,
    TableModule,
    Calendar,
    FormsModule,
    TabView,
    TabPanel,
    Badge,
    Chip,
    DropdownModule,
    NgClass,
    Toast
  ],
  styleUrls: ['./historial.component.css']
})
export class HistorialComponent implements OnInit {
  eventos: EventoHistorico[] = [];
  eventosFiltrados: EventoHistorico[] = [];
  datosGrafica: DatosGrafica | null = null;
  loading = true;
  exportando = false;
  isMobile = false;

  fechaSeleccionada: Date = new Date();
  rangoFechas: Date[] = [];
  tipoEventoSeleccionado: string | null = null;
  zonaSeleccionada: string | null = null;

  tiposEvento = [
    { label: 'Todos los tipos', value: null },
    { label: 'Riego', value: 'riego' },
    { label: 'Fertilización', value: 'fertilizacion' },
    { label: 'Detección de plagas', value: 'plagas' },
    { label: 'Mantenimiento', value: 'mantenimiento' },
    { label: 'Cosecha', value: 'cosecha' }
  ];

  zonas = [
    { label: 'Todas las zonas', value: null },
    { label: 'Sector 1', value: 'Sector 1' },
    { label: 'Sector 2', value: 'Sector 2' },
    { label: 'Sector 3', value: 'Sector 3' },
    { label: 'Sector 4', value: 'Sector 4' },
    { label: 'Sector 5', value: 'Sector 5' }
  ];

  chartOptions: any;
  mobileChartOptions: any;

  timelineEvents: any[] = [];

  estadisticas = {
    totalEventos: 0,
    eventosHoy: 0,
    tipoMasFrecuente: '',
    zonaMasActiva: '',
    tendenciaSemanal: 0
  };

  constructor(
    private historialService: HistorialService,
    private messageService: MessageService
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
    this.updateChartOptions();
  }

  ngOnInit() {
    this.initChartOptions();
    this.loadData();
    this.initFechaRango();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  private initFechaRango() {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    this.rangoFechas = [hace30Dias, hoy];
  }

  loadData() {
    this.loading = true;

    Promise.all([
      this.historialService.getEventosHistoricos().toPromise(),
      this.historialService.getDatosGraficaAmbiental().toPromise(),
      this.loadEstadisticas()
    ]).then(([eventos, grafica]) => {
      this.eventos = eventos || [];
      this.datosGrafica = grafica || null;
      this.applyFilters();
      this.createTimelineEvents();
      this.loading = false;
    }).catch(error => {
      console.error('Error loading data:', error);
      this.loading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar el historial'
      });
    });
  }

  private loadEstadisticas(): Promise<void> {
    return new Promise((resolve) => {
      this.estadisticas = {
        totalEventos: this.eventos.length,
        eventosHoy: this.eventos.filter(e => this.isToday(new Date(e.fecha))).length,
        tipoMasFrecuente: 'Riego automático',
        zonaMasActiva: 'Sector 1',
        tendenciaSemanal: 15
      };
      resolve();
    });
  }

  private isToday(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getFullYear() === hoy.getFullYear();
  }

  applyFilters() {
    this.eventosFiltrados = this.eventos.filter(evento => {
      const fechaEvento = new Date(evento.fecha);

      if (this.rangoFechas.length === 2) {
        const [inicio, fin] = this.rangoFechas;
        if (fechaEvento < inicio || fechaEvento > fin) {
          return false;
        }
      }

      if (this.tipoEventoSeleccionado &&
        !evento.evento.toLowerCase().includes(this.tipoEventoSeleccionado.toLowerCase())) {
        return false;
      }

      if (this.zonaSeleccionada && evento.zona !== this.zonaSeleccionada) {
        return false;
      }

      return true;
    });

    this.updateEstadisticas();
  }

  private updateEstadisticas() {
    this.estadisticas.totalEventos = this.eventosFiltrados.length;
    this.estadisticas.eventosHoy = this.eventosFiltrados.filter(e =>
      this.isToday(new Date(e.fecha))
    ).length;
  }

  onFiltroChange() {
    this.applyFilters();
    this.createTimelineEvents();
  }

  clearFilters() {
    this.tipoEventoSeleccionado = null;
    this.zonaSeleccionada = null;
    this.initFechaRango();
    this.applyFilters();
  }

  private createTimelineEvents() {
    this.timelineEvents = this.eventosFiltrados
      .slice(0, 10)
      .map(evento => ({
        date: new Date(evento.fecha).toLocaleDateString(),
        icon: this.getEventIcon(evento.evento),
        color: this.getEventColor(evento.evento),
        evento: evento
      }));
  }

  protected getEventIcon(evento: string): string {
    const eventoLower = evento.toLowerCase();
    if (eventoLower.includes('riego')) return 'pi pi-tint';
    if (eventoLower.includes('fertiliz')) return 'pi pi-sparkles';
    if (eventoLower.includes('plaga')) return 'pi pi-bug';
    if (eventoLower.includes('cosecha')) return 'pi pi-shopping-bag';
    if (eventoLower.includes('mantenimiento')) return 'pi pi-cog';
    return 'pi pi-circle';
  }

  protected getEventColor(evento: string): string {
    const eventoLower = evento.toLowerCase();
    if (eventoLower.includes('riego')) return '#42A5F5';
    if (eventoLower.includes('fertiliz')) return '#66BB6A';
    if (eventoLower.includes('plaga')) return '#FF7043';
    if (eventoLower.includes('cosecha')) return '#FFA726';
    if (eventoLower.includes('mantenimiento')) return '#AB47BC';
    return '#9E9E9E';
  }

  getEventSeverity(evento: string): 'success' | 'info' | 'warn' | 'danger' {
    const eventoLower = evento.toLowerCase();
    if (eventoLower.includes('plaga') || eventoLower.includes('error')) return 'danger';
    if (eventoLower.includes('mantenimiento') || eventoLower.includes('alerta')) return 'warn';
    if (eventoLower.includes('cosecha') || eventoLower.includes('fertiliz')) return 'success';
    return 'info';
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
            },
            color: '#495057'
          }
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
          title: {
            display: true,
            text: 'Tiempo',
            color: '#495057'
          },
          ticks: {
            color: '#495057',
            font: { size: 11 }
          },
          grid: {
            color: '#ebedef'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Valor',
            color: '#495057'
          },
          ticks: {
            color: '#495057',
            font: { size: 11 }
          },
          grid: {
            color: '#ebedef'
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
            font: { size: 10 }
          }
        }
      }
    };
  }

  updateChartOptions() {
  }

  exportarDatos() {
    this.exportando = true;

    const fechaInicio = this.rangoFechas[0] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fechaFin = this.rangoFechas[1] || new Date();

    this.historialService.exportarDatos(fechaInicio, fechaFin).subscribe({
      next: (nombreArchivo) => {
        this.exportando = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Exportación Exitosa',
          detail: `Archivo "${nombreArchivo}" descargado correctamente`,
          life: 4000
        });
      },
      error: (error) => {
        this.exportando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Exportación',
          detail: 'No se pudo exportar el historial'
        });
      }
    });
  }

  exportarPDF() {
    this.messageService.add({
      severity: 'info',
      summary: 'Exportando PDF',
      detail: 'Generando reporte en PDF...'
    });
  }

  exportarExcel() {
    this.messageService.add({
      severity: 'info',
      summary: 'Exportando Excel',
      detail: 'Generando reporte en Excel...'
    });
  }

  verDetalleEvento(evento: EventoHistorico) {
    this.messageService.add({
      severity: 'info',
      summary: 'Detalle del Evento',
      detail: `${evento.evento} en ${evento.zona}`,
      life: 3000
    });
  }
}
