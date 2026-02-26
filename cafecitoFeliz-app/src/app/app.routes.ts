import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layouts/app-layout/app-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ventas' },

  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/login/login.component').then((c) => c.LoginComponent),
        title: 'Login',
      },
      {
        path: 'not-found',
        loadComponent: () =>
          import('./pages/not-found/not-found.component').then(
            (c) => c.NotFoundComponent,
          ),
      },
    ],
  },

  //Protegida por authguard
  {
    path: '',
    component: AppLayoutComponent,
    canMatch: [authGuard],
    children: [
      {
        path: 'ventas',
        loadComponent: () =>
          import('./pages/sales/sales.component').then((c) => c.SalesComponent),
        title: 'Ventas',
      },
      {
        path: 'dashboard',
        canMatch: [roleGuard],
        data: { role: 'admin' },
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (c) => c.DashboardComponent,
          ),
        title: 'Dashboard',
      },

      {
        path: 'productos',
        canMatch: [roleGuard],
        data: { role: 'admin' },
        loadComponent: () =>
          import('./components/products/products.component').then(
            (c) => c.ProductsComponent,
          ),
        title: 'Productos',
      },
      {
        path: 'usuarios',
        canMatch: [roleGuard],
        data: { role: 'admin' },
        loadComponent: () =>
          import('./pages/users/users.component').then((c) => c.UsersComponent),
        title: 'Usuarios',
      },

      {
        path: 'clientes',
        loadComponent: () =>
          import('./pages/customers/customers.component').then(
            (c) => c.CustomersComponent,
          ),
        title: 'Clientes',
      },

      {
        path: 'historial',
        loadComponent: () =>
          import('./pages/sales-history/sales-history.component').then(
            (c) => c.SalesHistoryComponent,
          ),
        title: 'Historial',
      },
    ],
  },


  { path: '**', redirectTo: 'auth/not-found' },

];
