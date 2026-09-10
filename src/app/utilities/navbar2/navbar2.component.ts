import {
  AfterViewChecked,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
  ViewChild,
} from '@angular/core';
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
export class Navbar2Component implements OnInit, AfterViewChecked, OnDestroy {
  /** When true, always show the classic IMAS static bar (e.g. portal not-found). */
  @Input() forceLegacyNav = false;

  isSticky = true;

  portalMode = false;
  portalSlug = '';
  portalTitle = '';
  portalProjectId = '';
  private lastPortalSlug = '';

  readonly portalLinks = PORTAL_TOP_NAV_LINKS;

  /** Drawer state for the collapsed portal nav. */
  isPortalMenuOpen = false;

  /**
   * Whether the inline link row still fits. Decided by measurement rather than a
   * breakpoint: the room left for the row depends on the project title, which
   * varies per portal, so no fixed pixel width is right for every project.
   */
  isNavCollapsed = false;

  @ViewChild('portalHeader') private portalHeader?: ElementRef<HTMLElement>;
  @ViewChild('navRow') private navRow?: ElementRef<HTMLElement>;
  @ViewChild('navRowList') private navRowList?: ElementRef<HTMLElement>;

  private fitObserver?: ResizeObserver;
  private observedHeader?: HTMLElement;

  constructor(
    private readonly zone: NgZone,
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
      .subscribe((e) => {
        this.applyUrl(e.urlAfterRedirects);
        this.isPortalMenuOpen = false;
      });

    if (this.portalContext) {
      this.portalContext.projectMeta$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((meta) => {
          if (meta?.title && (!this.portalSlug || meta.slug === this.portalSlug)) {
            this.portalTitle = meta.title;
          }
        });

      this.portalContext.project$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((project) => {
          this.portalProjectId = project?.content?.home?.projectId ?? '';
        });
    }
  }

  ngOnInit(): void {}

  ngAfterViewChecked(): void {
    // The header is re-created when the bar flips between portal and legacy
    // layouts, so re-resolve instead of capturing it once.
    const header = this.portalHeader?.nativeElement;
    if (header && header !== this.observedHeader) {
      this.observeFit(header);
    } else if (!header && this.observedHeader) {
      this.fitObserver?.disconnect();
      this.observedHeader = undefined;
    }
  }

  ngOnDestroy(): void {
    this.fitObserver?.disconnect();
  }

  private observeFit(header: HTMLElement): void {
    this.fitObserver?.disconnect();
    this.observedHeader = header;

    if (typeof ResizeObserver === 'undefined') {
      setTimeout(() => this.syncNavFit());
      return;
    }

    // Fires once on observe(), and afterwards on viewport resize or when the
    // project title changes the logo's width. Async, so setting state here is
    // safe with respect to change detection.
    this.zone.runOutsideAngular(() => {
      this.fitObserver = new ResizeObserver(() => this.syncNavFit());
      this.fitObserver.observe(header);
      if (this.navRow) {
        // Its width is the constraint, and it also moves when a longer project
        // title widens the logo column without the header itself resizing.
        this.fitObserver.observe(this.navRow.nativeElement);
      }
    });
  }

  /**
   * Collapse when the row's natural width no longer fits the column it is given.
   *
   * Both operands are state-independent: `.nav-collapsed` only flips visibility,
   * so the row keeps its grid column and the toggle keeps its slot either way.
   * That is deliberate - an earlier version reconstructed the free space from
   * the logo and action widths, which the grid sized differently per state, so
   * the two states disagreed at the threshold and the bar flip-flopped.
   */
  private syncNavFit(): void {
    const nav = this.navRow?.nativeElement;
    const list = this.navRowList?.nativeElement;
    if (!nav || !list) {
      return;
    }

    // 1px of slack absorbs sub-pixel rounding in the track sizes.
    const next = list.scrollWidth > nav.clientWidth + 1;
    if (next === this.isNavCollapsed) {
      return;
    }

    this.zone.run(() => {
      this.isNavCollapsed = next;
      if (!next) {
        this.isPortalMenuOpen = false;
      }
    });
  }

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

  togglePortalMenu(): void {
    this.isPortalMenuOpen = !this.isPortalMenuOpen;
  }

  closePortalMenu(): void {
    this.isPortalMenuOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closePortalMenu();
  }

  portalLink(path: string): string[] {
    return ['/portal', this.portalSlug, path];
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(_event: Event): void {
    this.isSticky = true;
  }
}
