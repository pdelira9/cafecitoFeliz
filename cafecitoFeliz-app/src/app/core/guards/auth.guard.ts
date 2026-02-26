import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';


export const authGuard: CanMatchFn = (_route, segments) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // URL destino que el usuario intentO abrir
  const attemptedUrl = '/' + segments.map(s => s.path).join('/');

if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: attemptedUrl === '/' ? '/ventas' : attemptedUrl },
    });
  }

  // Si si hay sesion, permitimos la navegacion
  return true;
};