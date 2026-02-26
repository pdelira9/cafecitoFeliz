import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  UsersService,
  User,
  UserRole,
} from '../../core/services/users/users.service';
import { ToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = true;
  errorMsg = '';

  page = 1;
  limit = 20;
  total = 0;

  q = '';
  roleFilter: 'all' | UserRole = 'all';
  activeFilter: 'all' | 'true' | 'false' = 'all';

  // Crear usuario

  creating = false;
  createName = '';
  createEmail = '';
  createPassword = '';
  createRole: UserRole = 'cashier';

  // Reset password

  resettingPassword = false;
  resetTarget: User | null = null;
  resetPasswordValue = '';

  constructor(
    private usersApi: UsersService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.errorMsg = '';

    this.usersApi
      .getUsers(
        this.page,
        this.limit,
        this.q,
        this.roleFilter,
        this.activeFilter,
      )
      .subscribe({
        next: (res) => {
          this.users = res.data;
          this.total = res.total;
          this.loading = false;
        },
        error: (err) => {
          console.error('GET /users failed:', err);
          this.errorMsg = 'No se pudieron cargar los usuarios.';
          this.loading = false;
        },
      });
  }

  applyFilters() {
    this.page = 1;
    this.loadUsers();
  }

  clearFilters() {
    this.q = '';
    this.roleFilter = 'all';
    this.activeFilter = 'all';
    this.page = 1;
    this.loadUsers();
  }

  get totalPages(): number {
    if (this.limit <= 0) return 1;
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  prevPage() {
    if (this.page <= 1) return;
    this.page--;
    this.loadUsers();
  }

  nextPage() {
    if (this.page >= this.totalPages) return;
    this.page++;
    this.loadUsers();
  }

  // Crear usuario

  createUser() {
    const name = this.createName.trim();
    const email = this.createEmail.trim().toLowerCase();
    const password = this.createPassword;

    if (!name || !email || !password) {
      this.toast.error('Completa nombre, correo y contraseña.');
      return;
    }
    if (password.length < 6) {
      this.toast.error('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    if (this.creating) return;
    this.creating = true;

    this.usersApi
      .createUser({ name, email, password, role: this.createRole })
      .subscribe({
        next: () => {
          this.toast.success('Usuario creado.');
          this.createName = '';
          this.createEmail = '';
          this.createPassword = '';
          this.createRole = 'cashier';
          this.creating = false;

          this.loadUsers();
        },
        error: (err) => {
          console.error('POST /users failed:', err);

          const apiError = err?.error?.error;
          if (apiError === 'User already exists') {
            this.toast.error('Ya existe un usuario con ese correo.');
          } else if (apiError === 'Validation failed') {
            this.toast.error('Datos inválidos. Revisa el formulario.');
          } else {
            this.toast.error('No se pudo crear el usuario.');
          }
          this.creating = false;
        },
      });
  }

  // Activar o desactivar

  toggleActive(u: User) {
    const next = !u.active;

    const ok = confirm(
      next
        ? `¿Activar a "${u.name}"?`
        : `¿Desactivar a "${u.name}"? (no podrá iniciar sesión)`,
    );

    if (!ok) return;

    this.usersApi.setUserActive(u.id, { active: next }).subscribe({
      next: (updated) => {
        this.toast.success(next ? 'Usuario activado.' : 'Usuario desactivado.');

        this.users = this.users.map((x) => (x.id === updated.id ? updated : x));
      },
      error: (err) => {
        console.error('PATCH /users/:id/active failed:', err);
        const apiError = err?.error?.error;

        if (apiError === 'You cannot disable your own user') {
          this.toast.error('No puedes desactivarte a ti mismo.');
        } else {
          this.toast.error('No se pudo actualizar el estado del usuario.');
        }
      },
    });
  }

  // Reset password

  openReset(u: User) {
    this.resetTarget = u;
    this.resetPasswordValue = '';
  }

  closeReset() {
    this.resetTarget = null;
    this.resetPasswordValue = '';
    this.resettingPassword = false;
  }

  confirmReset() {
    if (!this.resetTarget) return;

    const pwd = this.resetPasswordValue;
    if (!pwd || pwd.length < 6) {
      this.toast.error('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    if (this.resettingPassword) return;
    this.resettingPassword = true;

    this.usersApi
      .resetPassword(this.resetTarget.id, { password: pwd })
      .subscribe({
        next: () => {
          this.toast.success('Contraseña actualizada.');
          this.closeReset();
        },
        error: (err) => {
          console.error('PATCH /users/:id/password failed:', err);
          this.toast.error('No se pudo actualizar la contraseña.');
          this.resettingPassword = false;
        },
      });
  }

  roleLabel(role: UserRole): string {
    return role === 'admin' ? 'Admin' : 'Cajero';
  }
}
