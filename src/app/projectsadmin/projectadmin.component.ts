import { matchesDate, projectDate, roleLabel, statusLabel, statusTone, submissionDateText } from '../utilities/project-labels';
import { describeDateFilter } from '../shared/components/date-filter/date-filter.component';
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
import { ProjectGroupService } from '../services/ProjectGroupService';
import { AuthService } from '../services/AuthService';
import { matchesSearch } from '../shared/utils/text-search';
import { ProjectExportService, ProjectExportFormat } from '../services/ProjectExportService';
import { Subscription } from 'rxjs';

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
  pageSize: number = 10;
  isSidebarVisible = true;
  projectGroupTitles: any[] = [];
  dropdownOpenState: boolean[] = [];
  groupDropdownOpen: boolean[] = [];
  pageSizeDropdownOpen: boolean = false;
  pageDropdownOpen: boolean = false;
  pageSizeOptions: number[] = [5, 10, 25, 50, 100];
  pageSizeMenuOpen = false;

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
    private projectExportService: ProjectExportService,
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const clickedOnPageDropdown = target.closest('.stat-box.clickable') !== null;
    
    if (!clickedOnPageDropdown) {
      this.pageSizeDropdownOpen = false;
      this.pageDropdownOpen = false;
    }
    if (!target.closest('.ps-picker')) {
      this.pageSizeMenuOpen = false;
    }
    if (!target.closest('.export-menu')) {
      this.exportMenuOpen = false;
    }
    if (!target.closest('.filter-dropdown')) {
      this.filterMenu = null;
    }
    if (!target.closest('.history-filter')) {
      this.historyPanelOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.historyPanelOpen = false;
  }

  onContentScroll(): void {
    this.pageSizeDropdownOpen = false;
    this.pageDropdownOpen = false;
    this.filterMenu = null;
    this.historyPanelOpen = false;
  }

  showDialog(project?: any) {
    this.ref = this.dialogService.open(DialogContentComponent, {
      dismissableMask: true,
      closable: true,
      // The header is hidden globally (styles.css); with it rendered, PrimeNG's
      // focusOnShow recurses forever when it finds nothing to focus.
      showHeader: false,
      focusOnShow: false,
      style: { width: '720px', 'max-width': '95vw' },
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
        this.allProjects = data.sort((a, b) => a.id - b.id);
        this.historyYears = this.yearsCovered();
        // A save may have changed a status, so the past-status matches too.
        if (this.historyActive) this.loadHistory();
        else this.applyFilters();
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

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.pageSizeDropdownOpen = false;
    this.pageDropdownOpen = false;
    this.filterMenu = null;
    this.historyPanelOpen = false;
  }

  selectGroup(index: number, value: string): void {
    this.projects[index].title = value;
    this.groupDropdownOpen[index] = false;
  }

  showAdvancedFilters = false;
  globalSearchTerm = '';
  /** Describes the filters that produced `projects`, e.g. 'Search: "bechir" · Role: Lead'; '' when unfiltered. */
  activeFilter = '';
  filterValues: Record<string, string> = this.emptyFilters();

  /** Every project; `projects` is the part of it the filters let through. */
  allProjects: any[] = [];

  private emptyFilters(): Record<string, string> {
    return {
      coordinator: '', applicant: '', role: '', acronym: '', title: '', program: '', thematic: '',
      status: '', submissionDate: '', startDate: '', endDate: '', totalBudget: '', budget: '',
    };
  }

  get hasFilters(): boolean {
    return !!(this.globalSearchTerm.trim() || this.historyActive
      || Object.values(this.filterValues).some(v => String(v ?? '').trim()));
  }

  /** Clears the search box and every advanced filter. */
  resetFilters(): void {
    this.globalSearchTerm = '';
    this.filterValues = this.emptyFilters();
    this.clearHistory();
  }

  // "Historical status": the projects that held a status at any point during a
  // year, from the backend's status history, whatever their status is now.
  historyStatus = '';
  historyYear: number | null = null;
  /** What the panel shows until "Show projects" applies it. */
  draftStatus = '';
  draftYear: number | null = null;
  historyPanelOpen = false;
  historyPanelStyle: Record<string, string> = {};
  historyLoading = false;
  /** The years offered in the panel, newest first. */
  historyYears: number[] = [];
  /** Ids of the projects matching the applied status and year; null while loading. */
  private historyIds: Set<number> | null = null;
  private historyRequest?: Subscription;

  get historyActive(): boolean {
    return !!this.historyStatus && this.historyYear !== null;
  }

  /** From this year back to the earliest year any project was submitted or started. */
  private yearsCovered(): number[] {
    const now = new Date().getFullYear();
    const found = this.allProjects
      .flatMap(p => [p.startyear, p.submissionDate, p.startDate])
      .map(v => Number(String(v ?? '').match(/\d{4}/)?.[0]))
      .filter(y => y >= 1990 && y <= now);
    const years: number[] = [];
    for (let y = now; y >= Math.min(now, ...found); y--) years.push(y);
    return years;
  }

  /** Opens the panel under (or above) its button, with the applied choice, or Ongoing this year. */
  toggleHistoryPanel(event: MouseEvent): void {
    // No stopPropagation: the click must reach the document so other open dropdowns close.
    this.filterMenu = null;
    if (this.historyPanelOpen) { this.historyPanelOpen = false; return; }
    this.draftStatus = this.historyStatus
      || this.statusOptions.find(s => statusTone(s) === 'blue') || this.statusOptions[0] || '';
    this.draftYear = this.historyYear ?? this.historyYears[0] ?? new Date().getFullYear();

    // The trigger, not the button inside it, so the panel lines up with its border.
    const r = (event.currentTarget as HTMLElement).closest('.history-trigger')!.getBoundingClientRect();
    // clientWidth leaves out the scrollbar, which innerWidth counts.
    const viewport = document.documentElement.clientWidth;
    const width = Math.min(380, viewport - 32);
    const height = 430;
    const up = window.innerHeight - r.bottom < height && r.top > window.innerHeight - r.bottom;
    this.historyPanelStyle = {
      ...(up
        ? { top: 'auto', bottom: `${window.innerHeight - r.top + 6}px` }
        : { top: `${r.bottom + 6}px`, bottom: 'auto' }),
      // Right-aligned with the trigger, so it opens inward rather than off the page.
      left: `${Math.max(16, Math.min(r.right - width, viewport - width - 16))}px`,
      width: `${width}px`,
    };
    this.historyPanelOpen = true;
  }

  applyHistory(): void {
    if (!this.draftStatus || this.draftYear === null) return;
    this.historyStatus = this.draftStatus;
    this.historyYear = this.draftYear;
    this.historyPanelOpen = false;
    this.loadHistory();
  }

  clearHistory(): void {
    this.historyRequest?.unsubscribe();
    this.historyStatus = '';
    this.historyYear = null;
    this.historyIds = null;
    this.historyLoading = false;
    this.applyFilters();
  }

  /** Fetches the ids for the applied status and year, then refilters. */
  private loadHistory(): void {
    this.historyRequest?.unsubscribe();
    this.historyIds = null;
    this.historyLoading = true;
    this.applyFilters();
    this.historyRequest = this.projectService
      .getProjectIdsWithStatusInYear(this.historyStatus, this.historyYear!)
      .subscribe({
        next: ids => {
          this.historyIds = new Set(ids);
          this.historyLoading = false;
          this.applyFilters();
        },
        error: err => {
          console.error('Error fetching status history:', err);
          this.historyLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Status history', detail: 'The past statuses could not be loaded.' });
          this.clearHistory();
        },
      });
  }

  /**
   * The search box and every advanced filter at once, over the full list, as
   * on the public List of Projects page.
   */
  applyFilters(): void {
    const f = this.filterValues;
    const search = this.globalSearchTerm.trim();
    this.projects = this.allProjects.filter(project =>
      (!search || [
        project.responsable, project.applicant, project.partenaire, roleLabel(project.partenaire),
        project.thematique, project.programme, project.titreproj, project.acronyme,
        submissionDateText(project.submissionDate), submissionDateText(project.startDate), submissionDateText(project.endDate),
        project.startyear, project.endyear,
        project.totalBudget, project.budget, statusLabel(project.title),
      ].some(value => matchesSearch(value, search))) &&
      matchesSearch(project.responsable, f['coordinator']) &&
      matchesSearch(project.applicant, f['applicant']) &&
      (!f['role'] || project.partenaire === f['role']) &&
      matchesSearch(project.acronyme, f['acronym']) &&
      matchesSearch(project.titreproj, f['title']) &&
      (!f['program'] || project.programme === f['program']) &&
      matchesSearch(project.thematique, f['thematic']) &&
      (!f['status'] || project.title === f['status']) &&
      (!this.historyActive || !!this.historyIds?.has(project.id)) &&
      matchesDate(project.submissionDate, null, f['submissionDate']) &&
      matchesDate(project.startDate, project.startyear, f['startDate']) &&
      matchesDate(project.endDate, project.endyear, f['endDate']) &&
      matchesSearch(project.totalBudget, f['totalBudget']) &&
      matchesSearch(project.budget, f['budget'])
    );
    this.activeFilter = this.describeFilters();
    this.updatePage(0);
  }

  private describeFilters(): string {
    const f = this.filterValues;
    const text = (label: string, v: string) => (v?.trim() ? `${label}: "${v.trim()}"` : '');
    return [
      text('Search', this.globalSearchTerm),
      text('Coordinator', f['coordinator']),
      text('Applicant', f['applicant']),
      f['role'] ? `Role: ${roleLabel(f['role'])}` : '',
      text('Acronym', f['acronym']),
      text('Title', f['title']),
      f['program'] ? `Program: ${f['program']}` : '',
      text('Thematic', f['thematic']),
      f['status'] ? `Status: ${statusLabel(f['status'])}` : '',
      this.historyActive ? `${statusLabel(this.historyStatus)} in ${this.historyYear}` : '',
      f['submissionDate'] ? `Submitted: ${describeDateFilter(f['submissionDate'])}` : '',
      f['startDate'] ? `Starts: ${describeDateFilter(f['startDate'])}` : '',
      f['endDate'] ? `Ends: ${describeDateFilter(f['endDate'])}` : '',
      text('Total budget', f['totalBudget']),
      text('Partner budget', f['budget']),
    ].filter(Boolean).join(' · ');
  }

  // Role / Program / Status dropdowns. The menus are position: fixed, as the
  // filter panel clips anything that overflows it.
  filterMenu: 'role' | 'program' | 'status' | null = null;
  filterMenuStyle: Record<string, string> = {};

  get roleOptions(): string[] { return this.distinct(p => p.partenaire); }
  get programOptions(): string[] { return this.distinct(p => p.programme); }
  get statusOptions(): string[] { return this.projectGroupTitles.map(g => g.value); }

  private distinct(pick: (p: any) => string): string[] {
    return Array.from(new Set(this.allProjects.map(pick).filter(Boolean))).sort();
  }

  toggleFilterMenu(menu: 'role' | 'program' | 'status', event: MouseEvent): void {
    // No stopPropagation: the click must reach the document so other open dropdowns close.
    if (this.filterMenu === menu) { this.filterMenu = null; return; }
    const r = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const maxHeight = 280;
    const up = window.innerHeight - r.bottom < maxHeight && r.top > window.innerHeight - r.bottom;
    // Upward menus are anchored by their bottom edge, so a menu shorter than
    // the max still sits on the trigger.
    const room = Math.min(maxHeight, (up ? r.top : window.innerHeight - r.bottom) - 8);
    this.filterMenuStyle = {
      ...(up
        ? { top: 'auto', bottom: `${window.innerHeight - r.top + 4}px` }
        : { top: `${r.bottom + 4}px`, bottom: 'auto' }),
      left: `${r.left}px`,
      width: `${r.width}px`,
      'max-height': `${room}px`,
    };
    this.filterMenu = menu;
  }

  pickFilter(field: 'role' | 'program' | 'status', value: string): void {
    this.filterValues[field] = value;
    this.filterMenu = null;
    this.applyFilters();
  }

  exportMenuOpen = false;
  exporting: ProjectExportFormat | null = null;
  exportFormats: { format: ProjectExportFormat; label: string; icon: string }[] = [
    { format: 'xlsx', label: 'Excel (.xlsx)', icon: 'bxs-file' },
    { format: 'docx', label: 'Word (.docx)',  icon: 'bxs-file-doc' },
    { format: 'pdf',  label: 'PDF (.pdf)',    icon: 'bxs-file-pdf' },
    { format: 'txt',  label: 'Text (.txt)',   icon: 'bxs-file-txt' },
  ];

  /** Downloads exactly what the table currently shows (all pages of the filtered results). */
  async exportProjects(format: ProjectExportFormat): Promise<void> {
    if (this.exporting || !this.projects.length) return;
    this.exporting = format;
    try {
      await this.projectExportService.export(this.projects, format, this.activeFilter);
      this.exportMenuOpen = false;
    } catch (error) {
      console.error('Error exporting projects:', error);
      this.messageService.add({ severity: 'error', summary: 'Export failed', detail: 'The file could not be generated.' });
    } finally {
      this.exporting = null;
    }
  }

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

  setPageSize(size: number): void {
    this.pageSize = Number(size);
    this.updatePage(0);
  }

  get rangeStart(): number {
    return this.projects.length ? this.pageIndex * this.pageSize + 1 : 0;
  }

  get rangeEnd(): number {
    return Math.min(this.projects.length, (this.pageIndex + 1) * this.pageSize);
  }

  /** Project count per group ("SUBMITTED PROJECTS" ...), largest first. */
  get groupStats(): { name: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const p of this.projects) {
      if (p.title) counts.set(p.title, (counts.get(p.title) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  readonly roleLabel = roleLabel;
  readonly projectDate = projectDate;

  /** First budget card: the whole-project (all partners) budget of the projects the filters let through. */
  get filteredTotalBudget(): number {
    return this.sumBudget('totalBudget');
  }

  /** Second budget card: our partner share of the projects the filters let through. */
  get filteredPartnerBudget(): number {
    return this.sumBudget('budget');
  }

  private sumBudget(field: 'totalBudget' | 'budget'): number {
    return this.projects.reduce((sum, p) => sum + (Number(p[field]) || 0), 0);
  }

  /** What the budget cards add up: "All projects", "Rejected projects", "Ongoing in 2023" or "12 filtered projects". */
  get budgetScope(): string {
    if (!this.hasFilters) return 'All projects';
    if (this.historyActive && this.onlyFilter('history')) return `${statusLabel(this.historyStatus)} in ${this.historyYear}`;
    const statuses = Array.from(new Set(this.projects.map(p => p.title).filter(Boolean)));
    if (statuses.length === 1 && this.onlyFilter('status', statuses[0])) return `${statusLabel(statuses[0])} projects`;
    const n = this.projects.length;
    return `${n} filtered project${n === 1 ? '' : 's'}`;
  }

  /**
   * Whether `kind` is the only filter in use. A status may come from the
   * Current status dropdown or from a search for it ("rejected"), but not from
   * a search for something else whose matches happen to share one status.
   */
  private onlyFilter(kind: 'status' | 'history', status = ''): boolean {
    const others = Object.entries(this.filterValues)
      .some(([key, v]) => key !== 'status' && String(v ?? '').trim());
    if (others) return false;
    const search = this.globalSearchTerm.trim();
    if (kind === 'history') return !this.filterValues['status'] && !search;
    return !this.historyActive && (!search || matchesSearch(statusLabel(status), search));
  }

  /** 0 -> "€0", 850 000 -> "€850K", 1 250 000 -> "€1.25M". */
  compactEuro(value: number): string {
    if (!value) return '€0';
    if (value >= 1_000_000) return '€' + (value / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
    if (value >= 1_000) return '€' + Math.round(value / 1_000) + 'K';
    return '€' + Math.round(value);
  }

  /** "SUBMITTED PROJECTS" -> "Submitted". */
  groupLabel(title: string): string {
    return statusLabel(title);
  }

  /** Colour family for a group's pill and stat icon. */
  groupTone(title: string): string {
    return statusTone(title);
  }

  groupIcon(title: string): string {
    switch (this.groupTone(title)) {
      case 'blue':  return 'bx-time-five';
      case 'green': return 'bx-badge-check';
      case 'amber': return 'bx-send';
      case 'red':   return 'bx-x-circle';
      default:      return 'bx-folder';
    }
  }

  pagedProjectsIndex(index: number): number {
    return index + this.pageIndex * this.pageSize;
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
    this.historyRequest?.unsubscribe();
    if (this.ref) {
      this.ref.close();
    }
  }
}