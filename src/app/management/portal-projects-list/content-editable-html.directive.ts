import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';

/**
 * Binds HTML to a contenteditable without clobbering the caret on each change detection
 * (Angular's [innerHTML] + contenteditable causes inverted / backwards typing).
 */
@Directive({
  selector: '[appContentEditableHtml]',
})
export class ContentEditableHtmlDirective implements OnChanges {
  @Input('appContentEditableHtml') html: string | null | undefined = '';
  @Output() appContentEditableHtmlChange = new EventEmitter<string>();

  constructor(private readonly el: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['html']) {
      return;
    }
    const host = this.el.nativeElement;
    if (document.activeElement === host) {
      return;
    }
    const incoming = this.html ?? '';
    if (host.innerHTML !== incoming) {
      host.innerHTML = incoming;
    }
  }

  @HostListener('input')
  onInput(): void {
    this.appContentEditableHtmlChange.emit(this.el.nativeElement.innerHTML);
  }

  @HostListener('blur')
  onBlur(): void {
    this.appContentEditableHtmlChange.emit(this.el.nativeElement.innerHTML);
  }
}
