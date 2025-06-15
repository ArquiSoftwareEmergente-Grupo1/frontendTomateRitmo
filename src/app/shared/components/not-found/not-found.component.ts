import { Component } from '@angular/core';
import {Button} from 'primeng/button';
import {Router} from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [
    Button
  ],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css'
})
export class ServerErrorComponent {
  constructor(private router: Router) {}

  retry() {
    window.location.reload();
  }

  goHome() {
    this.router.navigate(['/inicio']);
  }
}

export class NotFoundComponent {

}
