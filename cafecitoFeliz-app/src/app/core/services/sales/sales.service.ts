import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

 // POST /api/sales -> crear una venta (cobrar)
 // GET  /api/sales -> listar ventas (historial)

export type CreateSaleRequest = {
  customerId: string | null;
  paymentMethod?: 'cash' | 'card' | 'transfer';
  items: Array<{
    productId: string;
    quantity: number;
  }>;
};


export type CreateSaleResponse = {
  saleId: string;
  customerId: string | null;
  paymentMethod: 'cash' | 'card' | 'transfer';
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  ticket: {
    saleId: string;
    timestamp: string;
    storeName: string;
    items: Array<{
      name: string;
      qty: number;
      unitPrice: number;
      lineTotal: number;
    }>;
    subtotal: number;
    discount: string;
    total: number;
    paymentMethod: string;
  };
  createdAt: string;
};


export interface SalesListItem {
  saleId: string;
  status: 'completed' | 'canceled';
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  createdAt: string;
  canceledAt?: string | null;
}


export interface SalesListResponse {
  data: SalesListItem[];
  total: number;
  page: number;
  limit: number;
}


@Injectable({ providedIn: 'root' })
export class SalesService {

  private readonly baseUrl = `${environment.apiUrl}/sales`;


  constructor(private http: HttpClient) {}


  createSale(payload: CreateSaleRequest): Observable<CreateSaleResponse> {
    return this.http.post<CreateSaleResponse>(this.baseUrl, payload).pipe(

      catchError((err) => throwError(() => err))
    );
  }


  getSales(
    page = 1,
    limit = 20,
    status: 'all' | 'completed' | 'canceled' = 'all',
    q?: string
  ): Observable<SalesListResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit))
      .set('status', status);

    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }

    return this.http.get<SalesListResponse>(this.baseUrl, { params }).pipe(
      catchError((err) => throwError(() => err))
    );
  }

  cancelSaleBySaleId(
    saleId: string,
    reason?: string
  ): Observable<{ ok: boolean; saleId: string; status: string; canceledAt: string; cancelReason?: string }> {
    const body = reason?.trim() ? { reason: reason.trim() } : {};
    return this.http
      .patch<{ ok: boolean; saleId: string; status: string; canceledAt: string; cancelReason?: string }>(
        `${this.baseUrl}/${encodeURIComponent(saleId)}/cancel`,
        body
      )
      .pipe(catchError((err) => throwError(() => err)));
  }
}