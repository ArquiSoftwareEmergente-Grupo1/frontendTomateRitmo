
import {Component, OnInit, HostListener, TrackByFunction} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { MessageService, ConfirmationService, PrimeTemplate } from 'primeng/api';
import { CultivosService } from '../../core/services/cultivos/cultivos.service';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Dialog } from 'primeng/dialog';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Tooltip } from 'primeng/tooltip';
import {DatePipe, NgClass, NgIf, NgForOf, SlicePipe} from '@angular/common';
import { TableModule } from 'primeng/table';
import { Card } from 'primeng/card';
import { Badge } from 'primeng/badge';
import {Dropdown, DropdownModule} from 'primeng/dropdown';
import { Calendar } from 'primeng/calendar';
import { ProgressSpinner } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { Chip } from 'primeng/chip';
import {Paginator} from 'primeng/paginator';
import {Cultivo} from '../../core/interfaces/cultivo/cultivo.interface';
import {Toast} from 'primeng/toast';

@Component({
  selector: 'app-cultivos',
  templateUrl: './cultivos.component.html',
  imports: [
    Button,
    InputText,
    ReactiveFormsModule,
    Dialog,
    ConfirmDialog,
    Tooltip,
    PrimeTemplate,
    DatePipe,
    TableModule,
    Badge,
    Calendar,
    SkeletonModule,
    Chip,
    NgClass,
    NgIf,
    NgForOf,
    FormsModule,
    DropdownModule,
    SlicePipe,
    Paginator,
    Toast
  ],
  providers: [ConfirmationService],
  styleUrls: ['./cultivos.component.css']
})
export class CultivosComponent implements OnInit {
  cultivos: Cultivo[] = [];
  cultivosFiltrados: Cultivo[] = [];
  loading = true;
  isMobile = false;

  maxDate: Date = new Date();

  displayDialog = false;
  cultivoForm!: FormGroup;
  isEditing = false;
  selectedCultivo: Cultivo | null = null;

  filtroNombre = '';
  filtroSector: string | null = null;
  filtroFase: string | null = null;

  first = 0;
  rows = 10;
  totalRecords = 0;

  sectores = [
    { label: 'Sector 1', value: '1' },
    { label: 'Sector 2', value: '2' },
    { label: 'Sector 3', value: '3' },
    { label: 'Sector 4', value: '4' },
    { label: 'Sector 5', value: '5' }
  ];

  fases = [
    { label: 'Germinación', value: 'GERMINACION' },
    { label: 'Crecimiento Vegetativo', value: 'CRECIMIENTO_VEGETATIVO' },
    { label: 'Floración', value: 'FLORACION' },
    { label: 'Fructificación', value: 'FRUCTIFICACION' },
    { label: 'Maduración', value: 'MADURACION' }
  ];

  viewMode: 'cards' | 'table' = 'cards';

  constructor(
    private cultivosService: CultivosService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.initForm();
    this.loadCultivos();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
    this.viewMode = this.isMobile ? 'cards' : 'table';
  }

