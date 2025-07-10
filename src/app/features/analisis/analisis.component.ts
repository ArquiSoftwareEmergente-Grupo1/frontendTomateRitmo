import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AnalisisService } from '../../core/services/analisis/analisis.service';
import { CultivosService } from '../../core/services/cultivos/cultivos.service';
import { ProgressSpinner } from 'primeng/progressspinner';
import { NgIf, NgClass, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileUpload } from 'primeng/fileupload';
import { TabView, TabPanel } from 'primeng/tabview';
import { Dialog } from 'primeng/dialog';
import { ProgressBar } from 'primeng/progressbar';
import { AlertaVisual } from '../../core/interfaces/analisis/alerta-visual.interface';
import { AnalisisResultado } from '../../core/interfaces/analisis/analisis-resultado.interface';
import { Cultivo } from '../../core/interfaces/cultivo/cultivo.interface';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-analisis-visual',
  templateUrl: './analisis.component.html',
  imports: [
    NgIf,
    NgClass,
    NgFor,
    FormsModule,
    ProgressSpinner,
    FileUpload,
    TabView,
    TabPanel,
    Dialog,
    ProgressBar,
    Toast,

  ],
  styleUrls: ['./analisis.component.css']
})
export class AnalisisVisualComponent implements OnInit, OnDestroy, AfterViewInit {
  alertasVisuales: AlertaVisual[] = [];
  ultimoAnalisis: AnalisisResultado | null = null;
  historialAnalisis: AnalisisResultado[] = [];
  historialCultivoSeleccionado: AnalisisResultado[] = [];
  cultivos: Cultivo[] = [];
  cultivoSeleccionado: Cultivo | null = null;
  
  // Cache del historial por cultivo para evitar recargas
  historialPorCultivo: Map<string, AnalisisResultado[]> = new Map();
  
  // Modal de detalle
  mostrarDetalleModal = false;
  analisisDetalle: AnalisisResultado | null = null;
  
  // Cache de URLs de blob para imágenes de ngrok
  imagenBlobUrls: Map<string, string> = new Map();
  
  // Modal de historial completo
  mostrarHistorialCompletoModal = false;
  historialCompletoFiltrado: AnalisisResultado[] = [];
  historialCompletoPaginado: AnalisisResultado[] = [];
  paginaActual = 1;
  elementosPorPagina = 10;
  totalPaginas = 0;
  filtroFecha = '';
  filtroAnomalia = '';
  filtroConfianza = '';
  ordenPor = 'fecha';
  ordenDireccion: 'asc' | 'desc' = 'desc';
  
