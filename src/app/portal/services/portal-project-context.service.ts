import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, switchMap, tap } from 'rxjs/operators';

import { PortalProject } from '../models/portal-project.model';
import { PortalProjectsService } from './portal-projects.service';

/**
 * `idle`    - no slug on the route yet.
 * `loading` - a lookup for the active slug is in flight.
 * `ready`   - that lookup returned a project.
 * `missing` - that lookup *finished* and returned nothing.
 *
 * The distinction that matters is `loading` vs `missing`: a view that treats
 * "no project yet" as "no such project" shows its not-found screen for the
 * whole of every page load.
 */
export type PortalLookupState = 'idle' | 'loading' | 'ready' | 'missing';

/**
 * Scoped to {@link PortalProjectDisplayComponent}: one shared stream per public portal visit.
 * Combines the route slug with the project store so edits in admin (same tab) refresh the view.
 * When you replace {@link PortalProjectsService} with HTTP, keep this API for child pages.
 */
@Injectable()
export class PortalProjectContextService {
  private readonly slug$ = new BehaviorSubject<string | null>(null);

  private readonly lookupState = new BehaviorSubject<PortalLookupState>('idle');

  /** Where the lookup for the active slug has got to. */
  readonly lookupState$: Observable<PortalLookupState> =
    this.lookupState.asObservable().pipe(distinctUntilChanged());

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
    // Back to `loading` on every re-run: the store emitting again restarts the
    // lookup, and until that one settles we know nothing about the slug.
    tap(([slug]) => this.lookupState.next(slug ? 'loading' : 'idle')),
    switchMap(([slug]) => (slug ? this.portal.getBySlug(slug) : of(null))),
    // Only here - after a lookup has actually resolved - can a missing project
    // be called missing. Deliberately emits nothing while the request is in
    // flight, because the portal pages take their own `loading` flag from the
    // first value this stream gives them.
    tap((project) => {
      if (this.slug$.value) this.lookupState.next(project ? 'ready' : 'missing');
    }),
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
            logo: p.logo,
            brandMode: p.brandMode,
          }
        : null,
    ),
  );
}
