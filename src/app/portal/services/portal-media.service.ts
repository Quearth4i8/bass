import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../services/AuthService';

@Injectable({
  providedIn: 'root',
})
export class PortalMediaService {
  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
  ) {}

  uploadFile(file: File, projectFolder?: string): Observable<string> {
    console.log('=== UPLOAD SERVICE DEBUG ===');
    console.log('File:', file.name);
    console.log('ProjectFolder:', projectFolder);
    console.log('ProjectFolder is empty?:', !projectFolder || projectFolder.trim() === '');
    console.log('============================');

    const formData = new FormData();
    formData.append('file', file);
    if (projectFolder && projectFolder.trim()) {
      formData.append('projectFolder', projectFolder.trim());
      console.log('✓ Added projectFolder to FormData');
    } else {
      console.warn('⚠ projectFolder is empty or not provided!');
    }

    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();

    const uploadUrl = `${this.auth.getApiBaseUrl()}/media/upload`;

    return this.http
      .post<{ filename: string }>(uploadUrl, formData, { headers })
      .pipe(map((res) => `${this.auth.getApiBaseUrl()}/media/${res.filename}`));
  }

  deleteFile(projectFolder: string, filename: string): Observable<{ message: string }> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();

    const deleteUrl = `${this.auth.getApiBaseUrl()}/media/delete`;

    return this.http.delete<{ message: string }>(deleteUrl, {
      params: { projectFolder, filename },
      headers
    });
  }

  reorganizeMedia(projectFolder: string): Observable<{ message: string; filesMoved: number; details: string[] }> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();

    const reorganizeUrl = `${this.auth.getApiBaseUrl()}/media/reorganize`;

    return this.http.post<{ message: string; filesMoved: number; details: string[] }>(
      reorganizeUrl,
      null,
      { params: { projectFolder }, headers }
    );
  }
}