  loading = true;
  loadingCultivos = false;
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
    private cultivosService: CultivosService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.loadData();
    this.loadCultivos();
  }

  ngAfterViewInit() {
    // Verificar si hay datos en cache y refrescar si es necesario
    if (this.cultivoSeleccionado && this.historialCultivoSeleccionado.length === 0) {
      setTimeout(() => {
        this.cargarHistorialCultivo(this.cultivoSeleccionado!.id);
      }, 100);
    }
  }

  ngOnDestroy() {
    // No limpiar el cache al destruir el componente para mantener persistencia
    
    // Limpiar URLs de blob para evitar memory leaks
    this.imagenBlobUrls.forEach((url, key) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.imagenBlobUrls.clear();
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
          this.historialAnalisis = resultados.slice(0, 20);
          if (resultados.length > 0) {
            this.ultimoAnalisis = resultados[0];
          }
          
          // Pre-cargar imágenes como blobs
          this.precargarImagenesComoBlobs(resultados);
          
          // Si hay un cultivo seleccionado, refrescar su historial
          if (this.cultivoSeleccionado) {
            this.cargarHistorialCultivo(this.cultivoSeleccionado.id);
          }
          
          resolve();
        },
        error: (error) => {
          console.error('Error cargando historial:', error);
          reject(error);
        }
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

  loadCultivos(): void {
    this.loadingCultivos = true;
    this.cultivosService.getCultivos().subscribe({
      next: (cultivos: Cultivo[]) => {
        this.cultivos = cultivos;
        this.loadingCultivos = false;
      },
      error: (error) => {
        console.error('Error cargando cultivos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los cultivos'
        });
        this.loadingCultivos = false;
      }
    });
  }

  seleccionarCultivo(cultivo: Cultivo): void {
    this.cultivoSeleccionado = cultivo;
    this.cargarHistorialCultivo(cultivo.id);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Cultivo seleccionado',
      detail: `Cultivo "${cultivo.nombre}" seleccionado para análisis`,
      life: 3000
    });
  }

  cambiarCultivo(): void {
    this.cultivoSeleccionado = null;
    this.ultimoAnalisis = null;
    this.mostrarConfirmacion = false;
    this.historialCultivoSeleccionado = [];
    // No limpiar el cache, se mantiene para futuras selecciones
  }

  cargarHistorialCultivo(cultivoId: string): void {
    // Verificar si ya tenemos el historial en cache Y el historial general no está vacío
    if (this.historialPorCultivo.has(cultivoId) && this.historialAnalisis.length > 0) {
      this.historialCultivoSeleccionado = this.historialPorCultivo.get(cultivoId) || [];
      return;
    }

    // Si no tenemos historial general O el cache está vacío, cargar/recargar
    if (this.historialAnalisis.length === 0) {
      this.analisisService.getAnalisisResultados().subscribe({
        next: (resultados) => {
          this.historialAnalisis = resultados;
          this.filtrarHistorialPorCultivo(cultivoId);
        },
        error: (error) => {
          console.error('Error cargando historial:', error);
          this.historialCultivoSeleccionado = [];
        }
      });
    } else {
      // Ya tenemos historial general, solo filtrar
      this.filtrarHistorialPorCultivo(cultivoId);
    }
  }

  private filtrarHistorialPorCultivo(cultivoId: string): void {
    // Filtrar el historial por el cultivo seleccionado
    const historialFiltrado = this.historialAnalisis.filter(
      analisis => {
        const analisisId = String(analisis.cultivoId);
        const buscadoId = String(cultivoId);
        return analisisId === buscadoId;
      }
    ).sort((a, b) => 
      new Date(b.fechaAnalisis || '').getTime() - new Date(a.fechaAnalisis || '').getTime()
    );
    
    // Guardar en cache y asignar al historial actual
    this.historialPorCultivo.set(cultivoId, historialFiltrado);
    this.historialCultivoSeleccionado = historialFiltrado;
  }

  esCultivoSeleccionado(cultivo: Cultivo): boolean {
    return this.cultivoSeleccionado?.id === cultivo.id;
  }

  verTodoHistorialCultivo(): void {
    if (!this.cultivoSeleccionado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Selecciona un cultivo primero'
      });
      return;
    }

    // Resetear filtros y paginación
    this.paginaActual = 1;
    this.filtroFecha = '';
    this.filtroAnomalia = '';
    this.filtroConfianza = '';
    this.ordenPor = 'fecha';
    this.ordenDireccion = 'desc';

    // Cargar todo el historial del cultivo seleccionado
    this.historialCompletoFiltrado = [...this.historialCultivoSeleccionado];
    this.aplicarFiltrosYOrdenamiento();
    this.mostrarHistorialCompletoModal = true;

    console.log('🔍 Abriendo historial completo:', {
      cultivo: this.cultivoSeleccionado.nombre,
      totalAnalisis: this.historialCompletoFiltrado.length,
      paginaActual: this.paginaActual,
      elementosPorPagina: this.elementosPorPagina
    });
  }

  formatFecha(fecha?: string): string {
    if (!fecha) return 'Fecha no disponible';
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Métodos específicos para el modal de detalle
  getAnomaliaDisplayName(anomalia: string): string {
    const nombres: Record<string, string> = {
      'Bacterial_spot': 'Mancha Bacteriana',
      'Early_blight': 'Tizón Temprano',
      'Late_blight': 'Tizón Tardío',
      'Leaf_Mold': 'Moho de las Hojas',
      'Septoria_leaf_spot': 'Mancha Foliar por Septoria',
      'Spider_mites': 'Ácaros',
      'Spider_mites Two-spotted_spider_mite': 'Ácaros',
      'Target_Spot': 'Mancha Objetivo',
      'Tomato_Yellow_Leaf_Curl_Virus': 'Virus del Rizado Amarillo',
      'Tomato_mosaic_virus': 'Virus del Mosaico del Tomate',
      'powdery_mildew': 'Oídio',
      'healthy': 'Planta Saludable'
    };
    return nombres[anomalia] || anomalia;
  }

  getAnomaliaDescription(anomalia: string): string {
    const descripciones: Record<string, string> = {
      'Bacterial_spot': 'Enfermedad bacteriana que causa manchas oscuras en hojas y frutos, especialmente en condiciones húmedas.',
      'Early_blight': 'Enfermedad fúngica que afecta principalmente las hojas inferiores, causando manchas marrones con anillos concéntricos.',
      'Late_blight': 'Enfermedad fúngica devastadora que puede destruir toda la planta en condiciones favorables.',
      'Leaf_Mold': 'Hongo que se desarrolla en condiciones de alta humedad, causando manchas amarillas en el haz de las hojas.',
      'Septoria_leaf_spot': 'Enfermedad fúngica que causa pequeñas manchas circulares con centros grises en las hojas.',
      'Spider_mites': 'Pequeños arácnidos que se alimentan de la savia de las plantas, causando decoloración y daño foliar.',
      'Spider_mites Two-spotted_spider_mite': 'Pequeños arácnidos que se alimentan de la savia de las plantas, causando decoloración y daño foliar.',
      'Target_Spot': 'Enfermedad fúngica que causa manchas circulares con anillos concéntricos en hojas y frutos.',
      'Tomato_Yellow_Leaf_Curl_Virus': 'Virus transmitido por mosca blanca que causa amarillamiento y rizado de las hojas.',
      'Tomato_mosaic_virus': 'Virus que causa mosaicos de color verde claro y oscuro en las hojas.',
      'powdery_mildew': 'Enfermedad fúngica que forma un polvo blanco característico en hojas y tallos, especialmente en condiciones de alta humedad.',
      'healthy': 'La planta presenta un estado saludable sin anomalías detectadas.'
    };
    return descripciones[anomalia] || 'Descripción no disponible.';
  }

  confirmarDiagnosticoDetalle(): void {
    if (this.analisisDetalle) {
      this.analisisService.confirmarDiagnostico(this.analisisDetalle.id, true).subscribe({
        next: (resultado) => {
          this.analisisDetalle!.confirmado = true;
          // Actualizar también en el historial
          const index = this.historialAnalisis.findIndex(a => a.id === this.analisisDetalle!.id);
          if (index !== -1) {
            this.historialAnalisis[index].confirmado = true;
          }
          // Actualizar cache del cultivo
          this.actualizarCacheAnalisis(this.analisisDetalle!);
          this.messageService.add({
            severity: 'success',
            summary: 'Confirmado',
            detail: 'Diagnóstico confirmado correctamente',
            life: 3000
          });
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

  marcarComoErrorDetalle(): void {
    if (this.analisisDetalle) {
      this.analisisService.confirmarDiagnostico(this.analisisDetalle.id, false).subscribe({
        next: (resultado) => {
          this.analisisDetalle!.confirmado = false;
          // Actualizar también en el historial
          const index = this.historialAnalisis.findIndex(a => a.id === this.analisisDetalle!.id);
          if (index !== -1) {
            this.historialAnalisis[index].confirmado = false;
          }
          // Actualizar cache del cultivo
          this.actualizarCacheAnalisis(this.analisisDetalle!);
          this.messageService.add({
            severity: 'info',
            summary: 'Feedback Enviado',
            detail: 'Marcado como diagnóstico incorrecto'
          });
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

  exportarAnalisisDetalle(): void {
    if (this.analisisDetalle) {
      // Crear objeto con información del análisis para exportar
      const analisisInfo = {
        id: this.analisisDetalle.id,
        fecha: this.formatFecha(this.analisisDetalle.fechaAnalisis),
        cultivo: this.cultivoSeleccionado?.nombre || 'No especificado',
        diagnostico: this.analisisDetalle.diagnostico,
        anomalia: this.getAnomaliaDisplayName(this.analisisDetalle.anomalia),
        confianza: this.formatConfianza(this.analisisDetalle.confianza),
        recomendaciones: this.analisisDetalle.recomendaciones,
        confirmado: this.analisisDetalle.confirmado ? 'Sí' : 'No'
      };

      // Convertir a JSON y descargar
      const dataStr = JSON.stringify(analisisInfo, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `analisis_${this.analisisDetalle.id}_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      this.messageService.add({
        severity: 'success',
        summary: 'Exportado',
        detail: 'Análisis exportado correctamente'
      });
    }
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
    if (!this.cultivoSeleccionado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe seleccionar un cultivo primero'
      });
      return;
    }

    this.analizando = true;
    this.mostrarConfirmacion = false;

    this.analisisService.analizarImagen(file, this.cultivoSeleccionado.id).subscribe({
      next: (resultado) => {

        this.ultimoAnalisis = resultado;
        this.analizando = false;
        this.mostrarConfirmacion = true;

        this.historialAnalisis.unshift(resultado);
        if (this.historialAnalisis.length > 10) {
          this.historialAnalisis = this.historialAnalisis.slice(0, 10);
        }

        // Limpiar cache del cultivo y recargar historial actualizado
        if (this.cultivoSeleccionado) {
          this.historialPorCultivo.delete(this.cultivoSeleccionado.id);
          this.cargarHistorialCultivo(this.cultivoSeleccionado.id);
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
    // No limpiar cultivoSeleccionado para mantener la selección
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
    this.analisisDetalle = { ...analisis }; // Crear copia para evitar modificaciones accidentales
    this.mostrarDetalleModal = true;
  }

  cerrarDetalleModal(): void {
    this.mostrarDetalleModal = false;
    this.analisisDetalle = null;
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

  trackByCultivo(index: number, item: Cultivo): string {
    return item.id;
  }

  // Método para actualizar el cache del análisis modificado
  private actualizarCacheAnalisis(analisisActualizado: AnalisisResultado): void {
    const cultivoId = analisisActualizado.cultivoId;
    if (cultivoId && this.historialPorCultivo.has(cultivoId)) {
      const historialCultivo = this.historialPorCultivo.get(cultivoId) || [];
      const index = historialCultivo.findIndex(a => a.id === analisisActualizado.id);
      if (index !== -1) {
        historialCultivo[index] = { ...analisisActualizado };
        this.historialPorCultivo.set(cultivoId, historialCultivo);
        // Actualizar también el historial visible si es el cultivo actual
        if (this.cultivoSeleccionado?.id === cultivoId) {
          this.historialCultivoSeleccionado = historialCultivo;
        }
      }
    }
  }

  // ===== MÉTODOS PARA HISTORIAL COMPLETO =====
  
  aplicarFiltrosYOrdenamiento(): void {
    let historialFiltrado = [...this.historialCultivoSeleccionado];

    // Aplicar filtro por fecha
    if (this.filtroFecha) {
      const fechaFiltro = new Date(this.filtroFecha);
      historialFiltrado = historialFiltrado.filter(analisis => {
        if (!analisis.fechaAnalisis) return false;
        const fechaAnalisis = new Date(analisis.fechaAnalisis);
        return fechaAnalisis.toDateString() === fechaFiltro.toDateString();
      });
    }

    // Aplicar filtro por anomalía
    if (this.filtroAnomalia) {
      historialFiltrado = historialFiltrado.filter(analisis => 
        analisis.anomalia.toLowerCase().includes(this.filtroAnomalia.toLowerCase())
      );
    }

    // Aplicar filtro por confianza
    if (this.filtroConfianza) {
      const confianzaMin = parseFloat(this.filtroConfianza) / 100;
      historialFiltrado = historialFiltrado.filter(analisis => 
        analisis.confianza >= confianzaMin
      );
    }

    // Aplicar ordenamiento
    historialFiltrado.sort((a, b) => {
      let valorA: any;
      let valorB: any;

      switch (this.ordenPor) {
        case 'fecha':
          valorA = a.fechaAnalisis ? new Date(a.fechaAnalisis).getTime() : 0;
          valorB = b.fechaAnalisis ? new Date(b.fechaAnalisis).getTime() : 0;
          break;
        case 'confianza':
          valorA = a.confianza;
          valorB = b.confianza;
          break;
        case 'anomalia':
          valorA = a.anomalia.toLowerCase();
          valorB = b.anomalia.toLowerCase();
          break;
        default:
          valorA = a.fechaAnalisis ? new Date(a.fechaAnalisis).getTime() : 0;
          valorB = b.fechaAnalisis ? new Date(b.fechaAnalisis).getTime() : 0;
      }

      if (this.ordenDireccion === 'asc') {
        return valorA < valorB ? -1 : valorA > valorB ? 1 : 0;
      } else {
        return valorA > valorB ? -1 : valorA < valorB ? 1 : 0;
      }
    });

    this.historialCompletoFiltrado = historialFiltrado;
    this.calcularPaginacion();
  }

  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.historialCompletoFiltrado.length / this.elementosPorPagina);
    
    // Asegurar que la página actual esté dentro del rango válido
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = Math.max(1, this.totalPaginas);
    }
    
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    this.historialCompletoPaginado = this.historialCompletoFiltrado.slice(inicio, fin);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.calcularPaginacion();
    }
  }

  cambiarOrden(campo: string): void {
    if (this.ordenPor === campo) {
      this.ordenDireccion = this.ordenDireccion === 'asc' ? 'desc' : 'asc';
    } else {
      this.ordenPor = campo;
      this.ordenDireccion = 'desc';
    }
    this.aplicarFiltrosYOrdenamiento();
  }

  limpiarFiltros(): void {
    this.filtroFecha = '';
    this.filtroAnomalia = '';
    this.filtroConfianza = '';
    this.ordenPor = 'fecha';
    this.ordenDireccion = 'desc';
    this.paginaActual = 1;
    this.aplicarFiltrosYOrdenamiento();
  }

  cerrarHistorialCompleto(): void {
    this.mostrarHistorialCompletoModal = false;
    this.historialCompletoFiltrado = [];
    this.historialCompletoPaginado = [];
  }

  exportarHistorial(): void {
    if (this.historialCompletoFiltrado.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin datos',
        detail: 'No hay análisis para exportar'
      });
      return;
    }

    // Crear datos CSV
    const headers = ['Fecha', 'Diagnóstico', 'Anomalía', 'Confianza', 'Confirmado'];
    const csvData = this.historialCompletoFiltrado.map(analisis => [
      this.formatFecha(analisis.fechaAnalisis),
      analisis.diagnostico,
      analisis.anomalia,
      this.formatConfianza(analisis.confianza),
      analisis.confirmado ? 'Sí' : 'No'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `historial_${this.cultivoSeleccionado?.nombre}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Exportado',
      detail: 'Historial exportado correctamente'
    });
  }

  getPaginaNumeros(): number[] {
    const paginas: number[] = [];
    const maxPaginasVisibles = 5;
    
    let inicio = Math.max(1, this.paginaActual - Math.floor(maxPaginasVisibles / 2));
    let fin = Math.min(this.totalPaginas, inicio + maxPaginasVisibles - 1);
    
    // Ajustar inicio si estamos cerca del final
    if (fin - inicio < maxPaginasVisibles - 1) {
      inicio = Math.max(1, fin - maxPaginasVisibles + 1);
    }
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/placeholder-image.png';
    }
  }

  // Método para obtener URL de blob de imagen para evitar advertencia de ngrok
  getImagenBlobUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    
    // Si ya tenemos la URL de blob en cache, devolverla
    if (this.imagenBlobUrls.has(imageUrl)) {
      return this.imagenBlobUrls.get(imageUrl)!;
    }
    
    // Si es una URL de ngrok, cargarla como blob
    if (imageUrl.includes('ngrok-free.app') || imageUrl.includes('ngrok.io')) {
      // Marcar como cargando para evitar múltiples peticiones
      const loadingKey = imageUrl + '_loading';
      if (!this.imagenBlobUrls.has(loadingKey)) {
        this.imagenBlobUrls.set(loadingKey, 'loading');
        
        this.analisisService.getImagenAsBlob(imageUrl).subscribe({
          next: (blobUrl) => {
            this.imagenBlobUrls.set(imageUrl, blobUrl);
            this.imagenBlobUrls.delete(loadingKey);
            this.cdr.detectChanges(); // Forzar detección de cambios
          },
          error: (error) => {
            console.error('Error cargando imagen como blob:', error);
            this.imagenBlobUrls.delete(loadingKey);
            // En caso de error, usar la URL original
            this.imagenBlobUrls.set(imageUrl, imageUrl);
            this.cdr.detectChanges();
          }
        });
      }
      
      // Devolver una imagen placeholder mientras carga
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNODAgNjVMMTIwIDEwNUw4MCA2NVoiIGZpbGw9IiM5Q0E0QUYiLz48L3N2Zz4=';
    }
    
    // Para URLs que no son de ngrok, devolver la URL original
    return imageUrl;
  }

  // Método para pre-cargar imágenes como blobs
  private precargarImagenesComoBlobs(resultados: AnalisisResultado[]): void {
    resultados.forEach(resultado => {
      if (resultado.imagen && (resultado.imagen.includes('ngrok-free.app') || resultado.imagen.includes('ngrok.io'))) {
        // Solo cargar si no está ya en cache
        if (!this.imagenBlobUrls.has(resultado.imagen)) {
          const loadingKey = resultado.imagen + '_loading';
          if (!this.imagenBlobUrls.has(loadingKey)) {
            this.imagenBlobUrls.set(loadingKey, 'loading');
            
            this.analisisService.getImagenAsBlob(resultado.imagen).subscribe({
              next: (blobUrl) => {
                this.imagenBlobUrls.set(resultado.imagen, blobUrl);
                this.imagenBlobUrls.delete(loadingKey);
                this.cdr.detectChanges();
              },
              error: (error) => {
                console.error('Error pre-cargando imagen:', error);
                this.imagenBlobUrls.delete(loadingKey);
                this.imagenBlobUrls.set(resultado.imagen, resultado.imagen);
              }
            });
          }
        }
      }
    });
  }
}
