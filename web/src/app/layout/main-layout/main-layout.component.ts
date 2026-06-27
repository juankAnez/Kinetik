import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, DatePipe, NotificationBellComponent],
  template: `
    <div class="layout">
      <app-sidebar />
      <main class="main">
        <header class="topbar">
          <div class="greeting">
            <h1>Bienvenido, {{ auth.user?.first_name || 'Comercio' }}</h1>
            <p>{{ today | date : 'EEEE, d MMMM yyyy' }}</p>
          </div>
          <div class="top-actions">
            <app-notification-bell />
            <div class="user-badge">
              <span class="avatar">{{ (auth.user?.first_name || 'C')[0] }}</span>
            </div>
          </div>
        </header>
        <div class="content">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; background: #F8FAFC; }
    .main { margin-left: 240px; flex: 1; display: flex; flex-direction: column; }
    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 32px 0; background: transparent;
    }
    .greeting h1 { font-size: 22px; font-weight: 800; color: #0F172A; margin: 0; }
    .greeting p { font-size: 13px; color: #64748B; margin: 2px 0 0; text-transform: capitalize; }
    .top-actions { display: flex; align-items: center; gap: 12px; }
    .user-badge .avatar {
      width: 40px; height: 40px; border-radius: 10px;
      background: #6C4CF1; color: white; display: flex;
      align-items: center; justify-content: center;
      font-weight: 700; font-size: 15px;
    }
    .content { flex: 1; padding: 20px 32px 32px; }
  `]
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  today = new Date();
}
