import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnDestroy, forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface DateParts { year: number | null; month: number | null; day: number | null; }

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** "2024-04-*" -> { year: 2024, month: 4, day: null }; '' -> all null. */
function parseParts(v: unknown): DateParts {
  const [y, m, d] = String(v ?? '').split('-');
  const num = (s: string | undefined) => (s && s !== '*' && Number.isInteger(+s) && +s > 0 ? +s : null);
  return { year: num(y), month: num(m), day: num(d) };
}

/**
 * A date filter value in words: "4 Apr 2024", "April, any year",
 * "Day 4 of any month", ... '' when nothing is set.
 */
export function describeDateFilter(v: unknown): string {
  const { year, month, day } = parseParts(v);
  const mon = month ? MONTHS[month - 1] : '';
  if (day && month) return `${day} ${mon.slice(0, 3)}${year ? ' ' + year : ', any year'}`;
  if (month) return year ? `${mon.slice(0, 3)} ${year}` : `${mon}, any year`;
  if (day) return `Day ${day} of any month${year ? ' in ' + year : ''}`;
  return year ? String(year) : '';
}

/**
 * Filter by any mix of year, month and day, each picked on its own: April
 * alone matches April of every year, adding 2024 narrows it to April 2024,
 * adding the 4th narrows it to that day. Every click applies at once.
 *
 * The value is "YYYY-MM-DD" with "*" for the parts left open ("*-04-*"), or
 * '' with nothing set; `matchesDate` in project-labels reads it.
 *
 * The popover is position: fixed, placed like app-date-picker's, so it is
 * not clipped by scrolling containers.
 */
@Component({
  selector: 'app-date-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-filter.component.html',
  styleUrls: ['./date-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateFilterComponent), multi: true }],
})
export class DateFilterComponent implements ControlValueAccessor, OnDestroy {
  @Input() placeholder = 'Any date';

  open = false;
  disabled = false;
  parts: DateParts = { year: null, month: null, day: null };

  /** Last year of the eight on screen; starts a year ahead, as end dates run into the future. */
  yearEnd = new Date().getFullYear() + 1;
  popoverStyle: Record<string, string> = {};

  readonly months = MONTHS.map((name, i) => ({ value: i + 1, short: name.slice(0, 3), name }));
  readonly days = Array.from({ length: 31 }, (_, i) => i + 1);
  readonly thisYear = new Date().getFullYear();

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private host: ElementRef<HTMLElement>, private cdr: ChangeDetectorRef) {}

  // ── ControlValueAccessor ────────────────────────────────────────────────────

  writeValue(v: unknown): void {
    this.parts = parseParts(v);
    this.cdr.markForCheck();
  }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; this.cdr.markForCheck(); }

  // ── Display ─────────────────────────────────────────────────────────────────

  get isEmpty(): boolean { return !this.parts.year && !this.parts.month && !this.parts.day; }
  get label(): string { return describeDateFilter(this.serialize()); }

  get years(): number[] {
    return Array.from({ length: 8 }, (_, i) => this.yearEnd - 7 + i);
  }

  /** Days past the end of the chosen month (30 Feb ...) can't match anything. */
  dayDisabled(day: number): boolean {
    const { year, month } = this.parts;
    if (!month) return false;
    // Any year: allow 29 Feb, which leap years have.
    return day > new Date(year ?? 2000, month, 0).getDate();
  }

  // ── Interaction ─────────────────────────────────────────────────────────────

  /** The filter whose popover is open: opening another one closes it. */
  private static current: DateFilterComponent | null = null;

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled) return;
    if (this.open) { this.close(); return; }
    if (DateFilterComponent.current && DateFilterComponent.current !== this) DateFilterComponent.current.close();
    DateFilterComponent.current = this;
    const y = this.parts.year;
    if (y && (y > this.yearEnd || y < this.yearEnd - 7)) this.yearEnd = y + 1;
    this.open = true;
    this.place();
    // Capture phase: scrolls inside a dialog body do not bubble to window.
    window.addEventListener('scroll', this.reposition, true);
  }

  private readonly reposition = () => { if (this.open) this.place(); };

  close(): void {
    if (!this.open) return;
    this.open = false;
    if (DateFilterComponent.current === this) DateFilterComponent.current = null;
    window.removeEventListener('scroll', this.reposition, true);
    this.onTouched();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    if (DateFilterComponent.current === this) DateFilterComponent.current = null;
    window.removeEventListener('scroll', this.reposition, true);
  }

  shiftYears(delta: number, event: Event): void {
    event.stopPropagation();
    this.yearEnd += delta * 8;
  }

  /** Picks a part, or clears it when it is already picked (null = "Any"). */
  set(part: keyof DateParts, value: number | null, event: Event): void {
    event.stopPropagation();
    this.parts = { ...this.parts, [part]: this.parts[part] === value ? null : value };
    // A month change can strand the day (31 -> February): drop it then.
    if (this.parts.day && this.dayDisabled(this.parts.day)) this.parts.day = null;
    this.onChange(this.serialize());
    this.cdr.markForCheck();
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.parts = { year: null, month: null, day: null };
    this.onChange('');
    this.close();
  }

  done(event: Event): void {
    event.stopPropagation();
    this.close();
  }

  private serialize(): string {
    if (this.isEmpty) return '';
    const { year, month, day } = this.parts;
    const pad = (n: number | null) => (n ? String(n).padStart(2, '0') : '*');
    return `${year ?? '*'}-${pad(month)}-${pad(day)}`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.open && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.close(); }

  @HostListener('window:resize')
  onViewportChange(): void { if (this.open) this.place(); }

  // ── Placement ───────────────────────────────────────────────────────────────

  private place(): void {
    const trigger = this.host.nativeElement.querySelector('.df-trigger') as HTMLElement | null;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const height = 430;
    const width = 340;

    // Fixed positioning is relative to the nearest transformed ancestor, if any.
    let frame: DOMRect | null = null;
    for (let el = trigger.parentElement; el; el = el.parentElement) {
      if (getComputedStyle(el).transform !== 'none') { frame = el.getBoundingClientRect(); break; }
    }
    const top0 = frame ? frame.top : 0;
    const left0 = frame ? frame.left : 0;
    const viewH = window.innerHeight;
    const viewW = window.innerWidth;

    const below = viewH - r.bottom;
    const up = below < height + 8 && r.top > below;
    const left = Math.max(8, Math.min(r.left, viewW - width - 8));

    this.popoverStyle = up
      ? { top: 'auto', bottom: `${(frame ? frame.height : viewH) - (r.top - top0) + 6}px`, left: `${left - left0}px` }
      : { top: `${r.bottom - top0 + 6}px`, bottom: 'auto', left: `${left - left0}px` };
    this.cdr.markForCheck();
  }
}
