import { CanMatchFn, Route, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';

export const roleGuard: CanMatchFn = (route: Route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const requiredRole = route.data?.['role'] as ('admin' | 'cashier' | undefined);

  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/login');
    return false;
  }

  if (requiredRole && !auth.hasRole(requiredRole)) {
    // Si no tiene permisos, lo mandamos a ventas
    router.navigateByUrl('/ventas');
    return false;
  }

  return true;
};