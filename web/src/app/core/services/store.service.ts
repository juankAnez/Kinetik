import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Store, Schedule } from '../models/models';

const API = 'http://localhost:8080/api/v1';

export interface StoreCategory {
  id: number;
  name: string;
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private http = inject(HttpClient);

  getMyStore(): Observable<Store> {
    return this.http.get<Store>(`${API}/stores/my_store/`);
  }

  updateMyStore(payload: Partial<Store>): Observable<Store> {
    return this.http.patch<Store>(`${API}/stores/my_store/`, payload);
  }

  create(payload: Partial<Store>): Observable<Store> {
    return this.http.post<Store>(`${API}/stores/`, payload);
  }

  getCategories(): Observable<StoreCategory[]> {
    return this.http.get<StoreCategory[]>(`${API}/stores/categories/`);
  }

  getSchedules(storeId: number): Observable<Schedule[]> {
    return this.http.get<Schedule[]>(`${API}/stores/${storeId}/schedules/`);
  }

  updateSchedules(storeId: number, schedules: Omit<Schedule, 'id'>[]): Observable<Schedule[]> {
    return this.http.put<Schedule[]>(`${API}/stores/${storeId}/schedules/`, { schedules });
  }
}
