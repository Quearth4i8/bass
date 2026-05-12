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
  
  // Add Project State
  isAddModalOpen = false;
  newProject: any = {
    title: '',
    description: '',
    image: 'assets/images/ichkeul_home.jpg',
    isActive: true,
    status: 'Active'
  };

  // Edit Project State
  isEditModalOpen = false;
  isDeleteModalOpen = false;
  editingProject: any = null;
  editingProjectIndex: number = -1;
  
  portalProjects = [
    { 
      title: 'IMAS-ICHKEUL', 
      description: 'About IMAS-ICHKEUL', 
      status: 'Active',
      image: 'assets/images/ichkeul_home.jpg',
      isActive: true
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
    this.newProject = {
      title: '',
      description: '',
      image: 'assets/images/ichkeul_home.jpg',
      isActive: true,
      status: 'Active'
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
      this.portalProjects.push({ ...this.newProject });
      this.closeAddModal();
    }
  }

  goToPortalProjects(projectTitle: string): void {
    this.router.navigate(['/management/portal-projects', projectTitle.toLowerCase()]);
  }

  // Edit Project Methods
  openEditModal(project: any, index: number, event: MouseEvent): void {
    event.stopPropagation();
    this.editingProjectIndex = index;
    this.editingProject = { ...project }; // Clone to avoid direct mutation
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
    if (this.editingProjectIndex > -1) {
      this.portalProjects[this.editingProjectIndex] = { ...this.editingProject };
      this.closeEditModal();
    }
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
    if (this.editingProjectIndex > -1) {
      this.portalProjects.splice(this.editingProjectIndex, 1);
      this.closeDeleteModal();
    }
  }

}
