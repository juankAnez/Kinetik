import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BehaviorSubject, Observable } from 'rxjs';

export interface WebNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

const API = 'http://localhost:8080/api/v1';
const POLL_INTERVAL = 8000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private zone = inject(NgZone);

  private unreadCount = new BehaviorSubject<number>(0);
  private newNotification = new BehaviorSubject<WebNotification | null>(null);
  private pollTimer: any = null;
  private lastKnownCount = 0;
  private notificationCache: WebNotification[] = [];

  unreadCount$: Observable<number> = this.unreadCount.asObservable();
  newNotification$: Observable<WebNotification | null> = this.newNotification.asObservable();

  startPolling() {
    this.stopPolling();
    this.loadUnreadCount();
    this.zone.runOutsideAngular(() => {
      this.pollTimer = setInterval(() => this.loadUnreadCount(), POLL_INTERVAL);
    });
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async loadUnreadCount() {
    try {
      const res = await firstValueFrom(this.http.get<{ unread_count: number }>(`${API}/notifications/unread_count/`));
      const count = res.unread_count;
      this.zone.run(() => {
        if (count > this.lastKnownCount) {
          this.fetchNewNotifications(count - this.lastKnownCount);
        }
        this.lastKnownCount = count;
        this.unreadCount.next(count);
      });
    } catch {}
  }

  private async fetchNewNotifications(count: number) {
    try {
      const res = await firstValueFrom(this.http.get<{ results: WebNotification[] }>(`${API}/notifications/`));
      const notifications = res.results || [];
      const newOnes = notifications.filter(n => !this.notificationCache.some(c => c.id === n.id));
      this.notificationCache = notifications;
      for (const n of newOnes.slice(0, count)) {
        this.newNotification.next(n);
      }
    } catch {}
  }

  list(): Observable<{ results: WebNotification[] }> {
    return this.http.get<{ results: WebNotification[] }>(`${API}/notifications/`);
  }

  async markRead() {
    await firstValueFrom(this.http.post<{ status: string }>(`${API}/notifications/mark_read/`, {}));
    this.lastKnownCount = 0;
    this.unreadCount.next(0);
  }

  clearNewNotification() {
    this.newNotification.next(null);
  }
}
