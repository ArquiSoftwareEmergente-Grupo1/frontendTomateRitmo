import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  routerLink: string;
  description?: string;
  badge?: string;
  badgeClass?: string;
}

interface User {
  name: string;
  email: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() visible = false;
  @Output() visibilityChange = new EventEmitter<boolean>();

  isMobile = false;

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/inicio',
      description: 'Panel principal'
    },
    {
      label: 'Cultivos',
      icon: 'pi pi-slack',
      routerLink: '/cultivos',
      description: 'Gestión de cultivos',
      badge: '12',
      badgeClass: 'bg-success'
    },
    {
      label: 'Análisis',
      icon: 'pi pi-chart-line',
      routerLink: '/analisis-visual',
      description: 'Reportes y estadísticas'
    },
    {
      label: 'Historial',
      icon: 'pi pi-file',
      routerLink: '/historial',
      description: 'Reportes y análisis histórico'
    }
    /*{
      label: 'Suscripción',
      icon: 'pi pi-wallet',
      routerLink: '/suscripcion',
      description: 'Planes de Suscripción'
    },*/
  ];

  currentUser: User = {
    name: 'Usuario Demo',
    email: 'demo@tomateritmo.com'
  };

  constructor(private router: Router) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.visible) {
      this.closeSidebar();
    }
  }

  ngOnInit() {
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 1024;
  }

  closeSidebar() {
    this.visible = false;
    this.visibilityChange.emit(false);
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    if (this.isMobile) {
      this.closeSidebar();
    }
  }

  navigateToProfile() {
    this.router.navigate(['/perfil']);
    if (this.isMobile) {
      this.closeSidebar();
    }
  }

  logout() {
    this.closeSidebar();
  }

  getUserInitials(): string {
    if (!this.currentUser?.email) return 'U';
    // Tomar las primeras dos letras del email antes del @
    const emailPrefix = this.currentUser.email.split('@')[0];
    return emailPrefix.substring(0, 2).toUpperCase();
  }

  getPlan(): string {
    return 'Premium';
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }
}
