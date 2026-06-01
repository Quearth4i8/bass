import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import {
  PortalProject,
  PortalProjectContent,
  PortalProjectMeta,
  PortalProjectSlug,
} from '../models/portal-project.model';

import { AuthService } from '../../services/AuthService';

const DEFAULT_PORTAL_ACCENT = '#1a5f7a';

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function normalizeHexColor(value: string | undefined, fallback: string): string {
  const v = value?.trim();
  if (v && /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(v)) {
    return v.length === 4 ? expandShortHex(v) : v;
  }
  return fallback;
}

function expandShortHex(hex: string): string {
  const h = hex.slice(1);
  if (h.length !== 3) return hex;
  return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
}

function normalizeProject(p: PortalProject): PortalProject {
  return {
    ...p,
    accentColor: normalizeHexColor(p.accentColor, DEFAULT_PORTAL_ACCENT),
  };
}

@Injectable({
  providedIn: 'root',
})
export class PortalProjectsService {
  private readonly projects$ = new BehaviorSubject<PortalProject[]>([]);
  private readonly baseUrl: string;

  readonly allProjects$: Observable<PortalProject[]> = this.projects$.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
  ) {
    this.baseUrl = this.auth.getApiBaseUrl();
    this.refresh().subscribe();
  }

  list(): Observable<PortalProjectMeta[]> {
    return this.allProjects$.pipe(
      map((projects) => projects.map(({ content: _content, ...meta }) => meta)),
    );
  }

  listFull(): Observable<PortalProject[]> {
    return this.allProjects$.pipe(map((projects) => clone(projects)));
  }

  getBySlug(slug: PortalProjectSlug): Observable<PortalProject | null> {
    const existing = this.projects$.value.find((p) => p.slug === slug);
    if (existing?.content) {
      return of(clone(normalizeProject(existing)));
    }
    return this.http.get<PortalProject>(`${this.baseUrl}/portal-projects/${encodeURIComponent(slug)}`).pipe(
      map((p) => normalizeProject(p)),
      tap((p) => this.upsertInStore(p)),
      map((p) => clone(p)),
      catchError(() => of(null)),
    );
  }

  create(meta: Omit<PortalProjectMeta, 'slug'> & { slug?: string }): Observable<PortalProject> {
    return this.http.post<PortalProject>(`${this.baseUrl}/portal-projects`, meta).pipe(
      map((p) => normalizeProject(p)),
      tap((p) => this.upsertInStore(p, { preferFront: true })),
      map((p) => clone(p)),
    );
  }

  updateMeta(slug: PortalProjectSlug, patch: Partial<Omit<PortalProjectMeta, 'slug'>>): Observable<PortalProject | null> {
    return this.http.put<PortalProject>(`${this.baseUrl}/portal-projects/${encodeURIComponent(slug)}/meta`, patch).pipe(
      map((p) => normalizeProject(p)),
      tap((p) => this.upsertInStore(p)),
      map((p) => clone(p)),
      catchError(() => of(null)),
    );
  }

  saveContent(slug: PortalProjectSlug, content: PortalProjectContent): Observable<PortalProject | null> {
    return this.http.put<PortalProject>(`${this.baseUrl}/portal-projects/${encodeURIComponent(slug)}/content`, content).pipe(
      map((p) => normalizeProject(p)),
      tap((p) => this.upsertInStore(p)),
      map((p) => clone(p)),
      catchError(() => of(null)),
    );
  }

  delete(slug: PortalProjectSlug): Observable<boolean> {
    return this.http.delete<void>(`${this.baseUrl}/portal-projects/${encodeURIComponent(slug)}`, { observe: 'response' }).pipe(
      map((res) => res.status === 204),
      tap((deleted) => {
        if (!deleted) return;
        this.projects$.next(this.projects$.value.filter((p) => p.slug !== slug));
      }),
      catchError(() => of(false)),
    );
  }

  private refresh(): Observable<PortalProject[]> {
    return this.http.get<PortalProject[]>(`${this.baseUrl}/portal-projects`).pipe(
      map((projects) => projects.map((p) => normalizeProject(p))),
      tap((projects) => this.projects$.next(projects)),
      catchError(() => {
        this.projects$.next([]);
        return of([]);
      }),
    );
  }

  /** Update display order in the local store synchronously (no HTTP). */
  reorderInStore(updates: { slug: PortalProjectSlug; order: number }[]): void {
    const current = this.projects$.value;
    const next = current.map((p) => {
      const u = updates.find((x) => x.slug === p.slug);
      return u ? { ...p, order: u.order } : p;
    });
    this.projects$.next(next);
  }

  private upsertInStore(project: PortalProject, opts?: { preferFront?: boolean }): void {
    const normalized = normalizeProject(project);
    const current = this.projects$.value;
    const idx = current.findIndex((p) => p.slug === normalized.slug);
    if (idx < 0) {
      this.projects$.next(opts?.preferFront ? [normalized, ...current] : [...current, normalized]);
      return;
    }
    const next = [...current];
    // Preserve order from the existing entry when the API response omits it.
    next[idx] = { ...normalized, order: normalized.order ?? current[idx].order };
    this.projects$.next(next);
  }
}

