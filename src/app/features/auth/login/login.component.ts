import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Password } from 'primeng/password';
import { InputText } from 'primeng/inputtext';
import { NgIf, NgClass } from '@angular/common';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Card } from 'primeng/card';
import { Divider } from 'primeng/divider';
import { ProgressSpinner } from 'primeng/progressspinner';
import {Toast} from 'primeng/toast';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [
    Button,
    Checkbox,
    Password,
    ReactiveFormsModule,
    InputText,
    NgIf,
    NgClass,
    Divider,
    Toast,
  ],
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  isMobile = false;
  showPassword = false;

  demoCredentials = {
    email: 'demo@tomateritmo.com',
    password: '123456'
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.initForm();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  initForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: '¡Bienvenido!',
              detail: 'Inicio de sesión exitoso',
              life: 3000
            });

            setTimeout(() => {
              this.router.navigate(['/inicio']);
            }, 1000);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error de Autenticación',
              detail: response.message || 'Credenciales incorrectas'
            });
          }
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error de Conexión',
            detail: 'No se pudo conectar con el servidor'
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  useDemoCredentials() {
    this.loginForm.patchValue({
      email: this.demoCredentials.email,
      password: this.demoCredentials.password
    });
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  loginWithGoogle() {
    this.messageService.add({
      severity: 'info',
      summary: 'Próximamente',
      detail: 'Inicio de sesión con Google estará disponible pronto'
    });
  }

  loginWithFacebook() {
    this.messageService.add({
      severity: 'info',
      summary: 'Próximamente',
      detail: 'Inicio de sesión con Facebook estará disponible pronto'
    });
  }

  forgotPassword() {
    this.messageService.add({
      severity: 'info',
      summary: 'Recuperación de Contraseña',
      detail: 'Se enviará un enlace de recuperación a tu email'
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }
}
