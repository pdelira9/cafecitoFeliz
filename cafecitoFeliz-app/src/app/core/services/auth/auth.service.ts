import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable, tap } from 'rxjs';


export type LoginRequest = { email: string; password: string };

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cashier';
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

/**
 *  login pide token y lo guarda
 *  logout limpia storage
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly TOKEN_KEY = 'cf_token';
  private readonly USER_KEY = 'cf_user';

  constructor(private http: HttpClient) {}

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, payload).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(role: 'admin' | 'cashier'): boolean {
    const u = this.getUser();
    return !!u && u.role === role;
  }
}