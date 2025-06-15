import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { AuthService } from '../../core/services/auth/auth.service';
import { HeaderComponent } from '../components/header/header.component';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { NgClass } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  imports: [
    HeaderComponent,
    RouterOutlet,
    SidebarComponent,
    NgClass,
  ],
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit, OnDestroy {
  sidebarVisible = false;
  isMobile = false;
  private subscriptions: Subscription[] = [];

  constructor(private authService: AuthService) {
    this.checkScreenSize();
  }


  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
    if (this.isMobile && this.sidebarVisible) {
      this.sidebarVisible = false;
    }
  }

  ngOnInit() {
    if (this.isMobile) {
      this.sidebarVisible = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 1024;
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar() {
    this.sidebarVisible = false;
  }

  onSidebarVisibilityChange(visible: boolean) {
    this.sidebarVisible = visible;
  }
}
