import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY = 'bass_projects_auth_token';
  private readonly ROLE_KEY = 'bass_projects_auth_role';
  private readonly USERNAME_KEY = 'bass_projects_auth_username';

  private baseUrl: string;

  constructor(private http: HttpClient) {
    this.baseUrl = this.getBaseUrl();
  }

  private getBaseUrl(): string {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8085/bassiana';
    }
    return 'http://41.229.139.17:8080/imasservice/bassiana';
  }

  getApiBaseUrl(): string {
    return this.baseUrl;
  }

  getServerRootUrl(): string {
    if (this.baseUrl.endsWith('/bassiana')) {
      return this.baseUrl.slice(0, -'/bassiana'.length);
    }
    return this.baseUrl;
  }

  login(username: string, password: string): Observable<boolean> {
    return this.http
      .post<any>(`${this.baseUrl}/auth/signin`, { username, password })
      .pipe(
        tap((res) => {
          const token = res?.accessToken || res?.token;
          if (token) {
            localStorage.setItem(this.TOKEN_KEY, token);
          }

          if (token) {
            const payload = this.decodeJwtPayload(token);
            const roleFromToken = payload?.role;
            const usernameFromToken = payload?.username || payload?.sub;
            if (typeof roleFromToken === 'string') {
              localStorage.setItem(this.ROLE_KEY, roleFromToken);
            }
            if (typeof usernameFromToken === 'string' && usernameFromToken) {
              localStorage.setItem(this.USERNAME_KEY, usernameFromToken);
            }
          }
        }),
        map((res) => {
          const token = res?.accessToken || res?.token;
          return !!token;
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private decodeJwtPayload(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      const json = atob(padded);
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }

  isTokenExpired(leewaySeconds: number = 10): boolean {
    const token = this.getToken();
    if (!token) return true;
    const payload = this.decodeJwtPayload(token);
    const exp = payload?.exp;
    if (typeof exp !== 'number') return false;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return exp <= (nowSeconds + leewaySeconds);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }
    return true;
  }

  getRole(): string {
    return localStorage.getItem(this.ROLE_KEY) || '';
  }

  getUsername(): string {
    return localStorage.getItem(this.USERNAME_KEY) || '';
  }

  isAdmin(): boolean {
    return this.getRole() === 'ROLE_PROJECTS_ADMIN';
  }

  isUser(): boolean {
    return this.getRole() === 'ROLE_PROJECTS_USER';
  }

  bootstrapFromToken(): Observable<void> {
    const token = this.getToken();
    if (!token) return of(void 0);
    const payload = this.decodeJwtPayload(token);
    const role = payload?.role;
    const username = payload?.username || payload?.sub;
    if (typeof role === 'string' && !this.getRole()) {
      localStorage.setItem(this.ROLE_KEY, role);
    }
    if (typeof username === 'string' && username && !this.getUsername()) {
      localStorage.setItem(this.USERNAME_KEY, username);
    }
    return of(void 0);
  }
}
