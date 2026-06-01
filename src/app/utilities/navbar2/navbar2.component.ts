import { Component, DestroyRef, HostListener, Input, OnInit, Optional } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { PortalProjectContextService } from '../../portal/services/portal-project-context.service';
import { PORTAL_TOP_NAV_LINKS } from '../../portal/portal-top-nav-links';

@Component({
  selector: 'app-navbar2',
  templateUrl: './navbar2.component.html',
  styleUrls: ['./navbar2.component.scss'],
})
export class Navbar2Component implements OnInit {
  /** When true, always show the classic IMAS static bar (e.g. portal not-found). */
  @Input() forceLegacyNav = false;

  isSticky = true;

  portalMode = false;
  portalSlug = '';
  portalTitle = '';
  private lastPortalSlug = '';

  readonly portalLinks = PORTAL_TOP_NAV_LINKS;

  constructor(
    private readonly router: Router,
    private readonly destroyRef: DestroyRef,
    @Optional() private readonly portalContext: PortalProjectContextService | null,
  ) {
    this.applyUrl(this.router.url);

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => this.applyUrl(e.urlAfterRedirects));

    if (this.portalContext) {
      this.portalContext.projectMeta$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((meta) => {
          if (meta?.title && (!this.portalSlug || meta.slug === this.portalSlug)) {
            this.portalTitle = meta.title;
          }
        });
    }
  }

  ngOnInit(): void {}

  private applyUrl(rawUrl: string): void {
    if (this.forceLegacyNav) {
      this.portalMode = false;
      this.portalSlug = '';
      return;
    }
    const path = rawUrl.split('?')[0];
    const m = path.match(/^\/portal\/([^/]+)/);
    this.portalMode = !!m;
    const nextSlug = m?.[1] ?? '';
    if (this.portalMode) {
      this.portalSlug = nextSlug;
      if (nextSlug !== this.lastPortalSlug) {
        this.lastPortalSlug = nextSlug;
        this.portalTitle = this.titleFromSlug(this.portalSlug);
      }
    } else {
      this.lastPortalSlug = '';
      this.portalSlug = '';
    }
  }

  private titleFromSlug(slug: string): string {
    if (!slug) return 'Portal';
    return slug
      .split(/[-_]+/)
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join(' ');
  }

  portalLink(path: string): string[] {
    return ['/portal', this.portalSlug, path];
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(_event: Event): void {
    this.isSticky = true;
  }
}
