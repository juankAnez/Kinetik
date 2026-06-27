import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductCategory } from '../models/models';

const API = 'http://localhost:8080/api/v1';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  list(): Observable<{ results: Product[] }> {
    return this.http.get<{ results: Product[] }>(`${API}/products/`);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${API}/products/${id}/`);
  }

  create(payload: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${API}/products/`, payload);
  }

  update(id: number, payload: Partial<Product>): Observable<Product> {
    return this.http.patch<Product>(`${API}/products/${id}/`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/products/${id}/`);
  }

  toggleAvailability(id: number): Observable<{ is_available: boolean }> {
    return this.http.post<{ is_available: boolean }>(`${API}/products/${id}/toggle_availability/`, {});
  }

  listCategories(): Observable<ProductCategory[]> {
    return this.http.get<ProductCategory[]>(`${API}/products/categories/`);
  }

  createCategory(payload: { name: string; order?: number }): Observable<ProductCategory> {
    return this.http.post<ProductCategory>(`${API}/products/categories/`, payload);
  }
}
