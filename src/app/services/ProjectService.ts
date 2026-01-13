import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private baseUrl: string;

  constructor(private http: HttpClient) {
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
      map(projects => projects.filter(project => project.title.toLowerCase().includes(title.toLowerCase())))
    );
  }
  getProjectsByResponsable(responsable: string): Observable<any[]> {
    const params = new HttpParams().set('responsable_like', responsable);
    return this.http.get<any[]>(`${this.baseUrl}/projects`, { params }).pipe(
      map(projects => projects.filter(project => project.responsable.toLowerCase().includes(responsable.toLowerCase())))
    );
  }
  getProjectsByPartenaire(partenaire: string): Observable<any[]> {
    const params = new HttpParams().set('partenaire_like', partenaire);
    return this.http.get<any[]>(`${this.baseUrl}/projects`, { params }).pipe(
      map(projects => projects.filter(project => project.partenaire.toLowerCase().includes(partenaire.toLowerCase())))
    );
  }
  getProjectsByAcronyme(acronyme: string): Observable<any[]>{
    const params = new HttpParams().set('acronyme_like', acronyme);
    return this.http.get<any[]>(`${this.baseUrl}/projects`, { params }).pipe(
      map(projects => projects.filter(project => project.acronyme.toLowerCase().includes(acronyme.toLowerCase())))
    );
  }
  getProjectsByProgramme(programme: string): Observable<any[]>{
    const params = new HttpParams().set('programme_like', programme);
    return this.http.get<any[]>(`${this.baseUrl}/projects`, { params }).pipe(
      map(projects => projects.filter(project => project.programme.toLowerCase().includes(programme.toLowerCase())))
    );
  }
  getAllProjects(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/projects`);
  }
  updateProject(id: number, projectDetails: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/projects/${id}`, projectDetails);
  }
  createProject(projectDetails: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/projects`, projectDetails);
  }
  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${id}`);
  }
}
