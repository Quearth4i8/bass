import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthService } from './AuthService';

@Injectable({
  providedIn: 'root'
})
export class ProjectGroupService {

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

  getProjectGroups(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/projectgroups`);
  }
  getProjectGroupTitles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/projectgroups/titles`);
  }

  private authHeaders(): { headers: HttpHeaders } {
    const token = this.auth.getToken();
    return {
      headers: token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders()
    };
  }

  createProjectGroup(projectGroup: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/projectgroups`, projectGroup, this.authHeaders());
  }
  deleteProjectGroupByTitle(title: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/projectgroups/title/${title}`, this.authHeaders());
  }
  updateProjectGroupByTitle(title: string, projectGroupDetails: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/projectgroups/title/${title}`, projectGroupDetails, this.authHeaders());
  }
}
