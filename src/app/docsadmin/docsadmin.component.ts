import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    private http: HttpClient,
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

  uploadHandler(event: any): void {
    const files: File[] = event?.files || [];
    if (!files.length) {
      return;
    }

    const uploadUrl = `${this.authService.getServerRootUrl()}/api/imas/upload`;

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file, file.name);

      this.http.post(uploadUrl, formData).subscribe({
        next: () => {
          console.log('Uploaded file:', file.name);
        },
        error: (err) => {
          console.error('Upload failed for file:', file.name, err);
        }
      });
    }
  }
}