  initForm() {
    this.cultivoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      sector: ['', [Validators.required]],
      fechaPlantacion: [new Date(), [Validators.required]],
      faseFenologica: ['GERMINACION', [Validators.required]]
    });
  }

  loadCultivos() {
    this.loading = true;
    this.cultivosService.getCultivos().subscribe({
      next: (cultivos) => {
        this.cultivos = cultivos;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading cultivos:', error);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar los cultivos'
        });
      }
    });
  }

  applyFilters() {
    this.cultivosFiltrados = this.cultivos.filter(cultivo => {
      const matchesNombre = !this.filtroNombre ||
        cultivo.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase());
      const matchesSector = !this.filtroSector || cultivo.sector === this.filtroSector;
      const matchesFase = !this.filtroFase || cultivo.faseFenologica === this.filtroFase;

      return matchesNombre && matchesSector && matchesFase;
    });

    this.totalRecords = this.cultivosFiltrados.length;
  }

  onFilterChange() {
    this.applyFilters();
    this.first = 0;
  }

  clearFilters() {
    this.filtroNombre = '';
    this.filtroSector = null;
    this.filtroFase = null;
    this.applyFilters();
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'cards' ? 'table' : 'cards';
  }

  showAddDialog() {
    this.isEditing = false;
    this.selectedCultivo = null;
    this.cultivoForm.reset({
      fechaPlantacion: new Date(),
      faseFenologica: 'GERMINACION'
    });
    this.displayDialog = true;
  }

  showEditDialog(cultivo: Cultivo) {
    this.isEditing = true;
    this.selectedCultivo = cultivo;
    this.cultivoForm.patchValue({
      nombre: cultivo.nombre,
      sector: cultivo.sector,
      fechaPlantacion: new Date(cultivo.fechaPlantacion),
      faseFenologica: cultivo.faseFenologica
    });
    this.displayDialog = true;
  }

  hideDialog() {
    this.displayDialog = false;
    this.cultivoForm.reset();
    this.selectedCultivo = null;
  }

  saveCultivo() {
    if (this.cultivoForm.valid) {
      const cultivoData = this.cultivoForm.value;

      if (this.isEditing && this.selectedCultivo) {
        this.cultivosService.updateCultivo(this.selectedCultivo.id, cultivoData).subscribe({
          next: (updatedCultivo) => {
            const index = this.cultivos.findIndex(c => c.id === updatedCultivo.id);
            if (index !== -1) {
              this.cultivos[index] = updatedCultivo;
              this.applyFilters();
            }
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Cultivo actualizado correctamente'
            });
            this.hideDialog();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al actualizar el cultivo'
            });
          }
        });
      } else {
        this.cultivosService.createCultivo(cultivoData).subscribe({
          next: (newCultivo) => {
            this.cultivos.push(newCultivo);
            this.applyFilters();
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Cultivo agregado correctamente'
            });
            this.hideDialog();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al crear el cultivo'
            });
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  deleteCultivo(cultivo: Cultivo) {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el cultivo "${cultivo.nombre}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.cultivosService.deleteCultivo(cultivo.id).subscribe({
          next: (success) => {
            if (success) {
              this.cultivos = this.cultivos.filter(c => c.id !== cultivo.id);
              this.applyFilters();
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Cultivo eliminado correctamente'
              });
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo eliminar el cultivo'
              });
            }
          },
          error: (error) => {
            console.error('Error al eliminar cultivo:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al eliminar el cultivo'
            });
          }
        });
      },
      reject: () => {
        // El usuario canceló la eliminación
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Eliminación cancelada'
        });
      }
    });
  }

  getFaseSeverity(fase: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (fase) {
      case 'GERMINACION':
        return 'info';
      case 'CRECIMIENTO_VEGETATIVO':
        return 'success';
      case 'FLORACION':
        return 'warn';
      case 'FRUCTIFICACION':
        return 'success';
      case 'MADURACION':
        return 'danger';
      default:
        return 'info';
    }
  }

  getFaseLabel(fase: string): string {
    const faseMap: any = {
      'GERMINACION': 'Germinación',
      'CRECIMIENTO_VEGETATIVO': 'Crecimiento Vegetativo',
      'FLORACION': 'Floración',
      'FRUCTIFICACION': 'Fructificación',
      'MADURACION': 'Maduración'
    };
    return faseMap[fase] || fase;
  }

  getDaysPlanted(fechaPlantacion: Date): number {
    const today = new Date();
    const plantDate = new Date(fechaPlantacion);
    const diffTime = Math.abs(today.getTime() - plantDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysToHarvest(fechaCosecha: Date): number {
    const today = new Date();
    const harvestDate = new Date(fechaCosecha);
    const diffTime = harvestDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
  }

  private markFormGroupTouched() {
    Object.keys(this.cultivoForm.controls).forEach(key => {
      this.cultivoForm.get(key)?.markAsTouched();
    });
  }

  exportToPDF() {
    this.messageService.add({
      severity: 'info',
      summary: 'Función',
      detail: 'Exportación a PDF en desarrollo'
    });
  }

  exportToExcel() {
    this.messageService.add({
      severity: 'info',
      summary: 'Función',
      detail: 'Exportación a Excel en desarrollo'
    });
  }

  trackByCultivo: TrackByFunction<Cultivo> | undefined;
}
