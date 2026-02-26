import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type DashboardSummaryResponse = {
  range: { from: string; to: string };
  sales: { completed: number; canceled: number; total: number };
  revenue: number;
  avgTicket: number;
  topProducts: Array<{ name: string; qty: number; amount: number }>;
};

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}


  summary(from?: string, to?: string): Observable<DashboardSummaryResponse> {
    let params = new HttpParams();

    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);

    return this.http
      .get<DashboardSummaryResponse>(`${this.baseUrl}/summary`, { params })
      .pipe(catchError((err) => throwError(() => err)));
  }
}