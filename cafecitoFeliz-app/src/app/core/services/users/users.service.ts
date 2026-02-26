import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';


export type UserRole = 'admin' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsersListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}


export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}


export interface SetUserActivePayload {
  active: boolean;
}


export interface ResetPasswordPayload {
  password: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {

  private readonly baseUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}


  getUsers(
    page = 1,
    limit = 20,
    q?: string,
    role: 'admin' | 'cashier' | 'all' = 'all',
    active: 'true' | 'false' | 'all' = 'all'
  ): Observable<UsersListResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit))
      .set('role', role)
      .set('active', active);

    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }

    return this.http.get<UsersListResponse>(this.baseUrl, { params }).pipe(
      catchError((err) => throwError(() => err))
    );
  }

  // POST /users
 
  createUser(payload: CreateUserPayload): Observable<User> {
    return this.http.post<User>(this.baseUrl, payload).pipe(
      catchError((err) => throwError(() => err))
    );
  }


   // PATCH /users/:id/active

  setUserActive(userId: string, payload: SetUserActivePayload): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${userId}/active`, payload).pipe(
      catchError((err) => throwError(() => err))
    );
  }

   // PATCH /users/:id/password

  resetPassword(userId: string, payload: ResetPasswordPayload): Observable<{ ok: boolean; message: string }> {
    return this.http.patch<{ ok: boolean; message: string }>(
      `${this.baseUrl}/${userId}/password`,
      payload
    ).pipe(
      catchError((err) => throwError(() => err))
    );
  }
}