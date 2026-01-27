import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private isLoggedIn: boolean = false;
  private userRole: string = '';

  constructor() { }

  login(username: string, password: string): boolean {
    if (username === 'adminbassiana' && password === 'admin@bassiana') {
      this.isLoggedIn = true;
      this.userRole = 'admin';
      return true;
    } else if (username === 'userbassiana' && password === 'user@bassiana') {
      this.isLoggedIn = true;
      this.userRole = 'user';
      return true;
    }
    return false;
  }

  logout(): void {
    this.isLoggedIn = false;
    this.userRole = '';
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }

  getRole(): string {
    return this.userRole;
  }

  isAdmin(): boolean {
    return this.userRole === 'admin';
  }

  isUser(): boolean {
    return this.userRole === 'user';
  }
}
