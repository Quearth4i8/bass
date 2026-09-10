import {
  Component,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'app-upbutton',
  templateUrl: './upbutton.component.html',
  styleUrls: ['./upbutton.component.scss']
})
export class UpbuttonComponent implements OnChanges, OnDestroy {

  /**
   * Element that actually scrolls. Leave unset on pages where the window is the
   * scroller; pass the container on layouts that scroll inside a box (the portal
   * shell keeps its scrollbar below the fixed nav, so the window never scrolls).
   */
  @Input() scrollContainer?: HTMLElement | null;

  showBackToTop = false;

  private detach?: () => void;

  constructor(private readonly zone: NgZone) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (this.scrollContainer) {
      return; // container mode listens to the container instead
    }
    this.update(window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scrollContainer']) {
      this.bind();
    }
  }

  ngOnDestroy(): void {
    this.detach?.();
  }

  scrollToTop() {
    (this.scrollContainer ?? window).scrollTo({ top: 0, behavior: 'smooth' });
  }

  private bind(): void {
    this.detach?.();
    this.detach = undefined;

    const el = this.scrollContainer;
    if (!el) {
      return;
    }

    // Scroll fires constantly; stay out of the zone and only re-enter on a flip.
    this.zone.runOutsideAngular(() => {
      const onScroll = () => this.update(el.scrollTop);
      el.addEventListener('scroll', onScroll, { passive: true });
      this.detach = () => el.removeEventListener('scroll', onScroll);
      onScroll();
    });
  }

  private update(offset: number): void {
    const next = offset > 100;
    if (next !== this.showBackToTop) {
      this.zone.run(() => (this.showBackToTop = next));
    }
  }
}
