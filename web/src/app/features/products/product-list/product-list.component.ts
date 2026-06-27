import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, SlicePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CurrencyPipe, SlicePipe, RouterLink],
  template: `
    <div class="header">
      <h2>Productos</h2>
      <a routerLink="/products/new" class="btn-primary">+ Nuevo Producto</a>
    </div>

    <div class="table-card">
      @if (products.length > 0) {
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Categoría</th>
              <th>Disponible</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (p of products; track p.id) {
              <tr>
                <td class="product-cell">
                  <div class="product-info">
                    <span class="name">{{ p.name }}</span>
                    <span class="desc">{{ (p.description || '') | slice:0:60 }}</span>
                  </div>
                </td>
                <td class="price">{{ p.price | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
                <td>{{ p.category_name || '-' }}</td>
                <td>
                  <span class="toggle-badge" [class.active]="p.is_available" (click)="toggleAvailability(p)">
                    {{ p.is_available ? 'Disponible' : 'Agotado' }}
                  </span>
                </td>
                <td>
                  <button class="btn-icon" (click)="editProduct(p.id)">✏️</button>
                  <button class="btn-icon" (click)="deleteProduct(p)">🗑️</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <div class="empty">
          <p>No tienes productos aún</p>
          <a routerLink="/products/new" class="link">Crear primer producto</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .header h2 { font-size: 20px; font-weight: 800; color: #0F172A; margin: 0; }
    .btn-primary { padding: 10px 20px; background: #6C4CF1; color: white; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 13px; }
    .table-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 14px 16px; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #F1F5F9; }
    td { padding: 14px 16px; font-size: 14px; color: #0F172A; border-bottom: 1px solid #F1F5F9; }
    .product-cell { display: flex; align-items: center; gap: 10px; }
    .product-info { display: flex; flex-direction: column; }
    .name { font-weight: 600; }
    .desc { font-size: 12px; color: #94A3B8; }
    .price { font-weight: 700; }
    .toggle-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; background: #FEF2F2; color: #EF4444; }
    .toggle-badge.active { background: #F0FDF4; color: #22C55E; }
    .btn-icon { background: none; border: none; cursor: pointer; padding: 4px 6px; font-size: 16px; }
    .empty { text-align: center; padding: 60px 20px; color: #94A3B8; }
    .link { color: #6C4CF1; font-weight: 600; text-decoration: none; }
  `]
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);

  products: Product[] = [];

  async ngOnInit() {
    const res = await firstValueFrom(this.productService.list());
    this.products = res?.results || [];
  }

  editProduct(id: number) { this.router.navigate(['/products', id]); }

  async toggleAvailability(p: Product) {
    await firstValueFrom(this.productService.toggleAvailability(p.id));
    p.is_available = !p.is_available;
  }

  async deleteProduct(p: Product) {
    if (confirm(`¿Eliminar "${p.name}"?`)) {
      await firstValueFrom(this.productService.delete(p.id));
      this.products = this.products.filter(x => x.id !== p.id);
    }
  }
}
