import {
  AfterViewChecked,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
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
export class PortalProjectDisplayComponent
  implements OnInit, AfterViewChecked, OnDestroy
{
  /** Portal pages scroll in here, not in the window. */
  @ViewChild('portalScroll') private portalScroll?: ElementRef<HTMLElement>;

  project: PortalProjectMeta | null = null;
  slug = '';
  notFound = false;
  isMobileNavOpen = false;

  /** Measured height of the fixed nav; the shell reserves exactly this much. */
  navHeight = 56;

  private navResizeObserver?: ResizeObserver;
  private observedNav?: HTMLElement;

  /** `app-navbar` (transparent → sticky) only on portal home; inner pages use `app-navbar2`. */
  showPortalPublicHomeNav = false;

  navLinks = [
    { path: 'home', label: 'Home', icon: 'bx-home-alt' },
    { path: 'scientific-merit', label: 'Scientific Merit', icon: 'bx-analyse' },
    { path: 'objectives', label: 'Objectives', icon: 'bx-target-lock' },
    { path: 'partners', label: 'Partners', icon: 'bx-building-house' },
    { path: 'funders',  label: 'Funders',  icon: 'bx-coin-stack' },
    { path: 'team', label: 'Team', icon: 'bx-group' },
    { path: 'events', label: 'Events', icon: 'bx-calendar' },
    { path: 'participants', label: 'Participants', icon: 'bx-user-voice' },
    { path: 'gallery', label: 'Gallery', icon: 'bx-images' },
    { path: 'outputs', label: 'Outputs', icon: 'bx-video' },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly context: PortalProjectContextService,
    private readonly destroyRef: DestroyRef,
    private readonly host: ElementRef<HTMLElement>,
    private readonly zone: NgZone,
  ) {}

  ngOnInit(): void {
    // Suppress the window scrollbar (and its reserved gutter) so the portal's
    // own container scrollbar is the only one on screen.
    document.documentElement.classList.add('portal-shell-active');

    this.syncPortalNavMode(this.router.url);
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => {
        this.syncPortalNavMode(e.urlAfterRedirects);
        // Router `scrollPositionRestoration` only resets the window scroller.
        this.portalScroll?.nativeElement.scrollTo({ top: 0 });
      });

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

  ngAfterViewChecked(): void {
    // navbar2 swaps its <header> when it flips between the legacy and portal
    // layouts, so re-resolve rather than capturing the element once.
    const header = this.host.nativeElement.querySelector('header');
    if (header && header !== this.observedNav) {
      this.observeNav(header);
    }
  }

  ngOnDestroy(): void {
    this.navResizeObserver?.disconnect();
    document.documentElement.classList.remove('portal-shell-active');
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

  /**
   * Track the nav's painted height so the scroll container can sit flush under
   * it. Measurement is always delivered asynchronously (ResizeObserver fires
   * its first callback after the current change-detection pass), which keeps
   * this out of ExpressionChangedAfterItHasBeenChecked territory.
   */
  private observeNav(header: HTMLElement): void {
    this.navResizeObserver?.disconnect();
    this.observedNav = header;

    const measure = () => {
      // `bottom` is exactly where the nav stops painting, i.e. where the
      // scroll container must start for there to be no seam.
      const h = Math.round(header.getBoundingClientRect().bottom);
      if (h > 0 && h !== this.navHeight) {
        this.zone.run(() => (this.navHeight = h));
      }
    };

    if (typeof ResizeObserver === 'undefined') {
      setTimeout(measure);
      return;
    }

    // The nav animates its padding and reflows at the mobile breakpoint.
    this.zone.runOutsideAngular(() => {
      this.navResizeObserver = new ResizeObserver(measure);
      this.navResizeObserver.observe(header);
    });
  }

  /** Value for CSS variable `--portal-nav-h` (strip reserved for the fixed nav). */
  get portalNavHeightPx(): string {
    return `${this.navHeight}px`;
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
