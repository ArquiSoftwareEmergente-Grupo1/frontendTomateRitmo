import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import {Button} from 'primeng/button';
import {InputText} from 'primeng/inputtext';
import {NgForOf, NgIf} from '@angular/common';
import {Plan, SuscripcionService} from '../../core/services/suscripcion/suscripcion.service';
import {Toast} from 'primeng/toast';

@Component({
  selector: 'app-pago',
  templateUrl: './pago.component.html',
  imports: [
    Button,
    InputText,
    ReactiveFormsModule,
    NgIf,
    NgForOf,
    Toast
  ],
  styleUrls: ['./pago.component.css']
})
export class PagoComponent implements OnInit {
  pagoForm!: FormGroup;
  selectedPlan: Plan | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private suscripcionService: SuscripcionService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadSelectedPlan();
  }

  initForm() {
    this.pagoForm = this.fb.group({
      numeroTarjeta: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      fechaVencimiento: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      codigoSeguridad: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  loadSelectedPlan() {
    const planData = localStorage.getItem('selectedPlan');
    if (planData) {
      this.selectedPlan = JSON.parse(planData);
    } else {
      this.router.navigate(['/suscripcion']);
    }
  }

  onSubmit() {
    if (this.pagoForm.valid && this.selectedPlan) {
      this.loading = true;

      this.suscripcionService.procesarPago(this.pagoForm.value, this.selectedPlan.id).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Pago Exitoso',
              detail: 'Tu suscripción ha sido activada correctamente'
            });
            localStorage.removeItem('selectedPlan');
            setTimeout(() => {
              this.router.navigate(['/inicio']);
            }, 2000);
          }
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error en el Pago',
            detail: 'Ocurrió un error al procesar el pago'
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  formatCardNumber(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    value = value.substring(0, 16);
    event.target.value = value;
    this.pagoForm.patchValue({ numeroTarjeta: value });
  }

  formatExpiryDate(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    event.target.value = value;
    this.pagoForm.patchValue({ fechaVencimiento: value });
  }

  formatCVC(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    value = value.substring(0, 4);
    event.target.value = value;
    this.pagoForm.patchValue({ codigoSeguridad: value });
  }

  private markFormGroupTouched() {
    Object.keys(this.pagoForm.controls).forEach(key => {
      this.pagoForm.get(key)?.markAsTouched();
    });
  }
}
