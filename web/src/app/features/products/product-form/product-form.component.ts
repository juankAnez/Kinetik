import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { ProductCategory } from '../../../core/models/models';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="card">
      <h2>{{ editMode ? 'Editar Producto' : 'Nuevo Producto' }}</h2>

      <form (ngSubmit)="save()" class="form">
        <div class="field">
          <label>Nombre del producto</label>
          <input type="text" [(ngModel)]="form.name" name="name" placeholder="Ej: Hamburguesa Clásica" required />
        </div>

        <div class="field">
          <label>Descripción</label>
          <textarea [(ngModel)]="form.description" name="description" rows="2" placeholder="Descripción del producto"></textarea>
        </div>

        <div class="row">
          <div class="field">
            <label>Precio (COP)</label>
            <input type="number" [(ngModel)]="form.price" name="price" placeholder="15000" required />
          </div>
          <div class="field">
            <label>Categoría</label>
            <select [(ngModel)]="form.category" name="category">
              <option [ngValue]="null">Sin categoría</option>
              @for (c of categories; track c.id) {
                <option [ngValue]="c.id">{{ c.name }}</option>
              }
            </select>
          </div>
        </div>

        <div class="field">
          <label>URL de imagen (opcional)</label>
          <input type="url" [(ngModel)]="form.image" name="image" placeholder="https://..." />
        </div>

        <div class="field">
          <label>¿Está disponible?</label>
          <div class="toggle-row">
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="form.is_available" name="is_available" />
              <span class="slider"></span>
            </label>
            <span>{{ form.is_available ? 'Disponible' : 'Agotado' }}</span>
          </div>
        </div>

        @if (error) {
          <div class="error">{{ error }}</div>
        }

        <div class="actions">
          <button type="button" class="btn-secondary" (click)="cancel()">Cancelar</button>
          <button type="submit" class="btn-primary" [disabled]="saving">
            {{ saving ? 'Guardando...' : (editMode ? 'Actualizar' : 'Crear Producto') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .card { background: white; border-radius: 16px; padding: 28px; max-width: 560px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .card h2 { font-size: 18px; font-weight: 700; color: #0F172A; margin: 0 0 24px; }
    .form { display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
    input, textarea, select {
      padding: 10px 14px; border: 1.5px solid #E2E8F0; border-radius: 10px;
      font-size: 14px; color: #0F172A; outline: none; transition: border-color 0.2s; font-family: inherit;
    }
    input:focus, textarea:focus, select:focus { border-color: #6C4CF1; box-shadow: 0 0 0 3px rgba(108,76,241,0.1); }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .toggle-row { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #64748B; }
    .toggle { position: relative; display: inline-block; width: 44px; height: 24px; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
      background: #CBD5E1; border-radius: 24px; transition: 0.3s;
    }
    .slider:before {
      content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px;
      background: white; border-radius: 50%; transition: 0.3s;
    }
    .toggle input:checked + .slider { background: #10B981; }
    .toggle input:checked + .slider:before { transform: translateX(20px); }
    .error { color: #EF4444; font-size: 13px; font-weight: 500; text-align: center; }
    .actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
    .btn-primary { padding: 12px 24px; background: #6C4CF1; color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { padding: 12px 24px; background: #F1F5F9; color: #64748B; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-secondary:hover { background: #E2E8F0; }
  `]
})
export class ProductFormComponent implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  editMode = false;
  productId: number | null = null;
  categories: ProductCategory[] = [];
  form: any = { name: '', description: '', price: 0, category: null, image: '', is_available: true };
  error = '';
  saving = false;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editMode = true;
      this.productId = Number(id);
      const p = await firstValueFrom(this.productService.getById(this.productId));
      if (p) {
        this.form = { name: p.name, description: p.description, price: p.price, category: p.category, image: p.image || '', is_available: p.is_available };
      }
    }
    const catRes = await firstValueFrom(this.productService.listCategories());
    this.categories = catRes || [];
  }

  async save() {
    this.saving = true;
    this.error = '';
    try {
      const payload = { ...this.form };
      if (!payload.category) payload.category = null;
      if (this.editMode && this.productId) {
        await firstValueFrom(this.productService.update(this.productId, payload));
      } else {
        await firstValueFrom(this.productService.create(payload));
      }
      this.router.navigate(['/products']);
    } catch (e: any) {
      this.error = e?.error?.detail || e?.error?.name?.[0] || 'Error al guardar el producto';
    } finally {
      this.saving = false;
    }
  }

  cancel() { this.router.navigate(['/products']); }
}
