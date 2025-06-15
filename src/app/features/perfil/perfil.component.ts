import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CommonModule } from '@angular/common';

import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { AuthService } from '../../core/services/auth/auth.service';
import { User } from '../../core/interfaces/auth/user.interface';
import {Toast} from 'primeng/toast';

@Component({
  selector: 'app-perfil',
  standalone: true,
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Button,
    InputText,
    Toast
  ]
})
export class PerfilComponent implements OnInit {
  perfilForm!: FormGroup;
  currentUser: User | null = null;
  loading = false;
  editing = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadUserData();
  }

  initForm() {
    this.perfilForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      country: ['', [Validators.required]],
      city: ['', [Validators.required]],
      password: ['']
    });
  }

  loadUserData() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.perfilForm.patchValue({
          name: user.name,
          email: user.email,
          country: user.country,
          city: user.city
        });
      }
    });
  }

  toggleEdit() {
    this.editing = !this.editing;
    if (!this.editing) {
      this.loadUserData();
    }
  }

  saveProfile() {
    if (this.perfilForm.valid) {
      this.loading = true;
      const formData = this.perfilForm.value;

      const updateData: Partial<User> = {
        name: formData.name,
        email: formData.email,
        country: formData.country,
        city: formData.city
      };

      this.authService.updateProfile(updateData).subscribe({
        next: (updatedUser) => {
          this.loading = false;
          this.editing = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Perfil actualizado correctamente'
          });
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al actualizar el perfil'
          });
        }
      });
    } else {
      Object.keys(this.perfilForm.controls).forEach(key => {
        this.perfilForm.get(key)?.markAsTouched();
      });
    }
  }

  changePassword() {
    this.messageService.add({
      severity: 'info',
      summary: 'Información',
      detail: 'Función de cambio de contraseña no implementada'
    });
  }

  deleteAccount() {
    this.confirmationService.confirm({
      message: '¿Está seguro de que desea eliminar su cuenta? Esta acción no se puede deshacer.',
      header: 'Confirmar Eliminación de Cuenta',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Información',
          detail: 'Función de eliminación de cuenta no implementada'
        });
      }
    });
  }
}
