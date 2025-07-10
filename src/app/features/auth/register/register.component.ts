import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Password } from 'primeng/password';
import { InputText } from 'primeng/inputtext';
import { NgIf, NgClass } from '@angular/common';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Checkbox } from 'primeng/checkbox';
import { Divider } from 'primeng/divider';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [
    Button,
    Password,
    ReactiveFormsModule,
    InputText,
    NgIf,
    NgClass,
    Checkbox,
    Divider,
    Toast
  ],
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  isMobile = false;
  passwordStrength = 0;

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
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });

    this.registerForm.get('password')?.valueChanges.subscribe(password => {
      this.passwordStrength = this.calculatePasswordStrength(password);
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({passwordMismatch: true});
      return {passwordMismatch: true};
    }
    return null;
  }

  calculatePasswordStrength(password: string): number {
    if (!password) return 0;

    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[a-z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 10;

    return Math.min(score, 100);
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;

      const formData = this.registerForm.value;

      this.authService.register(formData).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: '¡Registro Exitoso!',
              detail: 'Tu cuenta ha sido creada correctamente',
              life: 4000
            });

            setTimeout(() => {
              this.router.navigate(['/suscripcion']);
            }, 2000);
          }
        },
        error: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error en el Registro',
            detail: 'No se pudo crear la cuenta. Inténtalo nuevamente.'
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  loginWithFacebook() {
    this.messageService.add({
      severity: 'info',
      summary: 'Próximamente',
      detail: 'Registro con Facebook estará disponible pronto'
    });
  }

  loginWithGoogle() {
    this.messageService.add({
      severity: 'info',
      summary: 'Próximamente',
      detail: 'Registro con Google estará disponible pronto'
    });
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }

  getPasswordStrengthColor(): string {
    if (this.passwordStrength < 30) return '#F44336';
    if (this.passwordStrength < 60) return '#FF9800';
    if (this.passwordStrength < 80) return '#4CAF50';
    return '#2E7D32';
  }

  getPasswordStrengthText(): string {
    if (this.passwordStrength < 30) return 'Muy débil';
    if (this.passwordStrength < 60) return 'Débil';
    if (this.passwordStrength < 80) return 'Buena';
    return 'Muy fuerte';
  }
}
