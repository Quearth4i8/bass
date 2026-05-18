import { Component, DestroyRef, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/AuthService';
import { PortalProjectsService } from '../portal/services/portal-projects.service';
import { PortalProjectMeta } from '../portal/models/portal-project.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-projects-landing',
  templateUrl: './projects-landing.component.html',
  styleUrls: ['./projects-landing.component.scss']
})
export class ProjectsLandingComponent implements OnInit {
  username: string = '';
  password: string = '';
  error: string = '';
  showAdminLogin: boolean = false;
  showPassword: boolean = false;
  isAdminLoggedIn: boolean = false;

  projects: PortalProjectMeta[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private portalProjectsService: PortalProjectsService,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.checkAdminSession();

    this.portalProjectsService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projects) => {
        this.projects = [...projects].sort((a, b) => Number(b.isActive) - Number(a.isActive));
      });
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
        if (!ok) {
          this.error = 'Invalid username or password';
          return;
        }

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
      error: () => {
        this.error = 'Invalid username or password';
      }
    });
  }

  continueToAdmin(): void {
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      this.router.navigate(['/projectadmin']);
    }
  }

  adminLogout(): void {
    this.authService.logout();
    this.isAdminLoggedIn = false;
    this.showAdminLogin = false;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.landing-admin-area')) {
      this.showAdminLogin = false;
    }
  }

  navigateToProject(projectSlug: string): void {
    this.router.navigate(['/portal', projectSlug]);
  }
}
