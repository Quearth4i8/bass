import { Component, OnInit } from '@angular/core';
import { SidebarService } from '../services/sidebarservice';
import { AuthService } from '../services/AuthService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-management',
  templateUrl: 'management.component.html',
  styleUrls: ['management.component.scss']
})
export class ManagementComponent {
  isSidebarVisible = true;
  isUserMenuOpen = false;
  logoutModalVisible = false;
  
  portalProjects = [
    { 
      title: 'IMAS-ICHKEUL', 
      description: 'About IMAS-ICHKEUL', 
      status: 'Active',
      image: 'assets/images/ichkeul_home.jpg',
      comingSoon: false
    },
    { 
      title: 'ABCDryBasin', 
      description: 'Coming Soon', 
      status: 'Pending',
      image: 'assets/images/project2.jpg',
      comingSoon: true
    },
    { 
      title: 'BASSIANA', 
      description: 'Coming Soon', 
      status: 'Pending',
      image: 'assets/images/project3.jpg',
      comingSoon: true
    },
    { 
      title: 'SUMME_One Health', 
      description: 'Coming Soon', 
      status: 'Pending',
      image: 'assets/images/project4.jpg',
      comingSoon: true
    }
  ];

  constructor(private sidebarService: SidebarService, private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.sidebarService.sidebarVisibility$.subscribe((isVisible) => {
      this.isSidebarVisible = isVisible;
    });
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
    this.sidebarService.toggleSidebar();
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  showLogoutModal(event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.logoutModalVisible = true;
  }

  closeLogoutModal(): void {
    this.logoutModalVisible = false;
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeLogoutModal();
    }
  }

  confirmLogout(): void {
    this.logoutModalVisible = false;
    this.authService.logout();
    this.router.navigate(['/projects'], { replaceUrl: true });
  }

  showAddProjectDialog(): void {
    console.log('Open add project dialog');
  }

  goToPortalProjects(projectTitle: string): void {
    this.router.navigate(['/management/portal-projects', projectTitle.toLowerCase()]);
  }

}
