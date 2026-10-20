import { AfterViewInit, Directive, DoCheck, ElementRef, HostListener, Input, NgZone, OnDestroy } from '@angular/core';

/**
 * Grows a textarea to fit its content. Used instead of cdkTextareaAutosize,
 * which needs the CDK text-field stylesheet (not loaded in this app) to
 * measure correctly and otherwise cuts lines off.
 */
@Directive({
  selector: 'textarea[appAutosize]',
  standalone: true,
})
export class AutosizeDirective implements AfterViewInit, DoCheck, OnDestroy {
  @Input() minRows = 1;

  private resizeObserver?: ResizeObserver;
  private lastWidth = 0;
  private lastValue: string | null = null;

  constructor(private el: ElementRef<HTMLTextAreaElement>, private zone: NgZone) {}

  ngAfterViewInit(): void {
    const ta = this.el.nativeElement;
    ta.rows = this.minRows;
    ta.style.overflowY = 'hidden';
    // ngModel writes the value after the view is created: size on the next frame.
    requestAnimationFrame(() => this.resize());
    // Width changes (window resize, sidebar toggle) rewrap the text.
    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(entries => {
        const width = entries[0]?.contentRect.width ?? 0;
        if (width !== this.lastWidth) { this.lastWidth = width; this.resize(); }
      });
      this.resizeObserver.observe(ta);
    });
  }

  /** Text set from code (moving entries, an import) fires no input event. */
  ngDoCheck(): void {
    if (this.el.nativeElement.value !== this.lastValue) this.resize();
  }

  @HostListener('input')
  resize(): void {
    const ta = this.el.nativeElement;
    this.lastValue = ta.value;
    ta.style.height = 'auto';
    const border = ta.offsetHeight - ta.clientHeight;
    ta.style.height = `${ta.scrollHeight + border}px`;
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
}
