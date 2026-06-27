import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderStats } from '../models/models';

const API = 'http://localhost:8080/api/v1';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);

  list(status?: string): Observable<{ results: Order[] }> {
    const params: any = {};
    if (status) params.status = status;
    return this.http.get<{ results: Order[] }>(`${API}/orders/`, { params });
  }

  getById(id: number): Observable<Order> {
    return this.http.get<Order>(`${API}/orders/${id}/`);
  }

  updateStatus(id: number, status: string, cancelReason?: string): Observable<Order> {
    const body: any = { status };
    if (cancelReason) body.cancel_reason = cancelReason;
    return this.http.post<Order>(`${API}/orders/${id}/status/`, body);
  }

  stats(): Observable<OrderStats> {
    return this.http.get<OrderStats>(`${API}/orders/stats/`);
  }
}
