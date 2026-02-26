import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { HttpErrorResponse } from '@angular/common/http';

import { ToastService } from '../../core/ui/toast.service';

import {
  ProductsService,
  Product,
} from '../../core/services/products/products.service';
import {
  CustomersService,
  Customer,
  type CustomersListResponse,
} from '../../core/services/customers/customers.service';
import {
  SalesService,
  CreateSaleResponse,
  CreateSaleRequest,
} from '../../core/services/sales/sales.service';

import {
  SalesLogicService,
  CartItem,
} from '../../core/services/sales/sales-logic.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css',
})
export class SalesComponent implements OnInit {
  pageTitle = 'Ventas';
  readonly currentYear = new Date().getFullYear();
 
  // Clientes
  hasSearchedCustomers = false;

  // Productos
  products: Product[] = [];
  loading = true;
  errorMsg = '';

  // Carrito
  cart: CartItem[] = [];

  // Cliente
  customerQuery = '';
  customers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  searchingCustomers = false;
  customersErrorMsg = '';

  // Crear cliente
  createCustomerName = '';
  createCustomerContact = '';
  creatingCustomer = false;
  createCustomerMsg = '';

  // Cobro y ticket
  paying = false;
  payErrorMsg = '';
  lastTicket: CreateSaleResponse['ticket'] | null = null;

