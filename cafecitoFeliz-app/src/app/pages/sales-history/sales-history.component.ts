import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesService, SalesListItem } from '../../core/services/sales/sales.service';
import { ToastService } from '../../core/ui/toast.service';


@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-history.component.html',
})
export class SalesHistoryComponent implements OnInit {

  loading = true;
  errorMsg = '';


  sales: SalesListItem[] = [];

  
  q = ''; 
  status: 'all' | 'completed' | 'canceled' = 'all';


  page = 1;
  limit = 10;
  total = 0;

  hasLoadedOnce = false;

  cancelingSaleId: string | null = null;

  readonly currentYear = new Date().getFullYear();

  constructor(private salesApi: SalesService, private toast: ToastService) {}

  ngOnInit(): void {
    this.fetchSales();
  }


  fetchSales() {
    this.loading = true;
    this.errorMsg = '';

    this.salesApi.getSales(this.page, this.limit, this.status, this.q).subscribe({
      next: (res) => {
        this.sales = res.data;
        this.total = res.total;
        this.loading = false;
        this.hasLoadedOnce = true;
      },
      error: (err) => {
        console.error('GET /sales failed', err);
        this.errorMsg = 'No se pudo cargar el historial de ventas.';
        this.loading = false;
        this.hasLoadedOnce = true;
      },
    });
  }


  onSearch() {
    this.page = 1;
    this.fetchSales();
  }


  clearSearch() {
    this.q = '';
    this.page = 1;
    this.fetchSales();
  }


  setStatus(next: 'all' | 'completed' | 'canceled') {
    this.status = next;
    this.page = 1;
    this.fetchSales();
  }


  nextPage() {
    if (this.page * this.limit >= this.total) return;
    this.page++;
    this.fetchSales();
  }

  prevPage() {
    if (this.page <= 1) return;
    this.page--;
    this.fetchSales();
  }


  cancelSale(saleId: string) {
    const ok = confirm(`¿Cancelar la venta ${saleId}? Esto devolverá stock.`);
    if (!ok) return;

    this.cancelingSaleId = saleId;

    // PATCH /sales/:saleId/cancel
    this.salesApi
      .cancelSaleBySaleId(saleId)
      .subscribe({
        next: () => {
          this.toast.success('Venta cancelada. Stock restaurado.');
          this.cancelingSaleId = null;
          this.fetchSales();
        },
        error: (err) => {
          console.error('PATCH /sales/:saleId/cancel failed', err);
          this.toast.error('No se pudo cancelar la venta.');
          this.cancelingSaleId = null;
        },
      });
  }


  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  formatMoney(n: number): string {
    return `$${Number(n).toFixed(2)}`;
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString();
  }
}
