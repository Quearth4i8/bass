import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/ThemeService';
import { AuthService } from '../../services/AuthService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-navbar.component.html',
  styleUrls: ['./admin-navbar.component.scss'],
})
export class AdminNavbarComponent {
  @HostBinding('class.theme-light') get hostLight() { return this.themeService.isLight; }

  @Input() pageTitle = '';
  @Output() menuToggle = new EventEmitter<void>();

  isUserMenuOpen = false;
  logoutModalVisible = false;

  constructor(
    public themeService: ThemeService,
    private authService: AuthService,
    private router: Router,
  ) {}

  onMenuToggle(): void { this.menuToggle.emit(); }

  toggleUserMenu(): void { this.isUserMenuOpen = !this.isUserMenuOpen; }

  showLogoutModal(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isUserMenuOpen = false;
    this.logoutModalVisible = true;
  }

  closeLogoutModal(): void { this.logoutModalVisible = false; }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeLogoutModal();
  }

  confirmLogout(): void {
    this.logoutModalVisible = false;
    this.authService.logout();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}
