import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="brand">
          <div class="logo">K</div>
          <h1>Kinetik</h1>
          <p>Panel de administración para tu negocio</p>
        </div>

        <form (ngSubmit)="login()" class="form">
          <div class="field">
            <label>Usuario</label>
            <input type="text" [(ngModel)]="username" name="username" placeholder="tu usuario" required />
          </div>
          <div class="field">
            <label>Contraseña</label>
            <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required />
          </div>

          @if (error) {
            <div class="error">{{ error }}</div>
          }

          <button type="submit" class="btn-primary" [disabled]="loading">
            {{ loading ? 'Entrando...' : 'Iniciar Sesión' }}
          </button>
        </form>

        <p class="register-link">
          ¿No tienes cuenta? <a routerLink="/register">Regístrate</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%);
      padding: 20px;
    }
    .login-card {
      background: white; border-radius: 24px; padding: 40px;
      width: 100%; max-width: 400px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
    }
    .brand { text-align: center; margin-bottom: 32px; }
    .logo {
      width: 56px; height: 56px; background: #6C4CF1; border-radius: 16px;
      display: inline-flex; align-items: center; justify-content: center;
      color: white; font-weight: 900; font-size: 24px; margin-bottom: 12px;
    }
    .brand h1 { font-size: 24px; font-weight: 800; color: #0F172A; margin: 0 0 4px; }
    .brand p { font-size: 14px; color: #64748B; margin: 0; }
    .form { display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
    .field input {
      padding: 12px 16px; border: 1.5px solid #E2E8F0; border-radius: 12px;
      font-size: 15px; color: #0F172A; outline: none; transition: border-color 0.2s;
    }
    .field input:focus { border-color: #6C4CF1; box-shadow: 0 0 0 3px rgba(108,76,241,0.1); }
    .error { color: #EF4444; font-size: 13px; font-weight: 500; text-align: center; }
    .btn-primary {
      padding: 14px; background: #6C4CF1; color: white; border: none;
      border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .register-link { text-align: center; margin-top: 20px; font-size: 14px; color: #64748B; }
    .register-link a { color: #6C4CF1; font-weight: 700; text-decoration: none; }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  error = '';
  loading = false;

  async login() {
    if (!this.username || !this.password) return;
    this.loading = true;
    this.error = '';

    try {
      const tokens = await firstValueFrom(this.auth.login(this.username, this.password));
      const user = await firstValueFrom(this.auth.getMe());
      this.auth.saveSession(user, tokens);
      this.router.navigate(['/dashboard']);
    } catch {
      this.error = 'Usuario o contraseña incorrectos';
    } finally {
      this.loading = false;
    }
  }
}
