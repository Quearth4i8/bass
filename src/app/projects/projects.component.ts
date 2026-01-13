import { Component, OnInit } from '@angular/core';
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
  showPassword = false;

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
        this.router.navigate(['/projectadmin']);
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
    }, 500);
  }

  filterProjects(groupTitle: string, index: number) {
    const filters = this.columnFilters[index];

    this.filteredProjectData[groupTitle] = this.projectData[groupTitle].filter((project: any) => {
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
}