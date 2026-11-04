import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

/**
 * The back-to-top button, once for the whole app (in app.component.html).
 *
 * Pages scroll in different places: most in the window, some inside a box
 * (the portal shell keeps its scrollbar below the fixed nav). So it listens to
 * every scroll and follows whichever page-sized scroller moved last; small
 * scrollers (dropdown menus, table bodies, year lists) are ignored.
 */
@Component({
  selector: 'app-upbutton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upbutton.component.html',
  styleUrls: ['./upbutton.component.scss']
})
export class UpbuttonComponent implements OnInit, OnDestroy {
  showBackToTop = false;

  /** The scroller the button sends back to the top; null for the window. */
  private scroller: HTMLElement | null = null;
  private detach?: () => void;
  private navigation?: Subscription;

  constructor(private readonly zone: NgZone, private readonly router: Router) {}

  ngOnInit(): void {
    // Scroll fires constantly; stay out of the zone and only re-enter on a flip.
    this.zone.runOutsideAngular(() => {
      // Capture phase: scrolls inside an element do not bubble.
      const onScroll = (event: Event) => this.onScroll(event.target);
      document.addEventListener('scroll', onScroll, { capture: true, passive: true });
      this.detach = () => document.removeEventListener('scroll', onScroll, { capture: true });
    });
    // A new page starts at the top, possibly in another scroller.
    this.navigation = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.scroller = null;
        this.showBackToTop = false;
      });
  }

  ngOnDestroy(): void {
    this.detach?.();
    this.navigation?.unsubscribe();
  }

  scrollToTop(): void {
    (this.scroller ?? window).scrollTo({ top: 0, behavior: 'smooth' });
  }

  private onScroll(target: EventTarget | null): void {
    if (target === document || target === document.documentElement || target === document.body) {
      this.scroller = null;
      this.update(window.scrollY || document.documentElement.scrollTop || document.body.scrollTop);
      return;
    }
    const el = target as HTMLElement;
    // Only a page-sized box counts as "the page" scrolling.
    if (!(el instanceof HTMLElement) || el.clientHeight < window.innerHeight * 0.5) return;
    this.scroller = el;
    this.update(el.scrollTop);
  }

  private update(offset: number): void {
    const next = offset > 100;
    if (next !== this.showBackToTop) {
      this.zone.run(() => (this.showBackToTop = next));
    }
  }
}
