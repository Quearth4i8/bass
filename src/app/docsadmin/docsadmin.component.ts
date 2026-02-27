import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarService } from '../services/sidebarservice';
import { FileUpload } from 'primeng/fileupload';
import { AuthService } from '../services/AuthService';

@Component({
  selector: 'app-docsadmin',
  templateUrl: 'docsadmin.component.html',
  styleUrls: ['docsadmin.component.scss'],
})
export class DocsadminComponent {

  isSidebarVisible = true;
  logoutModalVisible = false;
  isUserMenuOpen = false;

  @ViewChild('fileUpload') fileUpload!: FileUpload;

  constructor(
    private sidebarService: SidebarService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated() || !this.authService.isAdmin()) {
      this.router.navigate(['/projects'], { replaceUrl: true });
      return;
    }

    this.sidebarService.sidebarVisibility$.subscribe((isVisible) => {
      console.log(isVisible)
      this.isSidebarVisible = isVisible;
    });
  }

  showLogoutModal(event?: MouseEvent): void {
    console.log('Logout clicked, showing modal');
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
    // Only close if clicking the overlay itself, not the dialog
    if (event.target === event.currentTarget) {
      this.closeLogoutModal();
    }
  }

  confirmLogout(): void {
    this.logoutModalVisible = false;
    this.authService.logout();
    this.router.navigate(['/projects'], { replaceUrl: true });
  }

  triggerFileUpload(event: MouseEvent): void {
    // Trigger the file input click
    const fileInput = this.fileUpload?.basicFileInput?.nativeElement || 
                      this.fileUpload?.advancedFileInput?.nativeElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/projects'], { replaceUrl: true });
  }

  onUpload(event: any): void {
    for (const file of event.files) {
      console.log('File uploaded:', file);
    }
  }
}
