import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/AuthService';
import { ProjectGroupService } from '../services/ProjectGroupService';
import { ProjectService } from '../services/ProjectService';

@Component({
  selector: 'app-projects',
  templateUrl: 'projects.component.html',
  styleUrls: ['projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  username: string = '';
  password: string = '';
  error: string = '';
  showForm: boolean = true;
  fadeOut: boolean = false;
  contentFadeIn: boolean = false;
  showPassword = false;

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

  constructor(
    private authService: AuthService,
    private projectGroupService: ProjectGroupService,
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProjectGroups();
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
    });
  }

  login(event: Event): void {
    event.preventDefault();

    if (this.authService.login(this.username, this.password)) {
      if (this.authService.isAdmin()) {
        this.fadeOut = true;
        setTimeout(() => {
          this.router.navigate(['/projectadmin'], { replaceUrl: true });
        }, 350);
      } else if (this.authService.isUser()) {
        this.hideLoginForm();
      }
    } else {
      this.error = 'Invalid username or password';
    }
  }

  hideLoginForm(): void {
    this.fadeOut = true;
    setTimeout(() => {
      this.showForm = false;
      this.contentFadeIn = true;
    }, 500);
    setTimeout(() => {
      this.contentFadeIn = false;
    }, 900);
  }

  filterProjects(groupTitle: string, index: number) {
    const filters = this.columnFilters[index];

    this.filteredProjectData[groupTitle] = this.projectData[groupTitle].filter((project: any) => {
      // General search across all fields
      if (filters.general) {
        const searchTerm = filters.general.toLowerCase();
        const matchesGeneral =
          project.responsable?.toLowerCase().includes(searchTerm) ||
          project.partenaire?.toLowerCase().includes(searchTerm) ||
          project.thematique?.toLowerCase().includes(searchTerm) ||
          project.programme?.toLowerCase().includes(searchTerm) ||
          project.titreproj?.toLowerCase().includes(searchTerm) ||
          project.acronyme?.toLowerCase().includes(searchTerm) ||
          project.startyear?.toString().includes(searchTerm) ||
          project.endyear?.toString().includes(searchTerm) ||
          project.budget?.toString().includes(searchTerm);
        if (!matchesGeneral) return false;
      }

      return (
        (!filters.responsable || project.responsable?.toLowerCase().includes(filters.responsable.toLowerCase())) &&
        (!filters.partenaire || project.partenaire === filters.partenaire) &&
        (!filters.thematique || project.thematique?.toLowerCase().includes(filters.thematique.toLowerCase())) &&
        (!filters.programme || project.programme === filters.programme) &&
        (!filters.titreproj || project.titreproj?.toLowerCase().includes(filters.titreproj.toLowerCase())) &&
        (!filters.acronyme || project.acronyme?.toLowerCase().includes(filters.acronyme.toLowerCase())) &&
        (!filters.startyear || project.startyear?.toString().includes(filters.startyear)) &&
        (!filters.endyear || project.endyear?.toString().includes(filters.endyear)) &&
        (!filters.budget || project.budget?.toString().includes(filters.budget))
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
      'ACHIEVED PROJECTS': '✓',
      'SUBMITTED PROJECTS': '📤',
      'ONGOING PROJECTS': '🔄'
    };
    return icons[title] || '📋';
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    // Check if click is outside dropdowns
    if (!target.closest('.custom-dropdown')) {
      // Close all dropdowns
      this.partnerDropdownOpen = this.partnerDropdownOpen.map(() => false);
      this.programmeDropdownOpen = this.programmeDropdownOpen.map(() => false);
    }
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    // Close all dropdowns on scroll
    this.partnerDropdownOpen = this.partnerDropdownOpen.map(() => false);
    this.programmeDropdownOpen = this.programmeDropdownOpen.map(() => false);
  }
}