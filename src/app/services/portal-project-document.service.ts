import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './AuthService';

export interface ProjectDocument {
  id: number;
  projectSlug: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  category: 'pdf' | 'word' | 'excel' | 'image' | 'other';
  subfolder: string | null;
}

export interface ProjectStats {
  fileCount: number;
  totalSize: number;
}

export interface ProjectFolder {
  id: number;
  name: string;
  fileCount: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PortalProjectDocumentService {

  constructor(private http: HttpClient, private authService: AuthService) {}

  private base(slug: string): string {
    return `${this.authService.getApiBaseUrl()}/portal-projects/${slug}/documents`;
  }

  private folderBase(slug: string): string {
    return `${this.authService.getApiBaseUrl()}/portal-projects/${slug}/folders`;
  }

  // ── Documents ──────────────────────────────────────────────────────────────

  upload(slug: string, file: File, subfolder?: string): Observable<ProjectDocument> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    let params = new HttpParams();
    if (subfolder) params = params.set('subfolder', subfolder);
    return this.http.post<ProjectDocument>(this.base(slug), fd, { params });
  }

  list(slug: string, category?: string, subfolder?: string): Observable<ProjectDocument[]> {
    let params = new HttpParams();
    if (category && category !== 'all') params = params.set('category', category);
    if (subfolder !== undefined && subfolder !== null) params = params.set('subfolder', subfolder);
    return this.http.get<ProjectDocument[]>(this.base(slug), { params });
  }

  stats(slug: string): Observable<ProjectStats> {
    return this.http.get<ProjectStats>(`${this.base(slug)}/stats`);
  }

  delete(slug: string, id: number): Observable<void> {
    const url   = `${this.base(slug)}/${id}`;
    const token = this.authService.getToken();
    return new Observable<void>(observer => {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      fetch(url, { method: 'DELETE', headers })
        .then(r => { if (!r.ok && r.status !== 204) throw new Error(`HTTP ${r.status}`); observer.next(); observer.complete(); })
        .catch(err => observer.error(err));
    });
  }

  downloadUrl(slug: string, id: number): string { return `${this.base(slug)}/${id}/download`; }
  previewUrl (slug: string, id: number): string { return `${this.base(slug)}/${id}/preview`; }

  previewText(slug: string, id: number): Observable<string> {
    return this.fetchAs<string>(this.base(slug) + `/${id}/download`, 'text');
  }

  previewArrayBuffer(slug: string, id: number): Observable<ArrayBuffer> {
    return this.fetchAs<ArrayBuffer>(this.base(slug) + `/${id}/download`, 'arrayBuffer');
  }

  previewBlob(slug: string, id: number): Observable<Blob> {
    return this.fetchAs<Blob>(this.base(slug) + `/${id}/download`, 'blob');
  }

  // ── Folders ────────────────────────────────────────────────────────────────

  listFolders(slug: string): Observable<ProjectFolder[]> {
    return this.http.get<ProjectFolder[]>(this.folderBase(slug));
  }

  createFolder(slug: string, name: string): Observable<ProjectFolder> {
    return this.http.post<ProjectFolder>(this.folderBase(slug), { name });
  }

  deleteFolder(slug: string, id: number): Observable<void> {
    const url   = `${this.folderBase(slug)}/${id}`;
    const token = this.authService.getToken();
    return new Observable<void>(observer => {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      fetch(url, { method: 'DELETE', headers })
        .then(r => { if (!r.ok && r.status !== 204) throw new Error(`HTTP ${r.status}`); observer.next(); observer.complete(); })
        .catch(err => observer.error(err));
    });
  }

  // ── Shared fetch helper (bypasses IDM via native fetch) ───────────────────

  private fetchAs<T>(url: string, type: 'text' | 'blob' | 'arrayBuffer'): Observable<T> {
    const token = this.authService.getToken();
    return new Observable<T>(observer => {
      const headers: Record<string, string> = { 'Accept': '*/*' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      fetch(url, { headers })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return (r as any)[type](); })
        .then((v: T) => { observer.next(v); observer.complete(); })
        .catch((err: any) => observer.error(err));
    });
  }
}
