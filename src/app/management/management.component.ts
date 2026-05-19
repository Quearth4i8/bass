import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarService } from '../services/sidebarservice';
import { AuthService } from '../services/AuthService';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { PortalProjectsService } from '../portal/services/portal-projects.service';
import { PortalProjectMeta } from '../portal/models/portal-project.model';

@Component({
  selector: 'app-management',
  templateUrl: 'management.component.html',
  styleUrls: ['management.component.scss']
})
export class ManagementComponent implements OnInit {
  isSidebarVisible = true;
  isUserMenuOpen = false;
  logoutModalVisible = false;
  
  // Add Project State
  isAddModalOpen = false;
  newProject: any = {
    title: '',
    description: '',
    image: 'assets/images/ichkeul_home.jpg',
    isActive: true,
    status: 'Active',
    accentColor: '#1a5f7a',
  };

  // Edit Project State
  isEditModalOpen = false;
  isDeleteModalOpen = false;
  editingProject: any = null;
  editingProjectIndex: number = -1;
  
  portalProjects: PortalProjectMeta[] = [];

  get activeProjectsCount(): number {
    return this.portalProjects.filter(p => p.isActive).length;
  }

  constructor(
    private sidebarService: SidebarService,
    private authService: AuthService,
    private router: Router,
    private portalProjectsService: PortalProjectsService,
    private destroyRef: DestroyRef,
    private messageService: MessageService,
  ) { }

  ngOnInit(): void {
    this.sidebarService.sidebarVisibility$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isVisible) => {
        this.isSidebarVisible = isVisible;
      });
    this.portalProjectsService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projects) => {
        this.portalProjects = projects;
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
    this.router.navigate(['/'], { replaceUrl: true });
  }

  showAddProjectDialog(): void {
    this.newProject = {
      title: '',
      description: '',
      image: 'assets/images/ichkeul_home.jpg',
      isActive: true,
      status: 'Active',
      accentColor: '#1a5f7a',
    };
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  onAddImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newProject.image = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  confirmAddProject(): void {
    if (this.newProject.title.trim()) {
      this.portalProjectsService
        .create({
          title: this.newProject.title,
          description: this.newProject.description,
          image: this.newProject.image,
          isActive: this.newProject.isActive,
          accentColor: this.newProject.accentColor,
        })
        .subscribe({
          next: (res) => {
            if (res) {
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Project created successfully' });
              this.closeAddModal();
            }
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create project' });
          }
        });
    }
  }

  goToPortalProjects(projectSlug: string): void {
    this.router.navigate(['/management/portal-projects', projectSlug]);
  }

  goToPortalPublic(projectSlug: string, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/portal', projectSlug]);
  }

  // Edit Project Methods
  openEditModal(project: any, index: number, event: MouseEvent): void {
    event.stopPropagation();
    this.editingProjectIndex = index;
    this.editingProject = {
      ...project,
      accentColor: project.accentColor || '#1a5f7a',
    };
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editingProject = null;
    this.editingProjectIndex = -1;
  }

  onEditImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editingProject.image = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveProjectEdit(): void {
    if (this.editingProjectIndex < 0 || !this.editingProject?.slug) return;
    const slug = this.editingProject.slug as string;
    this.portalProjectsService.updateMeta(slug, {
      title: this.editingProject.title,
      description: this.editingProject.description,
      image: this.editingProject.image,
      isActive: this.editingProject.isActive,
      accentColor: this.editingProject.accentColor,
    }).subscribe({
      next: (res) => {
        if (res) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Project updated successfully' });
          this.closeEditModal();
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update project' });
      }
    });
  }

  // Delete Project Methods
  openDeleteModal(index: number, event: MouseEvent): void {
    event.stopPropagation();
    this.editingProjectIndex = index;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.editingProjectIndex = -1;
  }

  confirmDeleteProject(): void {
    if (this.editingProjectIndex < 0) return;
    const project = this.portalProjects[this.editingProjectIndex];
    if (!project?.slug) return;
    this.portalProjectsService.delete(project.slug).subscribe({
      next: (deleted) => {
        if (deleted) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Project deleted successfully' });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete project' });
        }
        this.closeDeleteModal();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'An error occurred while deleting' });
        this.closeDeleteModal();
      }
    });
  }

}
