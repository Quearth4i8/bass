import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, distinctUntilChanged } from 'rxjs/operators';

import { PortalProjectContextService } from '../portal/services/portal-project-context.service';
import { PortalProjectMeta } from '../portal/models/portal-project.model';

@Component({
  selector: 'app-portal-project-display',
  templateUrl: './portal-project-display.component.html',
  styleUrls: ['./portal-project-display.component.scss'],
  providers: [PortalProjectContextService],
})
export class PortalProjectDisplayComponent implements OnInit {
  project: PortalProjectMeta | null = null;
  slug = '';
  notFound = false;
  isMobileNavOpen = false;

  /** `app-navbar` (transparent → sticky) only on portal home; inner pages use `app-navbar2`. */
  showPortalPublicHomeNav = false;

  navLinks = [
    { path: 'home', label: 'Home', icon: 'bx-home-alt' },
    { path: 'scientific-merit', label: 'Scientific Merit', icon: 'bx-analyse' },
    { path: 'objectives', label: 'Objectives', icon: 'bx-target-lock' },
    { path: 'partners-funders', label: 'Partners & Funders', icon: 'bx-building-house' },
    { path: 'gallery', label: 'Gallery', icon: 'bx-images' },
    { path: 'events', label: 'Events', icon: 'bx-calendar' },
    { path: 'team', label: 'Team', icon: 'bx-group' },
    { path: 'participants', label: 'Participants', icon: 'bx-user-voice' },
    { path: 'outputs', label: 'Outputs', icon: 'bx-video' },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly context: PortalProjectContextService,
    private readonly destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.syncPortalNavMode(this.router.url);
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => this.syncPortalNavMode(e.urlAfterRedirects));

    this.route.paramMap
      .pipe(
        map((m) => m.get('slug')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((slug) => {
        const s = slug ?? '';
        this.slug = s;
        this.context.setSlug(s.trim() ? s.trim() : null);
      });

    this.context.projectMeta$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((meta) => {
        this.notFound = !!this.context.getActiveSlug() && meta === null;
        this.project = meta;
      });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  toggleMobileNav(): void {
    this.isMobileNavOpen = !this.isMobileNavOpen;
  }

  private syncPortalNavMode(rawUrl: string): void {
    const path = (rawUrl.split('?')[0].replace(/\/+$/, '') || '/') as string;
    this.showPortalPublicHomeNav =
      /^\/portal\/[^/]+$/.test(path) || /^\/portal\/[^/]+\/home$/.test(path);
  }

  /** Hex for CSS variable `--portal-accent` (navbar + scroll-to-top). */
  get portalAccentHex(): string {
    const c = this.project?.accentColor?.trim();
    if (c && /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(c)) {
      return c;
    }
    return '#1a5f7a';
  }
}
