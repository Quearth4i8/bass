import { Component, OnInit, HostBinding, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/AuthService';
import { ProjectGroupService } from '../services/ProjectGroupService';
import { ProjectService } from '../services/ProjectService';
import { ThemeService } from '../services/ThemeService';
import { matchesSearch, normalizeSearch } from '../shared/utils/text-search';

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
  stats = { total: 0, programmes: 0, topProgrammes: '', firstYear: 0, lastYear: 0, budget: 0 };

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
      this.projectGroups = data;
      this.columnFilters = new Array(this.projectGroups.length).fill(null).map(() => ({
        responsable: '',
        partenaire: '',
        thematique: '',
        programme: '',
        titreproj: '',
        acronyme: '',
        startyear: '',
        endyear: '',
        budget: ''
      }));
      // Initialize dropdown state arrays
      this.partnerDropdownOpen = new Array(this.projectGroups.length).fill(false);
      this.programmeDropdownOpen = new Array(this.projectGroups.length).fill(false);
      this.showFilters = new Array(this.projectGroups.length).fill(false);
      this.projectGroups.forEach(group => {
        this.loadProjects(group.title);
      });
    });
  }

  loadProjects(title: string) {
    this.projectService.getProjectsByTitreproj(title).subscribe((data: any[]) => {
      this.projectData[title] = data;
      this.filteredProjectData[title] = [...data];
      this.computeStats();
    });
  }

  /** Re-run as each category arrives; the strip fills in as the data does. */
  private computeStats(): void {
    const all = Object.values(this.projectData).flat();
    const programmeCounts = new Map<string, number>();
    const years: number[] = [];
    let budget = 0;
    for (const p of all) {
      const prog = (p.programme || '').trim();
      if (prog && prog.toUpperCase() !== 'NA') {
        programmeCounts.set(prog, (programmeCounts.get(prog) || 0) + 1);
      }
      for (const y of [p.startyear, p.endyear]) {
        const n = Number(y);
        if (n > 1900 && n < 2200) years.push(n);
      }
      const b = Number(p.budget);
      if (Number.isFinite(b)) budget += b;
    }
    const top = [...programmeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
    this.stats = {
      total: all.length,
      programmes: programmeCounts.size,
      topProgrammes: top.join(' · '),
      firstYear: years.length ? Math.min(...years) : 0,
      lastYear: years.length ? Math.max(...years) : 0,
      budget: budget / 1_000_000,
    };
  }

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
          project.responsable, project.partenaire, project.thematique, project.programme,
          project.titreproj, project.acronyme, project.startyear, project.endyear, project.budget,
        ].some(value => matchesSearch(value, filters.general));
        if (!matchesGeneral) return false;
      }

      return (
        matchesSearch(project.responsable, filters.responsable) &&
        (!filters.partenaire || project.partenaire === filters.partenaire) &&
        matchesSearch(project.thematique, filters.thematique) &&
        (!filters.programme || project.programme === filters.programme) &&
        matchesSearch(project.titreproj, filters.titreproj) &&
        matchesSearch(project.acronyme, filters.acronyme) &&
        matchesSearch(project.startyear, filters.startyear) &&
        matchesSearch(project.endyear, filters.endyear) &&
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
  }

  getTabIcon(title: string): string {
    const icons: { [key: string]: string } = {
      'ACHIEVED PROJECTS':  'bx-badge-check',
      'SUBMITTED PROJECTS': 'bx-send',
      'ONGOING PROJECTS':   'bx-time-five',
    };
    return icons[title] || 'bx-folder';
  }

  resetFilters(index: number, title: string): void {
    this.columnFilters[index] = {
      responsable: '',
      partenaire: '',
      thematique: '',
      programme: '',
      titreproj: '',
      acronyme: '',
      startyear: '',
      endyear: '',
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
