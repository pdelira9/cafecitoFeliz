import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';


@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app-layout.component.html',
})
export class AppLayoutComponent {
  readonly currentYear = new Date().getFullYear();

constructor(private auth: AuthService, private router: Router) {}

logout() {
  this.auth.logout();
  this.router.navigateByUrl('/auth/login');
}

get user() {
  return this.auth.getUser();
}
get isAdmin(): boolean {
    return this.auth.hasRole('admin');
  }

}