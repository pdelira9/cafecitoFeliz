import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent {
  constructor(private auth: AuthService, private router: Router) {}

  get isLoggedIn() {
    return this.auth.isLoggedIn();
  }

  goMain() {
    this.router.navigateByUrl(this.isLoggedIn ? '/ventas' : '/auth/login');
  }
}
