import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { StoreService, StoreCategory } from '../../../core/services/store.service';
import { Store } from '../../../core/models/models';

const STORE_EDITABLE_FIELDS = ['name', 'description', 'phone', 'address', 'delivery_radius_km', 'is_open', 'category'];

@Component({
  selector: 'app-store-settings',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ store ? 'Configuración de la Tienda' : 'Crear Tienda' }}</h1>
        <p class="subtitle">{{ store ? 'Actualiza la información de tu negocio' : 'Completa los datos para empezar a recibir pedidos' }}</p>
      </div>
    </div>

    <div class="layout">
      <!-- Form Card -->
      <div class="card form-card">
        @if (!store) {
          <div class="info-banner">
            <span class="info-icon">💡</span>
            <span>Podrás actualizar todos estos datos en cualquier momento desde esta sección.</span>
          </div>
        }

        <form (ngSubmit)="save()" class="form">
          <!-- Nombre -->
          <div class="field">
            <label>Nombre de la tienda <span class="required">*</span></label>
            <input
              type="text"
              [(ngModel)]="form.name"
              name="name"
              placeholder="Ej: Restaurante La Plaza"
              required
            />
          </div>

          <!-- Descripción -->
          <div class="field">
            <label>Descripción</label>
            <textarea
              [(ngModel)]="form.description"
              name="description"
              placeholder="Describe tu negocio, especialidad o productos principales..."
              rows="3"
            ></textarea>
          </div>

          <!-- Categoría -->
          <div class="field">
            <label>Categoría <span class="required">*</span></label>
            <select [(ngModel)]="form.category" name="category" required>
              <option [ngValue]="null">— Selecciona una categoría —</option>
              @for (cat of categories; track cat.id) {
                <option [ngValue]="cat.id">{{ cat.icon }} {{ cat.name }}</option>
              }
            </select>
            @if (categories.length === 0 && !loadingCategories) {
              <span class="field-hint warn">No se pudieron cargar las categorías. Puedes continuar sin seleccionar una.</span>
            }
          </div>

          <!-- Teléfono y Dirección -->
          <div class="row">
            <div class="field">
              <label>Teléfono</label>
              <input
                type="tel"
                [(ngModel)]="form.phone"
                name="phone"
                placeholder="+57 300 000 0000"
              />
            </div>
            <div class="field">
              <label>Dirección</label>
              <input
                type="text"
                [(ngModel)]="form.address"
                name="address"
                placeholder="Cra 1 # 2-3, Barrio Centro"
              />
            </div>
          </div>

          <!-- Radio de entrega -->
          <div class="field">
            <label>Radio de entrega (km)</label>
            <div class="input-with-unit">
              <input
                type="number"
                [(ngModel)]="form.delivery_radius_km"
                name="delivery_radius_km"
                min="1"
                max="50"
                step="0.5"
                placeholder="5"
              />
              <span class="unit">km</span>
            </div>
            <span class="field-hint">Los clientes dentro de este radio podrán ver tu tienda.</span>
          </div>

          <!-- Estado (abierto/cerrado) -->
          <div class="field">
            <label>Estado de la tienda</label>
            <div class="toggle-row">
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="form.is_open" name="is_open" />
                <span class="slider"></span>
              </label>
              <span [class.open-label]="form.is_open">{{ form.is_open ? '✅ Abierta — recibiendo pedidos' : '🔴 Cerrada — no recibe pedidos' }}</span>
            </div>
          </div>

          <!-- Error / Success -->
          @if (error) {
            <div class="alert error">
              <span>⚠️</span>
              <span>{{ error }}</span>
            </div>
          }
          @if (success) {
            <div class="alert success">
              <span>✅</span>
              <span>{{ success }}</span>
            </div>
          }

          <!-- Actions -->
          <div class="actions">
            <button type="submit" class="btn-primary" [disabled]="saving || !form.name">
              @if (saving) {
                <span class="spinner"></span>
                Guardando...
              } @else {
                {{ store ? 'Guardar Cambios' : 'Crear Tienda' }}
              }
            </button>
          </div>
        </form>
      </div>

      <!-- Info side panel (only shown when store exists) -->
      @if (store) {
        <div class="side-panel">
          <div class="card info-card">
            <h3>Detalles</h3>
            <div class="info-row">
              <span class="info-label">Estado</span>
              <span class="badge" [class.open]="store.is_open">{{ store.is_open ? 'Abierta' : 'Cerrada' }}</span>
            </div>
            @if (store.avg_rating) {
              <div class="info-row">
                <span class="info-label">Calificación</span>
                <span class="info-value">⭐ {{ store.avg_rating | number:'1.1-1' }}</span>
              </div>
            }
            @if (store.total_orders) {
              <div class="info-row">
                <span class="info-label">Pedidos totales</span>
                <span class="info-value">{{ store.total_orders }}</span>
              </div>
            }
            <div class="info-row">
              <span class="info-label">Cobertura</span>
              <span class="info-value">{{ store.delivery_radius_km }} km</span>
            </div>
            @if (store.created_at) {
              <div class="info-row">
                <span class="info-label">Creada</span>
                <span class="info-value">{{ store.created_at | date:'mediumDate' }}</span>
              </div>
            }
          </div>

          <div class="card info-card">
            <h3>Acciones rápidas</h3>
            <a routerLink="/products/new" class="quick-action">
              <span>➕</span> Añadir producto
            </a>
            <a routerLink="/orders" class="quick-action">
              <span>📦</span> Ver pedidos
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 4px; }
    .subtitle { font-size: 14px; color: #64748B; margin: 0; }

    .layout { display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 900px) {
      .layout { grid-template-columns: 1fr 280px; }
    }

    .card { background: white; border-radius: 16px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }

    .info-banner {
      display: flex; gap: 10px; align-items: flex-start;
      background: #F0F5FF; border: 1px solid #C7D7FD; border-radius: 10px;
      padding: 12px 16px; font-size: 13px; color: #3730A3; margin-bottom: 24px;
    }
    .info-icon { font-size: 16px; flex-shrink: 0; }

    .form { display: flex; flex-direction: column; gap: 20px; }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label {
      font-size: 12px; font-weight: 700; color: #475569;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .required { color: #EF4444; }
    .field-hint { font-size: 11px; color: #94A3B8; margin-top: 3px; }
    .field-hint.warn { color: #F59E0B; }

    input, textarea, select {
      padding: 10px 14px; border: 1.5px solid #E2E8F0; border-radius: 10px;
      font-size: 14px; color: #0F172A; outline: none;
      transition: border-color 0.2s, box-shadow 0.2s; font-family: inherit;
      background: white;
    }
    input:focus, textarea:focus, select:focus {
      border-color: #6C4CF1;
      box-shadow: 0 0 0 3px rgba(108,76,241,0.1);
    }

    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .input-with-unit { position: relative; display: flex; align-items: center; }
    .input-with-unit input { flex: 1; padding-right: 40px; }
    .unit {
      position: absolute; right: 12px;
      font-size: 12px; font-weight: 700; color: #94A3B8;
    }

    .toggle-row { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #64748B; }
    .open-label { color: #10B981; font-weight: 600; }
    .toggle { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
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

    .alert {
      display: flex; gap: 10px; align-items: flex-start;
      padding: 12px 16px; border-radius: 10px; font-size: 13px; font-weight: 500;
    }
    .alert.error { background: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; }
    .alert.success { background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }

    .actions { display: flex; justify-content: flex-end; }
    .btn-primary {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 28px; background: #6C4CF1; color: white; border: none;
      border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer;
      transition: opacity 0.15s, transform 0.1s;
    }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Side Panel */
    .side-panel { display: flex; flex-direction: column; gap: 16px; }
    .info-card h3 { font-size: 14px; font-weight: 700; color: #0F172A; margin: 0 0 16px; }
    .info-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0; border-bottom: 1px solid #F1F5F9;
      font-size: 13px;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748B; }
    .info-value { font-weight: 600; color: #0F172A; }
    .badge {
      padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
      background: rgba(239,68,68,0.1); color: #EF4444;
    }
    .badge.open { background: rgba(16,185,129,0.1); color: #10B981; }
    .quick-action {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 10px;
      text-decoration: none; font-size: 13px; font-weight: 600; color: #334155;
      transition: background 0.15s; margin-bottom: 6px;
    }
    .quick-action:hover { background: #F8FAFC; }
  `]
})
export class StoreSettingsComponent implements OnInit {
  private storeService = inject(StoreService);
  private router = inject(Router);

  store: Store | null = null;
  categories: StoreCategory[] = [];
  loadingCategories = true;

  form: any = {
    name: '',
    description: '',
    phone: '',
    address: '',
    delivery_radius_km: 5,
    is_open: true,
    category: null,
  };
  error = '';
  success = '';
  saving = false;

  async ngOnInit() {
    // Cargar categorías y tienda en paralelo
    await Promise.all([this.loadCategories(), this.loadStore()]);
  }

  private async loadCategories() {
    this.loadingCategories = true;
    try {
      this.categories = await firstValueFrom(this.storeService.getCategories());
    } catch {
      this.categories = [];
    } finally {
      this.loadingCategories = false;
    }
  }

  private async loadStore() {
    try {
      this.store = await firstValueFrom(this.storeService.getMyStore());
      if (this.store) {
        for (const key of STORE_EDITABLE_FIELDS) {
          if ((this.store as any)[key] !== undefined) {
            this.form[key] = (this.store as any)[key];
          }
        }
        // category puede venir como objeto {id, name} — normalizar a id
        if (this.store.category && typeof this.store.category === 'object') {
          this.form.category = (this.store.category as any).id;
        }
      }
    } catch {
      this.store = null;
    }
  }

  async save() {
    this.saving = true;
    this.error = '';
    this.success = '';

    try {
      // Construir payload únicamente con campos editables
      const payload: any = {};
      for (const key of STORE_EDITABLE_FIELDS) {
        if (this.form[key] !== undefined && this.form[key] !== '') {
          payload[key] = this.form[key];
        }
      }
      // Omitir category si no se seleccionó
      if (!this.form.category) {
        delete payload.category;
      }

      if (this.store) {
        // PATCH — actualizar tienda existente
        await firstValueFrom(this.storeService.updateMyStore(payload));
        this.store = await firstValueFrom(this.storeService.getMyStore());
        // Resincronizar form con respuesta actualizada
        for (const key of STORE_EDITABLE_FIELDS) {
          if ((this.store as any)[key] !== undefined) {
            this.form[key] = (this.store as any)[key];
          }
        }
        if (this.store.category && typeof this.store.category === 'object') {
          this.form.category = (this.store.category as any).id;
        }
        this.success = '✅ Tienda actualizada correctamente.';
      } else {
        // POST — crear tienda nueva
        this.store = await firstValueFrom(this.storeService.create(payload));
        this.success = '🎉 ¡Tienda creada! Ya puedes empezar a añadir productos.';
        // Redirigir al dashboard tras 1.5s para que el usuario vea el mensaje
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      }
    } catch (e: any) {
      console.error('[StoreSettings] Error al guardar:', e);
      const detail = e?.error;

      if (e?.status === 0) {
        this.error = 'No se puede conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8080.';
      } else if (e?.status === 401) {
        this.error = 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.';
      } else if (e?.status === 403) {
        this.error = 'No tienes permisos para realizar esta acción. Asegúrate de que tu cuenta sea de tipo COMERCIO.';
      } else if (typeof detail === 'string') {
        this.error = detail;
      } else if (detail && typeof detail === 'object') {
        const messages: string[] = [];
        for (const field of Object.keys(detail)) {
          const msg = Array.isArray(detail[field]) ? detail[field][0] : detail[field];
          messages.push(`${field}: ${msg}`);
        }
        this.error = messages.join('. ');
      } else {
        this.error = 'Error al guardar la tienda. Revisa la consola para más detalles.';
      }
    } finally {
      this.saving = false;
    }
  }
}
