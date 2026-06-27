import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-icon">K</div>
        <span class="brand-name">Kinetik</span>
      </div>

      <nav class="nav">
        <a class="nav-item" routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Dashboard
        </a>
        <a class="nav-item" routerLink="/store" routerLinkActive="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Mi Tienda
        </a>
        <a class="nav-item" routerLink="/products" routerLinkActive="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          Productos
        </a>
        <a class="nav-item" routerLink="/orders" routerLinkActive="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Pedidos
        </a>
      </nav>

      <div class="footer">
        <button class="logout-btn" (click)="auth.logout()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 240px; height: 100vh;
      background: #0F172A;
      display: flex; flex-direction: column;
      padding: 20px 12px;
      position: fixed; left: 0; top: 0;
    }
    .brand { display: flex; align-items: center; gap: 10px; padding: 0 8px; margin-bottom: 32px; }
    .brand-icon { width: 36px; height: 36px; background: #6C4CF1; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 18px; }
    .brand-name { color: white; font-weight: 700; font-size: 18px; }
    .nav { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 10px;
      color: #94A3B8; text-decoration: none;
      font-size: 14px; font-weight: 500;
      transition: all 0.15s;
    }
    .nav-item:hover { background: rgba(255,255,255,0.06); color: #E2E8F0; }
    .nav-item.active { background: #6C4CF1; color: white; }
    .footer { padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
    .logout-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px; border-radius: 10px; width: 100%;
      color: #94A3B8; font-size: 13px; font-weight: 500;
      background: none; border: none; cursor: pointer;
      transition: all 0.15s;
    }
    .logout-btn:hover { background: rgba(239,68,68,0.1); color: #EF4444; }
  `]
})
export class SidebarComponent {
  auth = inject(AuthService);
}
