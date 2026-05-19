import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { SidebarService } from '../services/sidebarservice';
import { FileUpload } from 'primeng/fileupload';
import { AuthService } from '../services/AuthService';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-docsadmin',
  templateUrl: 'docsadmin.component.html',
  styleUrls: ['docsadmin.component.scss']
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
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated() || !this.authService.isAdmin()) {
      this.router.navigate(['/'], { replaceUrl: true });
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
    this.router.navigate(['/'], { replaceUrl: true });
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
    this.router.navigate(['/'], { replaceUrl: true });
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
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Success', 
            detail: `File "${file.name}" uploaded successfully` 
          });
        },
        error: (err) => {
          console.error('Upload failed for file:', file.name, err);
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: `Failed to upload file "${file.name}"` 
          });
        }
      });
    }
  }
}
