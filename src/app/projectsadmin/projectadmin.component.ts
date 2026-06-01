import { ProjectService } from '../services/ProjectService';
import { SidebarService } from '../services/sidebarservice';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ThemeService } from '../services/ThemeService';
import { Router } from '@angular/router';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DialogContentComponent } from '../utilities/dialogues/dialog-content/dialog-content.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogProjectDeleteComponent } from '../utilities/dialogues/confirmation-dialog-project-delete/confirmation-dialog-project-delete.component';
import { MessageService } from 'primeng/api';
import { ProjectGroupDialogComponent } from '../utilities/dialogues/project-group-dialog/project-group-dialog.component';
import { ProjectGroupService } from '../services/ProjectGroupService';
import { AuthService } from '../services/AuthService';

@Component({
  selector: 'projectadmin',
  templateUrl: 'projectadmin.component.html',
  styleUrls: ['projectadmin.component.scss']
})
export class ProjectAdminComponent implements OnInit, OnDestroy {
  ref: DynamicDialogRef | undefined;
  projects: any[] = [];
  pagedProjects: any[] = [];
  editMode: boolean[] = [];
  pageIndex: number = 0;
  pageSize: number = 5;
  isSidebarVisible = true;
  projectGroupTitles: any[] = [];
  dropdownOpenState: boolean[] = [];
  groupDropdownOpen: boolean[] = [];
  pageSizeDropdownOpen: boolean = false;
  pageDropdownOpen: boolean = false;
  pageSizeOptions: number[] = [5, 10, 25, 50, 100];

  constructor(
    private projectService: ProjectService,
    private sidebarService: SidebarService,
    public dialogService: DialogService,
    private dialog: MatDialog,
    private messageService: MessageService,
    private projectGroupService: ProjectGroupService,
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const clickedOnPageDropdown = target.closest('.stat-box.clickable') !== null;
    
    if (!clickedOnPageDropdown) {
      this.pageSizeDropdownOpen = false;
      this.pageDropdownOpen = false;
    }
  }

  onContentScroll(): void {
    this.pageSizeDropdownOpen = false;
    this.pageDropdownOpen = false;
  }

  showDialog(project?: any) {
    this.ref = this.dialogService.open(DialogContentComponent, {
      dismissableMask: true,
      closable: true,
      style: { 'min-width': '600px' },
      data: project ? { project } : undefined
    });

    if (this.ref) {
      this.ref.onClose.subscribe((result) => {
        if (result === 'success') {
          if (project) {
            this.showUpdateInfoMessage();
          } else {
            this.showSuccessMessage();
          }
          this.fetchProjects();
        }
      });
    }
  }

  showSuccessMessage() {
    this.messageService.add({
      severity: 'success',
      detail: 'Project added successfully',
      life: 2000,
      closable: false,
      sticky: false,
      styleClass: 'custom-success-message'
    });
  }

  showDialog2() {
    this.ref = this.dialogService.open(ProjectGroupDialogComponent, {
      dismissableMask: true,
      closable: true,
      style: { 'min-width': '450px' }
    });

    if (this.ref) {
      this.ref.onClose.subscribe((result) => {
        if (result === 'success') {
          this.showSuccessMessage2();
          this.fetchProjects();
        }
      });
    }
  }

  showSuccessMessage2() {
    this.messageService.add({
      severity: 'success',
      detail: 'Project group added successfully',
      life: 2000,
      closable: false,
      sticky: false,
      styleClass: 'custom-success-message'
    });
  }

