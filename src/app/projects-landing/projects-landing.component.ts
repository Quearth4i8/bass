import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/AuthService';

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

  projects = [
    {
      id: 'imas-ichkeul',
      name: 'IMAS-ICHKEUL',
      description: 'About IMAS-ICHKEUL',
      image: 'assets/images/4.png',
      active: true
    },
    {
      id: 'abcdrybasin',
      name: 'ABCDryBasin',
      description: 'Coming Soon',
      image: 'assets/images/1.png',
      active: false
    },
    {
      id: 'bassiana',
      name: 'BASSIANA',
      description: 'Coming Soon',
      image: 'assets/images/2.png',
      active: false
    },
    {
      id: 'summonehealth',
      name: 'SUMME_One Health',
      description: 'Coming Soon',
      image: 'assets/images/3.png',
      active: false
    }
  ];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.checkAdminSession();
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

  navigateToProject(projectId: string): void {
    if (projectId === 'imas-ichkeul') {
      this.router.navigate(['/imas-ichkeul']);
    }
    // Add navigation for other projects when they become active
  }
}
