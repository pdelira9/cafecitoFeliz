import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersService, Customer } from '../../core/services/customers/customers.service';
import { AuthService } from '../../core/services/auth/auth.service';


@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customers.component.html',
})
export class CustomersComponent implements OnInit {

  query = '';

  activeFilter: 'true' | 'false' | 'all' = 'true';

  customers: Customer[] = [];
  loading = false;
  msg = '';

  page = 1;
  limit = 12;
  total = 0;


  createName = '';
  createContact = '';
  creating = false;
  createMsg = '';


  editingId: string | null = null;
  editName = '';
  editContact = '';
  savingEdit = false;
  editMsg = '';

  constructor(private customersApi: CustomersService, private auth: AuthService) {}


  ngOnInit(): void {
    this.loadCustomers(true);
  }

  get isAdmin(): boolean {
    return this.auth.hasRole('admin');
  }


  loadCustomers(resetPage = false): void {
    if (resetPage) this.page = 1;

    this.msg = '';
    this.loading = true;

    const q = this.query.trim();
    const active: 'true' | 'false' | 'all' = this.isAdmin ? this.activeFilter : 'true';

    this.customersApi.listCustomers(this.page, this.limit, q || undefined, active).subscribe({
      next: (res) => {
        this.customers = res.data;
        this.total = res.total;
        this.loading = false;

        if (res.total === 0) {
          this.msg = 'No hay clientes con ese criterio.';
        }
      },
      error: (err) => {
        console.error('listCustomers failed:', err);
        this.loading = false;
        this.msg = 'No se pudieron cargar clientes. Intenta de nuevo.';
      },
    });
  }


  search(): void {
    this.loadCustomers(true);
  }


  clear(): void {
    this.query = '';
    this.activeFilter = 'true';
    this.page = 1;
    this.customers = [];
    this.total = 0;
    this.msg = '';
    this.loadCustomers(true);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  nextPage(): void {
    if (this.page >= this.totalPages) return;
    this.page++;
    this.loadCustomers(false);
  }

  prevPage(): void {
    if (this.page <= 1) return;
    this.page--;
    this.loadCustomers(false);
  }


  createCustomer(): void {
    this.createMsg = '';

    if (!this.isAdmin) {
      this.createMsg = 'No tienes permisos para crear clientes.';
      return;
    }

    const name = this.createName.trim();
    const phoneOrEmail = this.createContact.trim().toLowerCase();

    if (!name || !phoneOrEmail) {
      this.createMsg = 'Nombre y contacto son requeridos.';
      return;
    }

    if (this.creating) return;
    this.creating = true;

    this.customersApi.createCustomer({ name, phoneOrEmail }).subscribe({
      next: () => {
        this.creating = false;
        this.createMsg = 'Cliente creado correctamente.';
        this.createName = '';
        this.createContact = '';
        this.loadCustomers(true);
      },
      error: (err) => {
        console.error('createCustomer failed:', err);
        const apiError = err?.error?.error;
        this.creating = false;

        if (apiError === 'Customer already exists') {
          this.createMsg = 'Ya existe un cliente con ese contacto.';
        } else if (apiError === 'Validation failed') {
          this.createMsg = 'Datos inválidos. Revisa nombre y contacto.';
        } else {
          this.createMsg = 'No se pudo crear el cliente.';
        }
      },
    });
  }

  startEdit(c: Customer): void {
    if (!this.isAdmin) return;

    this.editMsg = '';
    this.editingId = c.id;
    this.editName = c.name;
    this.editContact = c.phoneOrEmail;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editName = '';
    this.editContact = '';
    this.editMsg = '';
  }

  saveEdit(customerId: string): void {
    if (!this.isAdmin) return;

    this.editMsg = '';
    const name = this.editName.trim();
    const phoneOrEmail = this.editContact.trim().toLowerCase();

    if (!name || !phoneOrEmail) {
      this.editMsg = 'Nombre y contacto son requeridos.';
      return;
    }

    if (this.savingEdit) return;
    this.savingEdit = true;

    this.customersApi.updateCustomer(customerId, { name, phoneOrEmail }).subscribe({
      next: (updated) => {
        this.customers = this.customers.map((x) => (x.id === updated.id ? updated : x));
        this.savingEdit = false;
        this.cancelEdit();
      },
      error: (err) => {
        console.error('updateCustomer failed:', err);
        const apiError = err?.error?.error;
        this.savingEdit = false;

        if (apiError === 'Customer already exists') {
          this.editMsg = 'Ya existe un cliente con ese contacto.';
        } else if (apiError === 'Validation failed') {
          this.editMsg = 'Datos inválidos. Revisa nombre y contacto.';
        } else {
          this.editMsg = 'No se pudo guardar el cliente.';
        }
      },
    });
  }


  toggleActive(c: Customer): void {
    if (!this.isAdmin) return;

    const next = !c.active;

    const ok = confirm(
      next
        ? `¿Reactivar a "${c.name}"?`
        : `¿Desactivar a "${c.name}"?\n\n(Esto NO borra el cliente)`
    );
    if (!ok) return;

    this.customersApi.setCustomerActive(c.id, next).subscribe({
      next: (updated) => {
        this.customers = this.customers.map((x) => (x.id === updated.id ? updated : x));

        if (this.activeFilter === 'true' && !updated.active) {
          this.loadCustomers(false);
        }

        if (this.activeFilter === 'false' && updated.active) {
          this.loadCustomers(false);
        }
      },
      error: (err) => {
        console.error('setCustomerActive failed:', err);
        alert('No se pudo actualizar el estado del cliente.');
      },
    });
  }
}