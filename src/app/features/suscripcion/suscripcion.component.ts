import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {Plan, SuscripcionService} from '../../core/services/suscripcion/suscripcion.service';
import {Button} from 'primeng/button';
import {ProgressSpinner} from 'primeng/progressspinner';
import {NgForOf, NgIf} from '@angular/common';
import {Toast} from 'primeng/toast';


@Component({
  selector: 'app-suscripcion',
  templateUrl: './suscripcion.component.html',
  imports: [
    Button,
    ProgressSpinner,
    NgIf,
    NgForOf,
    Toast
  ],
  styleUrls: ['./suscripcion.component.css']
})
export class SuscripcionComponent implements OnInit {
  planes: Plan[] = [];
  loading = true;
  selectedPlan: Plan | null = null;

  constructor(
    private suscripcionService: SuscripcionService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadPlanes();
  }

  loadPlanes() {
    this.suscripcionService.getPlanes().subscribe({
      next: (planes) => {
        this.planes = planes;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading plans:', error);
        this.loading = false;
      }
    });
  }

  selectPlan(plan: Plan) {
    this.selectedPlan = plan;
    localStorage.setItem('selectedPlan', JSON.stringify(plan));
    this.router.navigate(['/pago']);
  }
}
