import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';

import { PortalProject } from '../models/portal-project.model';
import { PortalProjectsService } from './portal-projects.service';

/**
 * Scoped to {@link PortalProjectDisplayComponent}: one shared stream per public portal visit.
 * Combines the route slug with the project store so edits in admin (same tab) refresh the view.
 * When you replace {@link PortalProjectsService} with HTTP, keep this API for child pages.
 */
@Injectable()
export class PortalProjectContextService {
  private readonly slug$ = new BehaviorSubject<string | null>(null);

  constructor(private readonly portal: PortalProjectsService) {}

  /** Current portal slug from the parent route (`portal/:slug`). */
  getActiveSlug(): string | null {
    return this.slug$.value;
  }

  setSlug(slug: string | null): void {
    const normalized = slug?.trim() ? slug.trim() : null;
    this.slug$.next(normalized);
  }

  /**
   * Full project for the active slug; re-emits when the slug changes or when portal data is persisted.
   */
  readonly project$: Observable<PortalProject | null> = combineLatest([
    this.slug$,
    this.portal.allProjects$,
  ]).pipe(
    switchMap(([slug]) => (slug ? this.portal.getBySlug(slug) : of(null))),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly projectMeta$ = this.project$.pipe(
    map((p) =>
      p
        ? {
            slug: p.slug,
            title: p.title,
            description: p.description,
            image: p.image,
            isActive: p.isActive,
            accentColor: p.accentColor,
          }
        : null,
    ),
  );
}
