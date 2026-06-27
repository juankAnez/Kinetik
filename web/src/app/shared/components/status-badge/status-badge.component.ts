import { Component, Input } from '@angular/core';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: '#F59E0B' },
  ACCEPTED: { label: 'Aceptado', color: '#3B82F6' },
  PREPARING: { label: 'Preparando', color: '#8B5CF6' },
  READY: { label: 'Listo', color: '#10B981' },
  ASSIGNED: { label: 'Asignado', color: '#06B6D4' },
  PICKED_UP: { label: 'Recogido', color: '#14B8A6' },
  DELIVERED: { label: 'Entregado', color: '#22C55E' },
  CANCELLED: { label: 'Cancelado', color: '#EF4444' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="badge" [style.background]="config.color + '18'" [style.color]="config.color">
      {{ config.label }}
    </span>
  `,
  styles: [`
    .badge { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
  `]
})
export class StatusBadgeComponent {
  @Input() status = 'PENDING';
  get config() { return STATUS_CONFIG[this.status] || { label: this.status, color: '#6B7280' }; }
}
