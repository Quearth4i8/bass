import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { AuthService } from './AuthService';
import { matchesSearch } from '../shared/utils/text-search';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private baseUrl: string;

  constructor(private http: HttpClient, private auth: AuthService) {
    this.baseUrl = this.getBaseUrl();
  }

  private getBaseUrl(): string {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Local
      return 'http://localhost:8085/bassiana';
    } else {
      // Production
      return 'http://41.229.139.17:8080/imasservice/bassiana';
    }
  }


  getProjectsByTitreproj(title: string): Observable<any[]> {
    const params = new HttpParams().set('title_like', title);
    return this.http.get<any[]>(`${this.baseUrl}/projects`, { params }).pipe(
      map(projects => projects.filter(project => matchesSearch(project.title, title)))
    );
  }
  getProjectsByResponsable(responsable: string): Observable<any[]> {
    const params = new HttpParams().set('responsable_like', responsable);
    return this.http.get<any[]>(`${this.baseUrl}/projects`, { params }).pipe(
      map(projects => projects.filter(project => matchesSearch(project.responsable, responsable)))
    );
  }
  getProjectsByPartenaire(partenaire: string): Observable<any[]> {
    const params = new HttpParams().set('partenaire_like', partenaire);
    return this.http.get<any[]>(`${this.baseUrl}/projects`, { params }).pipe(
      map(projects => projects.filter(project => matchesSearch(project.partenaire, partenaire)))
    );
  }
  getProjectsByAcronyme(acronyme: string): Observable<any[]>{
    const params = new HttpParams().set('acronyme_like', acronyme);
    return this.http.get<any[]>(`${this.baseUrl}/projects`, { params }).pipe(
      map(projects => projects.filter(project => matchesSearch(project.acronyme, acronyme)))
    );
  }
  getProjectsByProgram(programme: string): Observable<any[]>{
    const params = new HttpParams().set('programme_like', programme);
    return this.http.get<any[]>(`${this.baseUrl}/projects`, { params }).pipe(
      map(projects => projects.filter(project => matchesSearch(project.programme, programme)))
    );
  }
  getAllProjects(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/projects`);
  }
  /** Ids of the projects that had `status` at any point during `year`, whatever their status now. */
  getProjectIdsWithStatusInYear(status: string, year: number): Observable<number[]> {
    const params = new HttpParams().set('status', status).set('year', String(year));
    return this.http.get<number[]>(`${this.baseUrl}/projects/status-history`, { params });
  }

  /** Every project's status timeline (admin only), grouped by project and in date order within each. */
  getStatusChanges(): Observable<ProjectStatusStep[]> {
    return this.http.get<ProjectStatusStep[]>(`${this.baseUrl}/projects/status-history/changes`);
  }

  private authHeaders(): { headers: HttpHeaders } {
    const token = this.auth.getToken();
    return {
      headers: token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders()
    };
  }

  updateProject(id: number, projectDetails: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/projects/${id}`, projectDetails, this.authHeaders());
  }
  createProject(projectDetails: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/projects`, projectDetails, this.authHeaders());
  }
  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${id}`, this.authHeaders());
  }
}

/**
 * One status a project took on, built from the project's status dates
 * (submissionDate, startDate for Ongoing...). It holds it from `date` until its next
 * step. `estimated` is true when the project has no date for that status and
 * `date` is a guess (Ongoing from the start date, Achieved from the end date).
 */
export interface ProjectStatusStep {
  projectId: number;
  status: string;
  date: string;
  estimated: boolean;
}
