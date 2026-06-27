import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="stat-card" [style.--stat-color]="color">
      <div class="stat-icon">
        <span [innerHTML]="icon"></span>
      </div>
      <div class="stat-value">{{ value }}</div>
      <div class="stat-label">{{ label }}</div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .stat-icon {
      width: 40px; height: 40px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: color-mix(in srgb, var(--stat-color) 12%, transparent);
      margin-bottom: 12px;
      font-size: 18px;
    }
    .stat-value { font-size: 24px; font-weight: 800; color: #0F172A; margin-bottom: 4px; }
    .stat-label { font-size: 13px; color: #64748B; font-weight: 500; }
  `]
})
export class StatCardComponent {
  @Input() icon = '';
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() color = '#6C4CF1';
}
