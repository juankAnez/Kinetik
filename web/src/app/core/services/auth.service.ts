import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthTokens, User } from '../models/models';

const API = 'http://localhost:8080/api/v1';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  get token(): string | null {
    return localStorage.getItem('access_token');
  }

  get user(): User | null {
    const raw = localStorage.getItem('user_data');
    return raw ? JSON.parse(raw) : null;
  }

  login(username: string, password: string): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${API}/auth/login/`, { username, password })
      .pipe(tap((t) => localStorage.setItem('access_token', t.access)));
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${API}/auth/me/`);
  }

  register(payload: any): Observable<User> {
    return this.http.post<User>(`${API}/auth/register/`, payload);
  }

  saveSession(user: User, tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    this.router.navigate(['/login']);
  }
}
