import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly SESSION_KEY = 'bass_auth_session';
  private readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

  // Obfuscated credentials (base64 encoded - not secure but better than plain text)
  private readonly CREDENTIALS = {
    admin: {
      username: btoa('adminbassiana'),
      password: btoa('admin@bassiana'),
      role: 'admin'
    },
    user: {
      username: btoa('userbassiana'),
      password: btoa('user@bassiana'),
      role: 'user'
    }
  };

  constructor() {
    // Check for existing session on startup
    this.checkExistingSession();
  }

  private checkExistingSession(): void {
    const session = this.getSession();
    if (session && session.expiresAt > Date.now()) {
      // Valid session exists
      return;
    } else if (session) {
      // Session expired, clear it
      this.clearSession();
    }
  }

  private getSession(): any {
    try {
      const sessionData = sessionStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;
      
      // Simple XOR "decryption" with a fixed key
      const decrypted = this.xorDecrypt(sessionData, 'bassiana2024');
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  private setSession(role: string): void {
    const session = {
      role: role,
      loggedInAt: Date.now(),
      expiresAt: Date.now() + this.SESSION_DURATION
    };
    
    // Simple XOR "encryption"
    const encrypted = this.xorEncrypt(JSON.stringify(session), 'bassiana2024');
    sessionStorage.setItem(this.SESSION_KEY, encrypted);
  }

  private clearSession(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  // Simple XOR encryption (obfuscation - not cryptographically secure)
  private xorEncrypt(data: string, key: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result);
  }

  private xorDecrypt(data: string, key: string): string {
    try {
      const decoded = atob(data);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(
          decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return result;
    } catch {
      return '';
    }
  }

  login(username: string, password: string): boolean {
    // Encode input to compare with stored encoded credentials
    const encodedUsername = btoa(username);
    const encodedPassword = btoa(password);

    // Check admin credentials
    if (encodedUsername === this.CREDENTIALS.admin.username && 
        encodedPassword === this.CREDENTIALS.admin.password) {
      this.setSession('admin');
      return true;
    }

    // Check user credentials
    if (encodedUsername === this.CREDENTIALS.user.username && 
        encodedPassword === this.CREDENTIALS.user.password) {
      this.setSession('user');
      return true;
    }

    return false;
  }

  logout(): void {
    this.clearSession();
  }

  isAuthenticated(): boolean {
    const session = this.getSession();
    if (session && session.expiresAt > Date.now()) {
      return true;
    }
    // Session expired or invalid
    if (session) {
      this.clearSession();
    }
    return false;
  }

  getRole(): string {
    const session = this.getSession();
    return session?.role || '';
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  isUser(): boolean {
    return this.getRole() === 'user';
  }

  // Get remaining session time in minutes
  getSessionRemainingTime(): number {
    const session = this.getSession();
    if (!session) return 0;
    
    const remaining = session.expiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / 60000)); // Convert to minutes
  }
}
