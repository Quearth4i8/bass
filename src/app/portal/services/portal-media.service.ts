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

  uploadFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();

    const uploadUrl = `${this.auth.getApiBaseUrl()}/media/upload`;

    return this.http
      .post<{ filename: string }>(uploadUrl, formData, { headers })
      .pipe(map((res) => `${this.auth.getApiBaseUrl()}/media/${res.filename}`));
  }
}
