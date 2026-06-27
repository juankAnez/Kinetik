import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, StatusBadgeComponent],
  template: `
    <div class="header">
      <h2>Pedidos</h2>
      <div class="filters">
        @for (f of filters; track f.value) {
          <button class="filter-btn" [class.active]="activeFilter === f.value" (click)="setFilter(f.value)">{{ f.label }}</button>
        }
      </div>
    </div>

    <div class="table-card">
      @if (orders.length > 0) {
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Items</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (o of orders; track o.id) {
              <tr (click)="openOrder(o.id)" class="clickable">
                <td class="id">#{{ o.id }}</td>
                <td>{{ o.items.length }} items</td>
                <td class="price">{{ o.total | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
                <td><app-status-badge [status]="o.status" /></td>
                <td class="date">{{ o.created_at | date:'dd/MM HH:mm' }}</td>
                <td><span class="chevron">→</span></td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <div class="empty">
          <p>{{ activeFilter ? 'No hay pedidos con ese estado' : 'No hay pedidos aún' }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .header h2 { font-size: 20px; font-weight: 800; color: #0F172A; margin: 0; }
    .filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .filter-btn { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; background: white; border: 1.5px solid #E2E8F0; color: #64748B; cursor: pointer; transition: all 0.15s; }
    .filter-btn.active { background: #6C4CF1; color: white; border-color: #6C4CF1; }
    .table-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 14px 16px; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #F1F5F9; }
    td { padding: 14px 16px; font-size: 14px; color: #0F172A; border-bottom: 1px solid #F1F5F9; }
    .clickable { cursor: pointer; transition: background 0.1s; }
    .clickable:hover { background: #F8FAFC; }
    .id { font-weight: 700; }
    .price { font-weight: 700; }
    .date { font-size: 12px; color: #94A3B8; }
    .chevron { color: #CBD5E1; font-size: 18px; }
    .empty { text-align: center; padding: 60px 20px; color: #94A3B8; }
  `]
})
export class OrderListComponent implements OnInit {
  private orderService = inject(OrderService);
  private router = inject(Router);

  filters = [
    { label: 'Todos', value: '' },
    { label: 'Pendientes', value: 'PENDING' },
    { label: 'Aceptados', value: 'ACCEPTED' },
    { label: 'Preparando', value: 'PREPARING' },
    { label: 'Listos', value: 'READY' },
    { label: 'Entregados', value: 'DELIVERED' },
    { label: 'Cancelados', value: 'CANCELLED' },
  ];

  activeFilter = '';
  orders: Order[] = [];

  async ngOnInit() { await this.load(); }

  async setFilter(value: string) {
    this.activeFilter = value;
    await this.load();
  }

  async load() {
    const res = await firstValueFrom(this.orderService.list(this.activeFilter || undefined));
    this.orders = res?.results || [];
  }

  openOrder(id: number) { this.router.navigate(['/orders', id]); }
}
