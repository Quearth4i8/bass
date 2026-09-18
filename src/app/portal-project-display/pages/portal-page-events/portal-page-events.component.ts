import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PortalProjectContextService } from '../../../portal/services/portal-project-context.service';
import { PortalProject } from '../../../portal/models/portal-project.model';

@Component({
  selector: 'app-portal-page-events',
  templateUrl: './portal-page-events.component.html',
  styleUrls: ['./portal-page-events.component.scss'],
})
export class PortalPageEventsComponent implements OnInit {
  project: PortalProject | null = null;
  loading = true;
  searchTerm = '';
  filteredEvents: any[] = [];

  constructor(
    private readonly context: PortalProjectContextService,
    private readonly destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.context.project$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((project) => {
        this.project = project;
        this.loading = false;
        this.updateFilteredEvents();
      });
  }

  getEventDay(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  }

  /**
   * Backdrop for the page hero. Reuses the project's first home-carousel slide
   * rather than introducing a per-page banner field; falls back to the accent
   * gradient alone when a project has no carousel.
   */
  get heroImage(): string {
    return this.project?.content?.home?.carousel?.[0]?.url ?? '';
  }

  /** Day number alone, for the big figure in the date tile. */
  getEventDayNumber(dateStr: string): string {
    if (!dateStr) return '';
    return String(new Date(dateStr + 'T00:00:00').getDate());
  }

  /** "DEC 2020", the line under the day number. */
  getEventMonthYear(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} ${d.getFullYear()}`;
  }

  formatEventDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} ${d.getFullYear()}`;
  }

  getStatusClass(status: string): string {
    return { ongoing: 'status-ongoing', finished: 'status-finished', canceled: 'status-canceled' }[status] || '';
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.updateFilteredEvents();
  }

  private updateFilteredEvents(): void {
    const events = this.project?.content?.events?.events || [];
    const term = this.searchTerm.trim().toLowerCase();
    const matched = !term ? events : events.filter((event: any) =>
      (event.title || '').toLowerCase().includes(term) ||
      (event.organiser || '').toLowerCase().includes(term) ||
      (event.location || '').toLowerCase().includes(term) ||
      (event.speaker || '').toLowerCase().includes(term)
    );
    // Split once here rather than from the template: a method called in an
    // *ngFor re-runs on every change-detection pass, and the result only
    // changes when the event list does.
    this.filteredEvents = this.sortNewestFirst(matched)
      .map((event) => ({ ...event, presentationItems: this.splitPresentation(event.presentation) }));
  }

  /**
   * An abstract is typed into a textarea, so its line breaks are a mix of two
   * different things: a new point, and a line the author wrapped by hand. Only
   * the first should survive into the layout - the second was showing up as a
   * sentence broken in half across two bullets.
   *
   * A line opening with a marker (`.`, `-`, `*`, `•`) starts a point; anything
   * else is the tail of the point above it.
   */
  private splitPresentation(text: string | undefined): string[] {
    if (!text?.trim()) return [];

    const marker = /^\s*[.\-*•]+\s*/;
    const points: string[] = [];

    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;

      if (points.length && !marker.test(line)) {
        points[points.length - 1] += ' ' + line;
      } else {
        points.push(line.replace(marker, '').trim());
      }
    }

    return points.filter(Boolean);
  }

  // Most recent start date at the top. Copies before sorting: with no search
  // term `matched` is the project's own events array, and sorting in place
  // would reorder the stored content behind the admin's back.
  private sortNewestFirst(events: any[]): any[] {
    return [...events].sort((a, b) => {
      const ta = this.eventStartTime(a);
      const tb = this.eventStartTime(b);
      if (ta === tb) return 0;
      // An event with no usable date sinks to the bottom instead of being
      // treated as 1970 and sorting as the oldest entry.
      if (ta === null) return 1;
      if (tb === null) return -1;
      return tb - ta;
    });
  }

  private eventStartTime(event: any): number | null {
    if (!event?.startDate) return null;
    const time = new Date(event.startDate + 'T00:00:00').getTime();
    return Number.isNaN(time) ? null : time;
  }
}
