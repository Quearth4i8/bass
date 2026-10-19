import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnDestroy, forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface DayCell {
  date: Date;
  day: number;
  outside: boolean;
  today: boolean;
  selected: boolean;
}

interface YearCell {
  year: number;
  current: boolean;
  selected: boolean;
}

/**
 * Drop-in replacement for <input type="date">: same value format
 * ("YYYY-MM-DD", or "YYYY-MM-DDTHH:mm" with [withTime]), works with ngModel,
 * but draws its own calendar instead of the browser's.
 *
 * The popover is position: fixed with coordinates computed on open, so it is
 * not clipped by scrolling dialog bodies. Inside a transformed ancestor (the
 * PrimeNG dialog) fixed positioning is relative to that ancestor, which
 * `place()` accounts for.
 *
 * With mode="year" it picks a year instead: the value is a plain number
 * (2024), and the popover pages through twelve years at a time.
 */
@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatePickerComponent), multi: true }],
})
export class DatePickerComponent implements ControlValueAccessor, OnDestroy {
  @Input() placeholder = 'Select a date';
  @Input() withTime = false;
  @Input() inputId?: string;
  @Input() mode: 'date' | 'year' = 'date';

  get isYear(): boolean { return this.mode === 'year'; }

  open = false;
  disabled = false;
  value: Date | null = null;

  /** Month on screen (always the 1st). */
  view = DatePickerComponent.firstOfMonth(new Date());
  hours = '00';
  minutes = '00';
  popoverStyle: Record<string, string> = {};

  readonly weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private host: ElementRef<HTMLElement>, private cdr: ChangeDetectorRef) {}

  // ── ControlValueAccessor ────────────────────────────────────────────────────

  writeValue(v: string | number | null): void {
    this.value = this.isYear ? DatePickerComponent.parseYear(v) : DatePickerComponent.parse(v as string | null);
    if (this.value) {
      this.view = DatePickerComponent.firstOfMonth(this.value);
      this.hours = DatePickerComponent.pad(this.value.getHours());
      this.minutes = DatePickerComponent.pad(this.value.getMinutes());
    }
    this.cdr.markForCheck();
  }
  registerOnChange(fn: (v: any) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; this.cdr.markForCheck(); }

  // ── Display ─────────────────────────────────────────────────────────────────

  get label(): string {
    if (!this.value) return '';
    if (this.isYear) return String(this.value.getFullYear());
    const date = this.value.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return this.withTime
      ? `${date} · ${DatePickerComponent.pad(this.value.getHours())}:${DatePickerComponent.pad(this.value.getMinutes())}`
      : date;
  }

  get monthTitle(): string {
    if (this.isYear) {
      const start = this.pageStart;
      return `${start} – ${start + 11}`;
    }
    return this.view.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }

  /** Six weeks, Monday first, padded with the neighbouring months' days. */
  get cells(): DayCell[] {
    const first = this.view;
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
    const today = new Date();
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return {
        date: d,
        day: d.getDate(),
        outside: d.getMonth() !== first.getMonth(),
        today: DatePickerComponent.sameDay(d, today),
        selected: !!this.value && DatePickerComponent.sameDay(d, this.value),
      };
    });
  }

  /** First year of the twelve on screen (2016, 2028, ...). */
  private get pageStart(): number {
    return Math.floor(this.view.getFullYear() / 12) * 12;
  }

  get yearCells(): YearCell[] {
    const start = this.pageStart;
    const now = new Date().getFullYear();
    const picked = this.value?.getFullYear();
    return Array.from({ length: 12 }, (_, i) => ({
      year: start + i,
      current: start + i === now,
      selected: start + i === picked,
    }));
  }

  // ── Interaction ─────────────────────────────────────────────────────────────

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled) return;
    this.open ? this.close() : this.openPicker();
  }

  private openPicker(): void {
    if (this.value) this.view = DatePickerComponent.firstOfMonth(this.value);
    this.open = true;
    this.place();
    // Capture phase: scrolls inside a dialog body do not bubble to window.
    window.addEventListener('scroll', this.reposition, true);
  }

  private readonly reposition = () => { if (this.open) this.place(); };

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.reposition, true);
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    window.removeEventListener('scroll', this.reposition, true);
    this.onTouched();
    this.cdr.markForCheck();
  }

  shiftMonth(delta: number, event: Event): void {
    event.stopPropagation();
    this.view = this.isYear
      ? new Date(this.view.getFullYear() + delta * 12, 0, 1)
      : new Date(this.view.getFullYear(), this.view.getMonth() + delta, 1);
  }

  pickYear(cell: YearCell, event: Event): void {
    event.stopPropagation();
    this.commit(new Date(cell.year, 0, 1));
    this.close();
  }

  pick(cell: DayCell, event: Event): void {
    event.stopPropagation();
    const d = new Date(cell.date);
    if (this.withTime) d.setHours(+this.hours || 0, +this.minutes || 0);
    this.commit(d);
    if (cell.outside) this.view = DatePickerComponent.firstOfMonth(d);
    // Date only: one click is the whole job. With a time, wait for OK.
    if (!this.withTime) this.close();
  }

  today(event: Event): void {
    event.stopPropagation();
    const now = new Date();
    if (!this.withTime) now.setHours(0, 0, 0, 0);
    this.hours = DatePickerComponent.pad(now.getHours());
    this.minutes = DatePickerComponent.pad(now.getMinutes());
    this.view = DatePickerComponent.firstOfMonth(now);
    this.commit(now);
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.value = null;
    this.onChange(null);
    this.close();
  }

  confirm(event: Event): void {
    event.stopPropagation();
    this.close();
  }

  setTime(part: 'h' | 'm', raw: string): void {
    const max = part === 'h' ? 23 : 59;
    const n = Math.min(max, Math.max(0, parseInt(raw, 10) || 0));
    if (part === 'h') this.hours = DatePickerComponent.pad(n);
    else this.minutes = DatePickerComponent.pad(n);
    if (this.value) {
      const d = new Date(this.value);
      d.setHours(+this.hours, +this.minutes);
      this.commit(d);
    }
  }

  private commit(d: Date): void {
    this.value = d;
    this.onChange(this.isYear ? d.getFullYear() : DatePickerComponent.format(d, this.withTime));
    this.cdr.markForCheck();
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
    const trigger = this.host.nativeElement.querySelector('.dp-trigger') as HTMLElement | null;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const height = this.isYear ? 250 : this.withTime ? 420 : 372;
    const width = 300;

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
    const left = Math.min(r.left, viewW - width - 8);

    this.popoverStyle = up
      ? { top: 'auto', bottom: `${(frame ? frame.height : viewH) - (r.top - top0) + 6}px`, left: `${left - left0}px` }
      : { top: `${r.bottom - top0 + 6}px`, bottom: 'auto', left: `${left - left0}px` };
    this.cdr.markForCheck();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private static firstOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
  private static pad(n: number): string { return String(n).padStart(2, '0'); }
  private static sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  /** 2024 or "2024" -> 1 Jan 2024; anything else -> null. */
  private static parseYear(v: string | number | null | undefined): Date | null {
    const y = Number(v);
    return v !== null && v !== '' && Number.isInteger(y) && y > 0 ? new Date(y, 0, 1) : null;
  }

  /** "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm", read as local time (not UTC). */
  private static parse(v: string | null | undefined): Date | null {
    if (!v) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(String(v));
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0);
  }

  private static format(d: Date, withTime: boolean): string {
    const p = DatePickerComponent.pad;
    const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    return withTime ? `${date}T${p(d.getHours())}:${p(d.getMinutes())}` : date;
  }
}
