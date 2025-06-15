import { Component, EventEmitter, OnInit, Output, HostListener, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Button } from 'primeng/button';
import { AuthService } from '../../../core/services/auth/auth.service';
import { NgIf, NgClass, TitleCasePipe } from '@angular/common';
import { Tooltip } from 'primeng/tooltip';
import { Avatar } from 'primeng/avatar';
import { Badge } from 'primeng/badge';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { Subscription, filter } from 'rxjs';
import {User} from '../../../core/interfaces/auth/user.interface';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  imports: [
    Button,
    NgIf,
    Tooltip,
    Avatar,
    Menu,
    TitleCasePipe
  ],
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() menuClick = new EventEmitter<void>();

  currentUser: User | null = null;
  currentPageTitle = 'Dashboard';
  isMobile = false;
  notificationCount = 3;

  userMenuItems: MenuItem[] = [];
  private subscriptions: Subscription[] = [];

  private pageTitles: { [key: string]: string } = {
    '/inicio': 'Dashboard',
    '/cultivos': 'Gestión de Cultivos',
    '/riego': 'Control de Riego',
    '/analisis-visual': 'Análisis Visual',
    '/historial': 'Historial y Reportes',
    '/perfil': 'Mi Perfil'
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  ngOnInit() {
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.initUserMenu();
    });
    this.subscriptions.push(userSub);

    const routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updatePageTitle(event.url);
      });
    this.subscriptions.push(routerSub);

    this.updatePageTitle(this.router.url);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  private updatePageTitle(url: string) {
    const baseUrl = url.split('?')[0];
    this.currentPageTitle = this.pageTitles[baseUrl] || 'TomateRitmo';
  }

  private initUserMenu() {
    this.userMenuItems = [
      {
        label: 'Mi Perfil',
        icon: 'pi pi-user',
        command: () => this.navigateToProfile()
      },
      {
        label: 'Configuración',
        icon: 'pi pi-cog',
        command: () => this.openSettings()
      },
      {
        separator: true
      },
      {
        label: 'Cerrar Sesión',
        icon: 'pi pi-sign-out',
        command: () => this.logout()
      }
    ];
  }

  onMenuClick() {
    this.menuClick.emit();
  }

  navigateToProfile() {
    this.router.navigate(['/perfil']);
  }

  openSettings() {
    console.log('Abrir configuración');
  }

  openNotifications() {
    console.log('Abrir notificaciones');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserInitials(): string {
    if (!this.currentUser?.name) return 'U';
    return this.currentUser.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }
}
