import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';

  loading = false;
  errorMsg = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  login() {
    this.errorMsg = '';

    const email = this.email.trim().toLowerCase();
    const password = this.password; // ← esto está perfecto

    if (!email || !password) {
      this.errorMsg = 'Escribe tu correo y contraseña.';
      return;
    }

    if (this.loading) return;
    this.loading = true;

    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.loading = false;

        const returnUrl =
          this.route.snapshot.queryParamMap.get('returnUrl') ?? '/ventas';

        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading = false;

        this.errorMsg =
          err?.error?.error === 'Invalid credentials'
            ? 'Credenciales incorrectas.'
            : 'No se pudo iniciar sesión.';
      },
    });
  }
}