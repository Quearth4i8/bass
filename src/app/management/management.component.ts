import { Component, DestroyRef, HostBinding, HostListener, OnInit } from '@angular/core';
import { ThemeService } from '../services/ThemeService';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarService } from '../services/sidebarservice';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { PortalProjectsService } from '../portal/services/portal-projects.service';
import { PORTAL_BRAND_MODES, PortalProjectMeta } from '../portal/models/portal-project.model';

@Component({
  selector: 'app-management',
  templateUrl: 'management.component.html',
  styleUrls: ['management.component.scss']
})
export class ManagementComponent implements OnInit {
  @HostBinding('class.theme-light') get isLight() { return this.themeService.isLight; }
  isSidebarVisible = true;

  /** Options for the navbar identity picker; see PortalBrandMode. */
  readonly brandModes = PORTAL_BRAND_MODES;

  /** Which modal's identity dropdown is open, if any. */
  openBrandModeDropdown: 'edit' | 'add' | null = null;

  toggleBrandModeDropdown(which: 'edit' | 'add', event: MouseEvent): void {
    // The document listener below would otherwise close it in the same tick.
    event.stopPropagation();
    this.openBrandModeDropdown = this.openBrandModeDropdown === which ? null : which;
  }

  selectBrandMode(which: 'edit' | 'add', mode: string): void {
    const target = which === 'edit' ? this.editingProject : this.newProject;
    if (target) target.brandMode = mode;
    this.openBrandModeDropdown = null;
  }

  brandModeLabel(mode: string): string {
    return this.brandModes.find((m) => m.value === mode)?.label ?? '';
  }

  @HostListener('document:click')
  closeBrandModeDropdown(): void {
    this.openBrandModeDropdown = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.openBrandModeDropdown = null;
  }
  // Add Project State
  isAddModalOpen = false;
  newProject: any = {
    title: '',
    description: '',
    image: 'assets/images/ichkeul_home.jpg',
    isActive: true,
    status: 'Active',
    accentColor: '#1a5f7a',
    logo: '',
    brandMode: 'title-id',
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
    private router: Router,
    private portalProjectsService: PortalProjectsService,
    private destroyRef: DestroyRef,
    private messageService: MessageService,
    public themeService: ThemeService,
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
        this.portalProjects = [...projects].sort((a, b) => {
          const aO = a.order ?? Number.MAX_SAFE_INTEGER;
          const bO = b.order ?? Number.MAX_SAFE_INTEGER;
          return aO - bO;
        });
      });
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
    this.sidebarService.toggleSidebar();
  }

  moveProject(index: number, direction: 'up' | 'down'): void {
    const other = direction === 'up' ? index - 1 : index + 1;
    if (other < 0 || other >= this.portalProjects.length) return;
    const slugA = this.portalProjects[index].slug;
    const slugB = this.portalProjects[other].slug;
    // Update the store synchronously — the reactive subscription re-fires and
    // re-sorts portalProjects automatically with the new order values.
    this.portalProjectsService.reorderInStore([
      { slug: slugA, order: other + 1 },
      { slug: slugB, order: index + 1 },
    ]);
    // Persist to backend in the background.
    this.portalProjectsService.updateMeta(slugA, { order: other + 1 }).subscribe();
    this.portalProjectsService.updateMeta(slugB, { order: index + 1 }).subscribe();
  }


  showAddProjectDialog(): void {
    this.newProject = {
      title: '',
      description: '',
      image: 'assets/images/ichkeul_home.jpg',
      isActive: true,
      status: 'Active',
      accentColor: '#1a5f7a',
      logo: '',
      brandMode: 'title-id',
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
          logo: this.newProject.logo,
          brandMode: this.newProject.brandMode,
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
      logo: project.logo || '',
      brandMode: project.brandMode || 'title-id',
    };
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editingProject = null;
    this.editingProjectIndex = -1;
  }

  brandHint(mode: string): string {
    return this.brandModes.find((m) => m.value === mode)?.hint ?? '';
  }

  onAddLogoSelected(event: any): void {
    this.readImageInto(event, (url) => { this.newProject.logo = url; });
  }

  onEditLogoSelected(event: any): void {
    this.readImageInto(event, (url) => { this.editingProject.logo = url; });
  }

  clearEditLogo(): void {
    this.editingProject.logo = '';
  }

  clearAddLogo(): void {
    this.newProject.logo = '';
  }

  private readImageInto(event: any, assign: (dataUrl: string) => void): void {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => assign(e.target.result);
    reader.readAsDataURL(file);
    // Let the same file be picked again after a clear.
    event.target.value = '';
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
      logo: this.editingProject.logo,
      brandMode: this.editingProject.brandMode,
    }).subscribe({
      next: (res) => {
        if (res) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Project updated successfully' });
          this.closeEditModal();
          return;
        }
        // updateMeta() swallows HTTP failures and emits null, so without this
        // branch a rejected save looked like nothing happening at all - the
        // modal stayed open and the old values came back on reopening.
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update project. Changes were not saved.',
        });
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