  showUpdateInfoMessage() {
    this.messageService.add({
      severity: 'info',
      detail: 'Project updated successfully',
      life: 2000,
      closable: false,
      sticky: false,
      styleClass: 'custom-info-message'
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated() || !this.authService.isAdmin()) {
      this.router.navigate(['/'], { replaceUrl: true });
      return;
    }

    this.fetchProjects();
    this.sidebarService.sidebarVisibility$.subscribe((isVisible) => {
      this.isSidebarVisible = isVisible;
    });
    this.projectGroupService.getProjectGroups().subscribe(groups => {
      this.projectGroupTitles = groups.map(group => ({ label: group.title, value: group.title }));
    });
    this.dropdownOpenState = new Array(this.pagedProjects.length).fill(false);
  }

  onProjectsChange() {
    this.dropdownOpenState = new Array(this.pagedProjects.length).fill(false);
  }

  fetchProjects(): void {
    this.projectService.getAllProjects().subscribe(
      (data: any[]) => {
        this.projects = data.sort((a, b) => a.id - b.id);
        this.updatePage(0);
      },
      (error) => {
        console.error('Error fetching projects:', error);
      }
    );
  }

  updatePage(pageIndex: number): void {
    this.pageIndex = pageIndex;
    const startIndex = this.pageIndex * this.pageSize;
    this.pagedProjects = this.projects.slice(startIndex, startIndex + this.pageSize);
    this.editMode = new Array(this.pagedProjects.length).fill(false);
    this.groupDropdownOpen = new Array(this.pagedProjects.length).fill(false);
  }

  prevPage(): void {
    if (this.pageIndex > 0) {
      this.updatePage(this.pageIndex - 1);
    }
  }

  nextPage(): void {
    if (this.pageIndex < this.totalPages - 1) {
      this.updatePage(this.pageIndex + 1);
    }
  }

  saveChanges(index: number, save: boolean): void {
    if (save) {
      const updatedProject = {
        responsable: this.projects[index].responsable,
        partenaire: this.projects[index].partenaire,
        thematique: this.projects[index].thematique,
        programme: this.projects[index].programme,
        titreproj: this.projects[index].titreproj,
        acronyme: this.projects[index].acronyme,
        budget: this.projects[index].budget,
        title: this.projects[index].title,
        startyear: this.projects[index].startyear,
        endyear: this.projects[index].endyear,
      };

      this.projectService.updateProject(this.projects[index].id, updatedProject)
        .subscribe(
          (updatedProject: any) => {
            console.log('Project updated:', updatedProject);
            this.projects[index] = updatedProject;
            this.projects = [...this.projects];
            this.showUpdateInfoMessage();
          },
          (error) => {
            console.error('Error updating project:', error);
          }
        );
    } else {
      this.fetchProjects();
    }
    this.editMode[index] = false;
  }

  toggleEditMode(index: number): void {
    this.editMode[index] = !this.editMode[index];
  }

  toggleDropdown(index: number, field: string): void {
    if (field === 'group') {
      this.groupDropdownOpen[index] = !this.groupDropdownOpen[index];
    }
  }

  togglePageSizeDropdown(): void {
    this.pageSizeDropdownOpen = !this.pageSizeDropdownOpen;
    this.pageDropdownOpen = false; // Close other dropdown
  }

  togglePageDropdown(): void {
    this.pageDropdownOpen = !this.pageDropdownOpen;
    this.pageSizeDropdownOpen = false; // Close other dropdown
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(event: Event, pageNum: number): void {
    event.stopPropagation();
    this.updatePage(pageNum - 1);
    this.pageDropdownOpen = false;
  }

  changePageSize(event: Event, size: number): void {
    event.stopPropagation();
    this.pageSize = size;
    this.pageSizeDropdownOpen = false;
    this.updatePage(0);
  }

  isDropdownOpen(index: number, field: string): boolean {
    if (field === 'group') {
      return !!this.groupDropdownOpen[index];
    }
    return false;
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    this.pageSizeDropdownOpen = false;
    this.pageDropdownOpen = false;
  }

  selectGroup(index: number, value: string): void {
    this.projects[index].title = value;
    this.groupDropdownOpen[index] = false;
  }

  showAdvancedFilters = false;
  globalSearchTerm = '';

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
  }


  onInput(event: Event, project: any, field: string): void {
    const input = event.target as HTMLInputElement;
    project[field] = input.value;
  }

  get totalPages(): number {
    return Math.ceil(this.projects.length / this.pageSize);
  }

  pagedProjectsIndex(index: number): number {
    return index + this.pageIndex * this.pageSize;
  }

  searchProjects(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchKeyword = input.value.trim();

    if (searchKeyword) {
      this.projectService.getProjectsByAcronyme(searchKeyword).subscribe(
        (data: any[]) => {
          this.projects = data.sort((a, b) => a.id - b.id);
          this.updatePage(0);
        },
        (error) => {
          console.error('Error searching projects:', error);
        }
      );
    } else {
      this.fetchProjects();
    }
  }

  searchProjects1(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchKeyword = input.value.trim();

    if (searchKeyword) {
      this.projectService.getProjectsByTitreproj(searchKeyword).subscribe(
        (data: any[]) => {
          this.projects = data.sort((a, b) => a.id - b.id);
          this.updatePage(0);
        },
        (error) => {
          console.error('Error searching projects:', error);
        }
      );
    } else {
      this.fetchProjects();
    }
  }

  searchProjects2(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchKeyword = input.value.trim();

    if (searchKeyword) {
      this.projectService.getProjectsByResponsable(searchKeyword).subscribe(
        (data: any[]) => {
          this.projects = data.sort((a, b) => a.id - b.id);
          this.updatePage(0);
        },
        (error) => {
          console.error('Error searching projects:', error);
        }
      );
    } else {
      this.fetchProjects();
    }
  }

  searchProjects3(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchKeyword = input.value.trim();

    if (searchKeyword) {
      this.projectService.getProjectsByPartenaire(searchKeyword).subscribe(
        (data: any[]) => {
          this.projects = data.sort((a, b) => a.id - b.id);
          this.updatePage(0);
        },
        (error) => {
          console.error('Error searching projects:', error);
        }
      );
    } else {
      this.fetchProjects();
    }
  }

  searchProjects4(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchKeyword = input.value.trim();

    if (searchKeyword) {
      this.projectService.getProjectsByProgram(searchKeyword).subscribe(
        (data: any[]) => {
          this.projects = data.sort((a, b) => a.id - b.id);
          this.updatePage(0);
        },
        (error) => {
          console.error('Error searching projects by programme:', error);
        }
      );
    } else {
      this.fetchProjects();
    }
  }

  onGlobalSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchKeyword = input.value.trim();

    if (searchKeyword) {
      // Search across all fields - you can implement a general search API
      // For now, we'll filter the existing projects
      this.projectService.getAllProjects().subscribe(
        (data: any[]) => {
          this.projects = data.filter(project => 
            (project.responsable && project.responsable.toLowerCase().includes(searchKeyword.toLowerCase())) ||
            (project.partenaire && project.partenaire.toLowerCase().includes(searchKeyword.toLowerCase())) ||
            (project.programme && project.programme.toLowerCase().includes(searchKeyword.toLowerCase())) ||
            (project.acronyme && project.acronyme.toLowerCase().includes(searchKeyword.toLowerCase())) ||
            (project.titreproj && project.titreproj.toLowerCase().includes(searchKeyword.toLowerCase()))
          ).sort((a, b) => a.id - b.id);
          this.updatePage(0);
        },
        (error) => {
          console.error('Error searching projects:', error);
        }
      );
    } else {
      this.fetchProjects();
    }
  }

  confirmDelete(projectId: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogProjectDeleteComponent, {
      width: '300px',
      disableClose: true,
      backdropClass: 'custom-backdrop-class',
      panelClass: 'custom-dialog-container'
    });
    dialogRef.afterOpened().subscribe(() => {
      document.body.classList.add('dialog-open');
    });

    dialogRef.afterClosed().subscribe(() => {
      document.body.classList.remove('dialog-open');
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteProject(projectId);
      }
    });
  }

  deleteProject(projectId: number): void {
    this.projectService.deleteProject(projectId).subscribe(
      () => {
        console.log(`Deleted project with ID: ${projectId}`);
        this.showDeleteSuccessMessage();
        this.fetchProjects();
      },
      (error) => {
        console.error(`Error deleting project with ID: ${projectId}`, error);
      }
    );
  }

  showDeleteSuccessMessage() {
    this.messageService.add({
      severity: 'error',
      detail: 'Project deleted successfully',
      life: 2000,
      closable: false,
      sticky: false,
      styleClass: 'custom-success-message'
    });
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }
}