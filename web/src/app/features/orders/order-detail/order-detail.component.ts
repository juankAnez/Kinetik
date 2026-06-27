import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, StatusBadgeComponent],
  template: `
    <div class="top-bar">
      <a routerLink="/orders" class="back">← Volver a pedidos</a>
    </div>

    @if (order) {
      <div class="detail">
        <div class="header-card">
          <div class="order-meta">
            <h1>Pedido #{{ order.id }}</h1>
            <app-status-badge [status]="order.status" />
          </div>
          <div class="order-date">{{ order.created_at | date:'fullDate' }} - {{ order.created_at | date:'shortTime' }}</div>
        </div>

        <div class="grid">
          <div class="card">
            <h3>Información del Pedido</h3>
            <div class="info-row"><span>Dirección</span><strong>{{ order.delivery_address || '—' }}</strong></div>
            <div class="info-row"><span>Método de pago</span><strong>{{ order.payment_method || '—' }}</strong></div>
            <div class="info-row"><span>Notas</span><strong>{{ order.delivery_notes || '—' }}</strong></div>
            @if (order.cancel_reason) {
              <div class="info-row"><span>Motivo de cancelación</span><strong>{{ order.cancel_reason }}</strong></div>
            }
          </div>

          <div class="card">
            <h3>Acciones</h3>
            <div class="actions">
              @if (order.status === 'PENDING') {
                <button class="action-btn accept" (click)="update('ACCEPTED')">✅ Aceptar Pedido</button>
                <button class="action-btn reject" (click)="cancel()">❌ Rechazar</button>
              }
              @if (order.status === 'ACCEPTED') {
                <button class="action-btn prepare" (click)="update('PREPARING')">👨‍🍳 Iniciar Preparación</button>
              }
              @if (order.status === 'PREPARING') {
                <button class="action-btn ready" (click)="update('READY')">✅ Marcar como Listo</button>
              }
              @if (['PENDING','ACCEPTED','PREPARING'].includes(order.status)) {
                <button class="action-btn cancel-action" (click)="cancel()">❌ Cancelar Pedido</button>
              }
            </div>
          </div>
        </div>

        <div class="card">
          <h3>Productos</h3>
          <table>
            <thead>
              <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
              @for (item of order.items; track $index) {
                <tr>
                  <td>{{ item.product_name }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.product_price | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
                  <td class="price">{{ item.subtotal | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr><td colspan="3" class="total-label">Total</td><td class="price total">{{ order.total | currency:'COP':'symbol-narrow':'1.0-0' }}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>
    } @else {
      <div class="error-state">Pedido no encontrado</div>
    }
  `,
  styles: [`
    .top-bar { margin-bottom: 16px; }
    .back { color: #6C4CF1; font-weight: 600; font-size: 14px; text-decoration: none; }
    .header-card { background: white; border-radius: 16px; padding: 20px 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .order-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
    .order-meta h1 { font-size: 22px; font-weight: 800; color: #0F172A; margin: 0; }
    .order-date { font-size: 13px; color: #64748B; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .card { background: white; border-radius: 16px; padding: 20px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .card h3 { font-size: 14px; font-weight: 700; color: #0F172A; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.3px; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .info-row span { color: #64748B; }
    .actions { display: flex; flex-direction: column; gap: 8px; }
    .action-btn { padding: 12px; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; text-align: center; transition: opacity 0.15s; }
    .action-btn:hover { opacity: 0.85; }
    .accept { background: #F0FDF4; color: #22C55E; }
    .prepare { background: #F3E8FF; color: #8B5CF6; }
    .ready { background: #E0F2FE; color: #3B82F6; }
    .reject { background: #FEF2F2; color: #EF4444; }
    .cancel-action { background: #FEF2F2; color: #EF4444; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px 0; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; border-bottom: 1px solid #F1F5F9; }
    td { padding: 10px 0; font-size: 14px; color: #0F172A; border-bottom: 1px solid #F1F5F9; }
    .price { font-weight: 700; }
    .total-label { text-align: right; font-weight: 700; color: #0F172A; }
    .total { font-size: 16px; }
    .error-state { text-align: center; padding: 60px 20px; color: #EF4444; }
  `]
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);

  order: Order | null = null;

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    try {
      this.order = (await firstValueFrom(this.orderService.getById(id))) as Order;
    } catch {
      this.order = null;
    }
  }

  async update(status: string) {
    if (!this.order) return;
    try {
      this.order = (await firstValueFrom(this.orderService.updateStatus(this.order.id, status))) as Order;
    } catch {
      alert('Error al actualizar el estado');
    }
  }

  async cancel() {
    if (!this.order) return;
    const reason = prompt('Motivo de cancelación:');
    if (reason !== null) {
      try {
        this.order = (await firstValueFrom(this.orderService.updateStatus(this.order.id, 'CANCELLED', reason))) as Order;
      } catch {
        alert('Error al cancelar el pedido');
      }
    }
  }
}
