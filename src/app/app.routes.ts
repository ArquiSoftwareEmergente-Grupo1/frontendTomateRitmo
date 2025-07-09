import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { SuscripcionComponent } from './features/suscripcion/suscripcion.component';
import { PagoComponent } from './features/pago/pago.component';
import { LayoutComponent } from './shared/layout/layout.component';
import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CultivosComponent } from './features/cultivos/cultivos.component';
import { RiegoComponent } from './features/riego/riego.component';
import { AnalisisVisualComponent } from './features/analisis/analisis.component';
import { HistorialComponent } from './features/historial/historial.component';
import { PerfilComponent } from './features/perfil/perfil.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [GuestGuard],
    title: 'Iniciar Sesión - TomateRitmo',
    data: {
      animation: 'LoginPage',
      description: 'Inicia sesión en tu cuenta de TomateRitmo'
    }
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [GuestGuard],
    title: 'Registro - TomateRitmo',
    data: {
      animation: 'RegisterPage',
      description: 'Crea tu cuenta en TomateRitmo'
    }
  },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'inicio',
        component: DashboardComponent,
        title: 'Dashboard - TomateRitmo',
        data: {
          animation: 'DashboardPage',
          description: 'Panel de control principal',
          breadcrumb: 'Dashboard'
        }
      },
      {
        path: 'suscripcion',
        component: SuscripcionComponent,
        title: 'Planes de Suscripción - TomateRitmo',
        data: {
          animation: 'SuscripcionPage',
          description: 'Elige el plan que mejor se adapte a tus necesidades'
        }
      },
      {
        path: 'pago',
        component: PagoComponent,
        title: 'Proceso de Pago - TomateRitmo',
        data: {
          animation: 'PagoPage',
          description: 'Completa tu suscripción'
        }
      },
      {
        path: 'cultivos',
        component: CultivosComponent,
        title: 'Gestión de Cultivos - TomateRitmo',
        data: {
          animation: 'CultivosPage',
          description: 'Administra y monitorea tus cultivos',
          breadcrumb: 'Cultivos'
        }
      },
      {
        path: 'analisis-visual',
        component: AnalisisVisualComponent,
        title: 'Análisis Visual - TomateRitmo',
        data: {
          animation: 'AnalisisPage',
          description: 'Detección de anomalías con IA',
          breadcrumb: 'Análisis Visual'
        }
      },
      {
        path: 'historial',
        component: HistorialComponent,
        title: 'Historial y Reportes - TomateRitmo',
        data: {
          animation: 'HistorialPage',
          description: 'Reportes y análisis histórico',
          breadcrumb: 'Historial'
        }
      },
      {
        path: 'perfil',
        component: PerfilComponent,
        title: 'Mi Perfil - TomateRitmo',
        data: {
          animation: 'PerfilPage',
          description: 'Configuración de cuenta',
          breadcrumb: 'Mi Perfil'
        }
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      }
    ]
  },

  {
    path: '404',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Página no encontrada - TomateRitmo',
    data: { animation: 'ErrorPage' }
  },
  {
    path: '**',
    redirectTo: '404'
  }
];
