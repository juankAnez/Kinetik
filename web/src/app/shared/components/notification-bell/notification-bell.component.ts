import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NotificationService, WebNotification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="bell-wrapper" (click)="togglePanel()">
      <button class="bell-btn" (click)="$event.stopPropagation(); togglePanel()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        @if (unreadCount > 0) {
          <span class="badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
        }
      </button>

      @if (showPanel) {
        <div class="panel" (click)="$event.stopPropagation()">
          <div class="panel-header">
            <h3>Notificaciones</h3>
            @if (unreadCount > 0) {
              <button class="mark-read-btn" (click)="markAllRead()">Marcar leídas</button>
            }
          </div>
          <div class="panel-body">
            @if (notifications.length === 0) {
              <div class="empty">No hay notificaciones</div>
            }
            @for (n of notifications; track n.id) {
              <div class="notif-item" [class.unread]="!n.is_read">
                <div class="notif-icon">
                  @if (n.type === 'ORDER_UPDATE') { 📦 }
                  @else if (n.type === 'ASSIGNMENT') { 🏍️ }
                  @else { 🔔 }
                </div>
                <div class="notif-content">
                  <strong>{{ n.title }}</strong>
                  <p>{{ n.body }}</p>
                  <span class="notif-time">{{ n.created_at | date:'short' }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      @if (showPanel) {
        <div class="backdrop" (click)="showPanel = false"></div>
      }
    </div>
  `,
  styles: [`
    .bell-wrapper { position: relative; }
    .bell-btn {
      width: 40px; height: 40px; border-radius: 10px;
      background: #F1F5F9; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #475569; position: relative; transition: background 0.15s;
    }
    .bell-btn:hover { background: #E2E8F0; }
    .badge {
      position: absolute; top: -4px; right: -4px;
      min-width: 18px; height: 18px; border-radius: 9px;
      background: #EF4444; color: white;
      font-size: 10px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      padding: 0 4px;
    }
    .panel {
      position: absolute; top: calc(100% + 8px); right: 0;
      width: 360px; max-height: 480px;
      background: white; border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      overflow: hidden; z-index: 1000;
    }
    .panel-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px; border-bottom: 1px solid #F1F5F9;
    }
    .panel-header h3 { font-size: 15px; font-weight: 700; margin: 0; }
    .mark-read-btn { background: none; border: none; color: #6C4CF1; font-size: 12px; font-weight: 600; cursor: pointer; }
    .panel-body { overflow-y: auto; max-height: 400px; }
    .empty { padding: 40px 20px; text-align: center; color: #94A3B8; font-size: 14px; }
    .notif-item {
      display: flex; gap: 12px; padding: 14px 20px;
      border-bottom: 1px solid #F8FAFC; cursor: pointer;
      transition: background 0.1s;
    }
    .notif-item:hover { background: #F8FAFC; }
    .notif-item.unread { background: #F0F5FF; }
    .notif-icon { font-size: 20px; line-height: 1; }
    .notif-content { flex: 1; min-width: 0; }
    .notif-content strong { display: block; font-size: 13px; color: #0F172A; margin-bottom: 2px; }
    .notif-content p { font-size: 12px; color: #64748B; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .notif-time { font-size: 11px; color: #94A3B8; margin-top: 4px; display: block; }
    .backdrop { position: fixed; inset: 0; z-index: 999; }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);

  unreadCount = 0;
  notifications: WebNotification[] = [];
  showPanel = false;

  ngOnInit() {
    this.notificationService.startPolling();
    this.notificationService.unreadCount$.subscribe(c => this.unreadCount = c);
    this.loadNotifications();
  }

  ngOnDestroy() {
    this.notificationService.stopPolling();
  }

  loadNotifications() {
    this.notificationService.list().subscribe(res => this.notifications = res.results || []);
  }

  togglePanel() {
    this.showPanel = !this.showPanel;
    if (this.showPanel) {
      this.loadNotifications();
    }
  }

  async markAllRead() {
    await this.notificationService.markRead();
    this.notifications = this.notifications.map(n => ({ ...n, is_read: true }));
  }
}
