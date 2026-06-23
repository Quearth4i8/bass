import { Component, HostBinding, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/AuthService';
import { ThemeService } from '../services/ThemeService';

@Component({
  selector: 'app-projects-landing',
  templateUrl: './projects-landing.component.html',
  styleUrls: ['./projects-landing.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ProjectsLandingComponent implements OnInit, OnDestroy {
  @HostBinding('class.theme-light') get isLight() { return this.themeService.isLight; }

  username = '';
  password = '';
  error = '';
  showAdminLogin = false;
  showPassword = false;
  isAdminLoggedIn = false;
  currentTime = '';

  private clockInterval?: ReturnType<typeof setInterval>;

  constructor(
    private router: Router,
    private authService: AuthService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.checkAdminSession();
    this.startClock();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  private startClock(): void {
    const tick = () => {
      this.currentTime = new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Africa/Tunis', hour: '2-digit', minute: '2-digit', second: '2-digit'
      }) + ' TUN';
    };
    tick();
    this.clockInterval = setInterval(tick, 1000);
  }

  private checkAdminSession(): void {
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      this.isAdminLoggedIn = true;
      this.showAdminLogin = false;
    }
  }

  toggleAdminLogin(): void {
    this.showAdminLogin = !this.showAdminLogin;
    this.error = '';
  }

  login(event: Event): void {
    event.preventDefault();
    this.error = '';
    this.authService.login(this.username, this.password).subscribe({
      next: (ok) => {
        if (!ok) { this.error = 'Invalid username or password'; return; }
        if (this.authService.isAdmin()) {
          this.isAdminLoggedIn = true;
          this.showAdminLogin = false;
          this.username = '';
          this.password = '';
          this.router.navigate(['/projectadmin'], { replaceUrl: true });
        } else {
          this.error = 'Admin access required';
          this.authService.logout();
        }
      },
      error: () => { this.error = 'Invalid username or password'; }
    });
  }

  continueToAdmin(): void { this.router.navigate(['/projectadmin']); }

  adminLogout(): void {
    this.authService.logout();
    this.isAdminLoggedIn = false;
    this.showAdminLogin = false;
  }

  togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.admin-area')) this.showAdminLogin = false;
  }
}
