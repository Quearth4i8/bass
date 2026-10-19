import { isRejectedStatus, roleLabel, statusLabel } from '../utilities/project-labels';
import { Component, OnInit, HostBinding, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/AuthService';
import { ProjectGroupService } from '../services/ProjectGroupService';
import { ProjectService } from '../services/ProjectService';
import { ThemeService } from '../services/ThemeService';
import { matchesSearch, normalizeSearch } from '../shared/utils/text-search';

/** Key of the synthetic first tab that lists every category together. */
const TOTAL_KEY = 'TOTAL PROJECTS';

/** Tab order after Total; any status not listed here goes last. */
const STATUS_ORDER = ['SUBMITTED', 'REJECTED', 'ONGOING', 'ACHIEVED'];

function statusRank(title: string): number {
  const t = (title || '').toUpperCase();
  const i = STATUS_ORDER.findIndex(s => t.includes(s));
  return i === -1 ? STATUS_ORDER.length : i;
}

@Component({
  selector: 'app-projects',
  templateUrl: 'projects.component.html',
  styleUrls: ['projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  @HostBinding('class.theme-light') get isLight() { return this.themeService.isLight; }
  username: string = '';
  password: string = '';
  error: string = '';
  showAdminLogin: boolean = false;
  fadeOut: boolean = false;
  contentFadeIn: boolean = false;
  showPassword = false;
  isAdminLoggedIn: boolean = false;
  adminUsername: string = '';

  selectedProject: any = null;

  activeTab: number = 0;
  showFilters: boolean[] = [];
  partnerDropdownOpen: boolean[] = [];
  programmeDropdownOpen: boolean[] = [];
  partnerMenuStyle: { [key: string]: string }[] = [];
  programmeMenuStyle: { [key: string]: string }[] = [];

  projectGroups: any[] = [];
  projectData: { [key: string]: any[] } = {};
  filteredProjectData: { [key: string]: any[] } = {};
  columnFilters: any[] = [];
  panelOpenState = false;

  /** Headline numbers for the stats strip, across every category. */
  stats = { total: 0, firstYear: 0, lastYear: 0, totalBudget: 0, budget: 0 };

  constructor(
    private authService: AuthService,
    private projectGroupService: ProjectGroupService,
    private projectService: ProjectService,
    private router: Router,
    public themeService: ThemeService
  ) {}

  ngOnInit() {
    this.loadProjectGroups();
    this.checkAdminSession();
  }

  private checkAdminSession(): void {
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      this.isAdminLoggedIn = true;
      this.adminUsername = this.authService.getUsername();
      this.showAdminLogin = false;
    }
  }

  loadProjectGroups() {
    this.projectGroupService.getProjectGroups().subscribe((data: any[]) => {
      const groups = [...data].sort((a: any, b: any) => statusRank(a.title) - statusRank(b.title));
      this.projectGroups = [{ title: TOTAL_KEY }, ...groups];
      this.columnFilters = new Array(this.projectGroups.length).fill(null).map(() => ({
        responsable: '',
        applicant: '',
        partenaire: '',
        thematique: '',
        programme: '',
        titreproj: '',
        acronyme: '',
        startyear: '',
        endyear: '',
        totalBudget: '',
        budget: ''
      }));
      // Initialize dropdown state arrays
      this.partnerDropdownOpen = new Array(this.projectGroups.length).fill(false);
      this.programmeDropdownOpen = new Array(this.projectGroups.length).fill(false);
      this.showFilters = new Array(this.projectGroups.length).fill(false);
      groups.forEach((group: any) => {
        this.loadProjects(group.title);
      });
    });
  }

  loadProjects(title: string) {
    this.projectService.getProjectsByTitreproj(title).subscribe((data: any[]) => {
      this.projectData[title] = data;
      this.filteredProjectData[title] = [...data];
      this.rebuildTotal();
      this.computeStats();
    });
  }

  /** The Total tab is every category's rows together, refreshed as each one arrives. */
  private rebuildTotal(): void {
    this.projectData[TOTAL_KEY] = this.projectGroups
      .filter(g => g.title !== TOTAL_KEY)
      .flatMap(g => this.projectData[g.title] || []);
    this.filterProjects(TOTAL_KEY, 0);
  }

  /**
   * Stats for the selected tab. Re-run as each category arrives (the strip
   * fills in as the data does) and whenever the tab changes.
   */
  private computeStats(): void {
    const title = this.activeGroupTitle;
    const all = this.projectData[title] || [];
    // On Total, Rejected projects count as projects but never ran, so they add
    // no years; and the budgets are Ongoing projects' only, as on the home page.
    // Each status tab shows its own figures as they are.
    const isTotal = this.isTotalTab(title);
    const years: number[] = [];
    let totalBudget = 0;
    let budget = 0;
    for (const p of all) {
      if (isTotal && isRejectedStatus(p.title)) continue;
      for (const y of [p.startyear, p.endyear]) {
        const n = Number(y);
        if (n > 1900 && n < 2200) years.push(n);
      }
      if (isTotal && !/ONGOING/i.test(p.title)) continue;
      const t = Number(p.totalBudget);
      if (Number.isFinite(t)) totalBudget += t;
      const b = Number(p.budget);
      if (Number.isFinite(b)) budget += b;
    }
    this.stats = {
      total: all.length,
      firstYear: years.length ? Math.min(...years) : 0,
      lastYear: years.length ? Math.max(...years) : 0,
      totalBudget: totalBudget / 1_000_000,
      budget: budget / 1_000_000,
    };
  }

  readonly roleLabel = roleLabel;
  readonly statusLabel = statusLabel;

  isTotalTab(title: string): boolean { return title === TOTAL_KEY; }

  /** "ACHIEVED PROJECTS" -> "Achieved": the heading already says Projects. */
  tabLabel(title: string): string {
    const word = (title || '').replace(/\s*PROJECTS?\s*$/i, '').trim().toLowerCase();
    return word ? word.charAt(0).toUpperCase() + word.slice(1) : title;
  }

  toggleAdminLogin(): void {
    this.showAdminLogin = !this.showAdminLogin;
    this.error = '';
  }

  continueToAdmin(): void {
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      this.router.navigate(['/projectadmin']);
    }
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
          this.adminUsername = this.authService.getUsername();
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

  adminLogout(): void {
    this.authService.logout();
    this.isAdminLoggedIn = false;
    this.adminUsername = '';
  }

  filterProjects(groupTitle: string, index: number) {
    const filters = this.columnFilters[index];

    this.filteredProjectData[groupTitle] = this.projectData[groupTitle].filter((project: any) => {
      // General search across all fields
      if (normalizeSearch(filters.general)) {
        const matchesGeneral = [
          project.responsable, project.applicant, project.partenaire, project.thematique, project.programme,
          project.titreproj, project.acronyme, project.startyear, project.endyear,
          project.totalBudget, project.budget,
        ].some(value => matchesSearch(value, filters.general));
        if (!matchesGeneral) return false;
      }

      return (
        matchesSearch(project.responsable, filters.responsable) &&
        matchesSearch(project.applicant, filters.applicant) &&
        (!filters.partenaire || project.partenaire === filters.partenaire) &&
        matchesSearch(project.thematique, filters.thematique) &&
        (!filters.programme || project.programme === filters.programme) &&
        matchesSearch(project.titreproj, filters.titreproj) &&
        matchesSearch(project.acronyme, filters.acronyme) &&
        matchesSearch(project.startyear, filters.startyear) &&
        matchesSearch(project.endyear, filters.endyear) &&
        matchesSearch(project.totalBudget, filters.totalBudget) &&
        matchesSearch(project.budget, filters.budget)
      );
    });
  }

  getUniquePrograms(groupTitle: string): string[] {
    if (!this.projectData[groupTitle]) return [];
    const programs = this.projectData[groupTitle].map(project => project.programme).filter(Boolean);
    return Array.from(new Set(programs)).sort();
  }

  getUniquePartners(groupTitle: string): string[] {
    if (!this.projectData[groupTitle]) return [];
    const partners = this.projectData[groupTitle].map(project => project.partenaire).filter(Boolean);
    return Array.from(new Set(partners)).sort();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  setActiveTab(index: number): void {
    this.activeTab = index;
    this.computeStats();
  }

  get activeGroupTitle(): string {
    return this.projectGroups[this.activeTab]?.title ?? TOTAL_KEY;
  }

  getTabIcon(title: string): string {
    const icons: { [key: string]: string } = {
      'ACHIEVED PROJECTS':  'bx-badge-check',
      'SUBMITTED PROJECTS': 'bx-send',
      'REJECTED PROJECTS':  'bx-x-circle',
      'ONGOING PROJECTS':   'bx-time-five',
      [TOTAL_KEY]:          'bx-layer',
    };
    return icons[title] || 'bx-folder';
  }

  resetFilters(index: number, title: string): void {
    this.columnFilters[index] = {
      responsable: '',
      applicant: '',
      partenaire: '',
      thematique: '',
      programme: '',
      titreproj: '',
      acronyme: '',
      startyear: '',
      endyear: '',
      totalBudget: '',
      budget: ''
    };
    this.filterProjects(title, index);
  }

  toggleDropdown(index: number, field: string, event?: MouseEvent): void {
    if (field === 'partner') {
      this.partnerDropdownOpen[index] = !this.partnerDropdownOpen[index];
      this.programmeDropdownOpen[index] = false;
      if (this.partnerDropdownOpen[index] && event) {
        this.partnerMenuStyle[index] = this.computeMenuStyle(event);
      }
    } else if (field === 'programme') {
      this.programmeDropdownOpen[index] = !this.programmeDropdownOpen[index];
      this.partnerDropdownOpen[index] = false;
      if (this.programmeDropdownOpen[index] && event) {
        this.programmeMenuStyle[index] = this.computeMenuStyle(event);
      }
    }
  }

  private computeMenuStyle(event: MouseEvent): { [key: string]: string } {
    const trigger = event.currentTarget as HTMLElement;
    if (!trigger) return {};
    
    const rect = trigger.getBoundingClientRect();
    const menuMaxHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Check if we should open upward
    const shouldOpenUp = spaceBelow < menuMaxHeight && spaceAbove > spaceBelow;
    const top = shouldOpenUp 
      ? Math.max(0, rect.top - menuMaxHeight - 4)
      : rect.bottom + 4;
    
    return {
      top: `${top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
    };
  }

  isDropdownOpen(index: number, field: string): boolean {
    if (field === 'partner') {
      return !!this.partnerDropdownOpen[index];
    } else if (field === 'programme') {
      return !!this.programmeDropdownOpen[index];
    }
    return false;
  }

  selectOption(index: number, field: string, value: string, title: string): void {
    this.columnFilters[index][field] = value;
    this.filterProjects(title, index);
    // Close all dropdowns
    this.partnerDropdownOpen[index] = false;
    this.programmeDropdownOpen[index] = false;
  }

  openDetail(project: any): void  { this.selectedProject = project; }
  closeDetail(): void              { this.selectedProject = null; }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.selectedProject = null; }

  getProgressPct(start: any, end: any): number {
    const s = Number(start), e = Number(end), now = new Date().getFullYear();
    if (!s || !e || e <= s) return 100;
    if (now <= s) return 0;
    if (now >= e) return 100;
    return Math.round(((now - s) / (e - s)) * 100);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    // Close filter dropdowns
    if (!target.closest('.custom-dropdown')) {
      this.partnerDropdownOpen = this.partnerDropdownOpen.map(() => false);
      this.programmeDropdownOpen = this.programmeDropdownOpen.map(() => false);
    }
    // Close admin login dropdown
    if (!target.closest('.admin-area')) {
      this.showAdminLogin = false;
    }
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(_event: Event): void {
    // Close all dropdowns on scroll
    this.partnerDropdownOpen = this.partnerDropdownOpen.map(() => false);
    this.programmeDropdownOpen = this.programmeDropdownOpen.map(() => false);
  }
}
