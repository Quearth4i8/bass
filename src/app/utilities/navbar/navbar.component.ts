import { Component, DestroyRef, HostListener, OnInit, Optional } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { PortalProjectContextService } from '../../portal/services/portal-project-context.service';
import { PORTAL_TOP_NAV_LINKS } from '../../portal/portal-top-nav-links';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  readonly portalTopNavLinks = PORTAL_TOP_NAV_LINKS;

  isSticky: boolean = true;
  isMenuOpen: boolean = false;
  openDropdown: string | null = null;
  isHomePage: boolean = false;

  /** Any public portal route (`/portal/:slug/...`). */
  portalMode = false;
  portalSlug = '';
  portalTitle = '';

  private lastPortalSlug = '';

  constructor(
    private router: Router,
    private destroyRef: DestroyRef,
    @Optional() private portalContext: PortalProjectContextService | null,
  ) {
    this.applyUrl(this.router.url);
    this.syncHomePageFlag(this.router.url);
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => {
        this.applyUrl(e.urlAfterRedirects);
        this.syncHomePageFlag(e.urlAfterRedirects);
      });

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

  ngOnInit(): void {
    this.isSticky = true;
  }

  private syncHomePageFlag(rawUrl: string): void {
    const path = (rawUrl.split('?')[0].replace(/\/+$/, '') || '/') as string;
    this.isHomePage =
      path === '/' ||
      /^\/portal\/[^/]+$/.test(path) ||
      /^\/portal\/[^/]+\/home$/.test(path);
  }

  private applyUrl(rawUrl: string): void {
    const path = (rawUrl.split('?')[0].replace(/\/+$/, '') || '/') as string;
    const mPortal = path.match(/^\/portal\/([^/]+)(?:\/.*)?$/);
    this.portalMode = !!mPortal;
    const nextSlug = mPortal?.[1] ?? '';
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

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (!this.isMenuOpen) {
      this.openDropdown = null;
    }
  }

  toggleDropdown(key: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.openDropdown = this.openDropdown === key ? null : key;
  }
}
