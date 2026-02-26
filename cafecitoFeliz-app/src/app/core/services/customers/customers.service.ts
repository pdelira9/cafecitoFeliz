import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';


export interface Customer {
  id: string;
  name: string;
  phoneOrEmail: string;
  purchasesCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}


export interface CustomersListResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
}


export type CreateCustomerPayload = {
  name: string;
  phoneOrEmail: string;
};

export type UpdateCustomerPayload = {
  name?: string;
  phoneOrEmail?: string;
};

@Injectable({ providedIn: 'root' })
export class CustomersService {

  private readonly baseUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}


  listCustomers(
    page = 1,
    limit = 20,
    q?: string,
    active: 'true' | 'false' | 'all' = 'true'
  ): Observable<CustomersListResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit))
      .set('active', active);

    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }

    return this.http.get<CustomersListResponse>(this.baseUrl, { params }).pipe(
      catchError((err) => throwError(() => err))
    );
  }


  createCustomer(payload: CreateCustomerPayload): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, payload).pipe(
      catchError((err) => throwError(() => err))
    );
  }


  updateCustomer(id: string, payload: UpdateCustomerPayload): Observable<Customer> {
    return this.http.patch<Customer>(`${this.baseUrl}/${id}`, payload).pipe(
      catchError((err) => throwError(() => err))
    );
  }


  setCustomerActive(id: string, active: boolean): Observable<Customer> {
    return this.http.patch<Customer>(`${this.baseUrl}/${id}/active`, { active }).pipe(
      catchError((err) => throwError(() => err))
    );
  }
}