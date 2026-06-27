import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { StoreService } from '../../core/services/store.service';
import { OrderService } from '../../core/services/order.service';
import { Store, Order, OrderStats } from '../../core/models/models';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink, StatCardComponent, StatusBadgeComponent],
  template: `
    @if (!store) {
      <div class="empty-store">
        <div class="empty-icon">🏪</div>
        <h2>Tienda no configurada</h2>
        <p>Crea tu tienda para empezar a recibir pedidos</p>
        <a routerLink="/store" class="btn-primary">Configurar Tienda</a>
      </div>
    } @else {
      <div class="store-hero">
        <div class="hero-info">
          <h1>{{ store.name }}</h1>
          @if (store.description) {
            <p class="hero-desc">{{ store.description }}</p>
          }
          <div class="hero-meta">
            @if (store.phone) {
              <span>📞 {{ store.phone }}</span>
            }
            @if (store.address) {
              <span>📍 {{ store.address }}</span>
            }
            <span class="status-badge" [class.open]="store.is_open">
              {{ store.is_open ? 'Abierto' : 'Cerrado' }}
            </span>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <span class="num">{{ store.total_orders || 0 }}</span>
            <span class="lbl">Pedidos totales</span>
          </div>
          <div class="hero-stat">
            <span class="num">{{ store.avg_rating || '—' }}</span>
            <span class="lbl">Calificación</span>
          </div>
          <div class="hero-stat">
            <span class="num">{{ store.delivery_radius_km }}km</span>
            <span class="lbl">Cobertura</span>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <app-stat-card icon="📦" label="Pedidos totales" [value]="stats?.total_orders || 0" color="#6C4CF1" />
        <app-stat-card icon="⏳" label="Pendientes" [value]="stats?.pending || 0" color="#F59E0B" />
        <app-stat-card icon="✅" label="Entregados hoy" [value]="stats?.today_orders || 0" color="#10B981" />
        <app-stat-card icon="💰" label="Ventas hoy" [value]="'$' + ((stats?.today_revenue || 0) | number:'1.0-0')" color="#3B82F6" />
      </div>

      <div class="section">
        <div class="section-header">
          <h2>Pedidos pendientes</h2>
          <a routerLink="/orders" class="link">Ver todos</a>
        </div>
        <div class="order-list">
          @for (o of orders; track o.id) {
            <div class="order-card" (click)="openOrder(o.id)">
              <div class="order-left">
                <span class="order-id">#{{ o.id }}</span>
                <span class="order-date">{{ o.created_at | date:'short' }}</span>
              </div>
              <div class="order-center">
                <app-status-badge [status]="o.status" />
              </div>
              <div class="order-right">
                <span class="order-total">{{ o.total | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              </div>
            </div>
          }
          @if (orders.length === 0) {
            <div class="empty-orders">
              <p>No hay pedidos pendientes</p>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .empty-store { text-align: center; padding: 80px 20px; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .empty-store h2 { font-size: 20px; font-weight: 700; color: #0F172A; margin: 0 0 8px; }
    .empty-store p { color: #64748B; margin: 0 0 24px; }
    .btn-primary {
      display: inline-block; padding: 12px 24px; background: #6C4CF1; color: white;
      border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;
    }
    .store-hero {
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      border-radius: 20px; padding: 28px 32px; margin-bottom: 24px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .hero-info h1 { font-size: 24px; font-weight: 800; color: white; margin: 0 0 6px; }
    .hero-desc { color: #94A3B8; font-size: 14px; margin: 0 0 12px; max-width: 500px; }
    .hero-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; color: #64748B; }
    .status-badge { padding: 2px 10px; border-radius: 20px; font-weight: 600; background: rgba(239,68,68,0.15); color: #EF4444; }
    .status-badge.open { background: rgba(34,197,94,0.15); color: #22C55E; }
    .hero-stats { display: flex; gap: 28px; }
    .hero-stat { text-align: center; }
    .hero-stat .num { display: block; font-size: 22px; font-weight: 800; color: white; }
    .hero-stat .lbl { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .section { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .section-header h2 { font-size: 16px; font-weight: 700; color: #0F172A; margin: 0; }
    .link { color: #6C4CF1; font-weight: 600; font-size: 13px; text-decoration: none; }
    .order-list { display: flex; flex-direction: column; gap: 8px; }
    .order-card {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-radius: 12px;
      cursor: pointer; transition: background 0.15s;
    }
    .order-card:hover { background: #F8FAFC; }
    .order-left { display: flex; flex-direction: column; gap: 2px; }
    .order-id { font-weight: 700; color: #0F172A; font-size: 14px; }
    .order-date { font-size: 12px; color: #94A3B8; }
    .order-total { font-weight: 700; color: #0F172A; font-size: 15px; }
    .empty-orders { text-align: center; padding: 40px; color: #94A3B8; }
  `]
})
export class DashboardComponent implements OnInit {
  private storeService = inject(StoreService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  store: Store | null = null;
  stats: OrderStats | null = null;
  orders: Order[] = [];

  async ngOnInit() {
    try { this.store = (await firstValueFrom(this.storeService.getMyStore())) as Store; } catch { this.store = null; }
    if (this.store) {
      this.stats = (await firstValueFrom(this.orderService.stats())) as OrderStats;
      const res = await firstValueFrom(this.orderService.list('PENDING'));
      this.orders = res?.results || [];
    }
  }

  openOrder(id: number) {
    this.router.navigate(['/orders', id]);
  }
}