  // Metodo de pago
  paymentMethod: 'cash' | 'card' | 'transfer' = 'cash';
  readonly paymentLabels: Record<'cash' | 'card' | 'transfer', string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
  };

  constructor(
    private productsApi: ProductsService,
    private customersApi: CustomersService,
    private salesApi: SalesService,
    private salesLogic: SalesLogicService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  // Productos

  private loadProducts(): void {
    this.loading = true;
    this.errorMsg = '';

    this.productsApi.getProducts(1, 100).subscribe({
      next: (res) => {
        this.products = res.data;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('GET /products failed:', err);
        this.errorMsg = 'No se pudieron cargar los productos.';
        this.loading = false;
      },
    });
  }

  // Cliente buscar, seleccionar, limpiar

  searchCustomers(): void {
    const q = this.customerQuery.trim();
    this.hasSearchedCustomers = true;
    this.customersErrorMsg = '';
    this.customers = [];

    if (!q) {
      this.toast.error('Escribe nombre, email o teléfono para buscar.');
      return;
    }

    this.searchingCustomers = true;

    this.customersApi.listCustomers(1, 10, q, 'true').subscribe({
      next: (res: CustomersListResponse) => {
        this.customers = res.data;
        this.searchingCustomers = false;

        if (res.total === 0) this.toast.info('No se encontraron clientes.');
      },
      error: (err: HttpErrorResponse) => {
        console.error('GET /customers failed:', err);
        this.toast.error('No se pudo buscar clientes.');
        this.searchingCustomers = false;
      },
    });
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomer = customer;
    this.customers = [];
    this.customerQuery = customer.name;
    this.toast.success(`Cliente seleccionado: ${customer.name}`);
  }

  clearCustomer(): void {
    this.selectedCustomer = null;
    this.customerQuery = '';
    this.customers = [];
    this.customersErrorMsg = '';
    this.toast.info('Venta sin cliente (sin descuento).');
  }

  // Crear cliente

  createCustomer(): void {
    this.createCustomerMsg = '';

    const name = this.createCustomerName.trim();
    const phoneOrEmail = this.createCustomerContact.trim().toLowerCase();

    if (!name || !phoneOrEmail) {
      this.createCustomerMsg = 'Nombre y contacto son requeridos.';
      this.toast.error(this.createCustomerMsg);
      return;
    }

    if (this.creatingCustomer) return;
    this.creatingCustomer = true;

    this.customersApi.createCustomer({ name, phoneOrEmail }).subscribe({
      next: (created: Customer) => {
        this.selectCustomer(created);
        this.createCustomerName = '';
        this.createCustomerContact = '';
        this.createCustomerMsg = 'Cliente creado.';
        this.toast.success('Cliente creado y seleccionado.');
        this.creatingCustomer = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('POST /customers failed:', err);
        const apiError: any = err?.error;

        if (apiError?.error === 'Customer already exists') {
          this.createCustomerMsg = 'Ya existe un cliente con ese contacto.';
        } else if (apiError?.error === 'Validation failed') {
          this.createCustomerMsg = 'Datos inválidos. Revisa el contacto.';
        } else {
          this.createCustomerMsg = 'No se pudo crear el cliente.';
        }

        this.toast.error(this.createCustomerMsg);
        this.creatingCustomer = false;
      },
    });
  }

  // Carrito

  addToCart(product: Product): void {
    const result = this.salesLogic.addToCart(this.cart, product);
    this.cart = result.cart;
    if (!result.ok) this.toast.error(result.message);
  }

  setQuantity(productId: string, rawValue: string): void {
    this.cart = this.salesLogic.setQuantity(this.cart, productId, rawValue);
  }

  removeFromCart(productId: string): void {
    this.cart = this.salesLogic.removeFromCart(this.cart, productId);
  }

  // Total estimados

  get subtotal(): number {
    return this.salesLogic.calculateSubtotal(this.cart);
  }

  get discountPercent(): number {
    if (!this.selectedCustomer) return 0;
    return this.salesLogic.calculateDiscountPercent(
      this.selectedCustomer.purchasesCount,
    );
  }

  get discountAmount(): number {
    return this.salesLogic.calculateDiscountAmount(
      this.subtotal,
      this.discountPercent,
    );
  }

  get total(): number {
    return this.salesLogic.calculateTotal(this.subtotal, this.discountAmount);
  }

  // Cobro
  pay(): void {
    this.payErrorMsg = '';
    this.lastTicket = null;

    if (this.cart.length === 0) {
      this.toast.error('Agrega productos antes de cobrar.');
      return;
    }

    if (this.paying) return;
    this.paying = true;

    const payload: CreateSaleRequest = this.salesLogic.buildCreateSalePayload(
      this.cart,
      this.selectedCustomer,
      this.paymentMethod,
    );

    this.salesApi.createSale(payload).subscribe({
      next: (res: CreateSaleResponse) => {
        this.toast.success('Venta registrada.');
        this.lastTicket = res.ticket;

        // Limpiamos para siguiente venta
        this.cart = this.salesLogic.clearCart();
        this.clearCustomer();
        this.paymentMethod = 'cash';

        this.loadProducts();
        this.paying = false;

        // this.printTicket();
      },
      error: (err: HttpErrorResponse) => {
        console.error('POST /sales failed:', err);
        const apiError: any = err?.error;

        if (apiError?.error === 'Insufficient stock')
          this.toast.error('Stock insuficiente.');
        else if (apiError?.error === 'Validation failed')
          this.toast.error('Datos inválidos.');
        else this.toast.error('No se pudo registrar la venta.');

        this.paying = false;
      },
    });
  }

  // TICKET: imprimir genérico (window.print)

  printTicket(): void {
    if (!this.lastTicket) {
      this.toast.info('No hay ticket para imprimir todavía.');
      return;
    }

    const t = this.lastTicket;

    const html = this.buildTicketHtml(t);

    const w = window.open('', '_blank', 'width=420,height=650');
    if (!w) {
      this.toast.error(
        'El navegador bloqueó la ventana emergente. Dale permiso para imprimir',
      );
      return;
    }

    w.document.open();
    w.document.write(html);
    w.document.close();

    w.onload = () => {
      w.focus();
      w.print();
      // w.close();
    };
  }

  // Generamos HTML self-contained con CSS
  private buildTicketHtml(ticket: CreateSaleResponse['ticket']): string {
    const money = (n: number) =>
      new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(Number(n || 0));

    const dt = new Date(ticket.timestamp);
    const dateStr = dt.toLocaleString('es-MX');

    const rows = ticket.items
      .map(
        (i) => `
        <tr>
          <td class="name">${this.escapeHtml(i.name)}</td>
          <td class="qty">${i.qty}</td>
          <td class="price">${money(i.unitPrice)}</td>
          <td class="total">${money(i.lineTotal)}</td>
        </tr>
      `,
      )
      .join('');

    return `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ticket ${this.escapeHtml(ticket.saleId)}</title>

  <style>
    /* Tamaño típico para ticket térmico */
    @page { size: 80mm auto; margin: 6mm; }
    body {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      color: #111;
      margin: 0;
      padding: 0;
    }
    .wrap { width: 80mm; }
    .center { text-align: center; }
    .muted { color: #444; font-size: 12px; }
    h1 { font-size: 16px; margin: 0; }
    .hr { border-top: 1px dashed #999; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; font-weight: 700; padding: 4px 0; }
    td { vertical-align: top; padding: 4px 0; }
    .name { width: 46%; padding-right: 6px; }
    .qty { width: 10%; text-align: right; }
    .price { width: 22%; text-align: right; }
    .total { width: 22%; text-align: right; font-weight: 700; }
    .sumrow { display: flex; justify-content: space-between; font-size: 12px; margin-top: 6px; }
    .sumrow strong { font-size: 13px; }
    .bigtotal { font-size: 14px; font-weight: 800; }
    .footer { margin-top: 12px; font-size: 12px; }
  </style>
</head>

<body>
  <div class="wrap">
    <div class="center">
      <h1>${this.escapeHtml(ticket.storeName || 'Cafecito Feliz')}</h1>
      <div class="muted">Sistema ByTato</div>
      <div class="muted">${this.escapeHtml(dateStr)}</div>
      <div class="muted">Folio: <strong>${this.escapeHtml(ticket.saleId)}</strong></div>
    </div>

    <div class="hr"></div>

    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th style="text-align:right;">Cant</th>
          <th style="text-align:right;">P.U.</th>
          <th style="text-align:right;">Imp</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="hr"></div>

    <div class="sumrow">
      <span>Subtotal</span>
      <span>${money(ticket.subtotal)}</span>
    </div>
    <div class="sumrow">
      <span>Descuento</span>
      <span>${this.escapeHtml(ticket.discount || '')}</span>
    </div>
    <div class="sumrow bigtotal">
      <strong>Total</strong>
      <strong>${money(ticket.total)}</strong>
    </div>

    <div class="hr"></div>

    <div class="footer center">
      <div>Pago: <strong>${this.escapeHtml(ticket.paymentMethod || '')}</strong></div>
      <div class="muted" style="margin-top:8px;">Gracias por su compra ☕</div>
    </div>
  </div>
</body>
</html>
    `;
  }

  private escapeHtml(str: string): string {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
