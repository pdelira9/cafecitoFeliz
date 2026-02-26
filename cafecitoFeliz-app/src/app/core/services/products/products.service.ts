import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';


export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  message?: string;
}


export interface CreateProductRequest {
  name: string;
  price: number;
  stock: number;
}


export interface UpdateProductRequest {
  price?: number;
  stock?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly baseUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}


  getProducts(
    page: number = 1,
    limit: number = 20,
    q?: string,
    active: 'true' | 'false' | 'all' = 'true'
  ): Observable<ProductsListResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit))
      .set('active', active);

    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }

    return this.http.get<ProductsListResponse>(this.baseUrl, { params }).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  //POST /products
   
  createProduct(payload: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, payload).pipe(
      catchError((error) => throwError(() => error))
    );
  }


   // PATCH /products/:id
  
  updateProduct(id: string, payload: UpdateProductRequest): Observable<Product> {
    return this.http.patch<Product>(`${this.baseUrl}/${id}`, payload).pipe(
      catchError((error) => throwError(() => error))
    );
  }

   // PATCH /products/:id/deactivate
  
  deactivateProduct(id: string): Observable<Product> {
    return this.http.patch<Product>(`${this.baseUrl}/${id}/deactivate`, {}).pipe(
      catchError((error) => throwError(() => error))
    );
  }

   // PATCH /products/:id/activate
  
  activateProduct(id: string): Observable<Product> {
    return this.http.patch<Product>(`${this.baseUrl}/${id}/activate`, {}).pipe(
      catchError((error) => throwError(() => error))
    );
  }
}
