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

  /**
   * Backdrop for the page hero. Reuses the project's first home-carousel slide
   * rather than introducing a per-page banner field; falls back to the accent
   * gradient alone when a project has no carousel.
   */
  get heroImage(): string {
    return this.project?.content?.home?.carousel?.[0]?.url ?? '';
  }

  /**
   * Everything the date tile shows, in one place. `single` covers events with
   * no end date or an end on the same day. The year reads "2021 – 2022" only
   * when the event spans New Year; `days` counts both ends (29 Jun – 1 Jul = 3).
   */
  getDateRange(event: { startDate: string; endDate: string }): {
    single: boolean;
    from: { day: string; month: string; weekday: string };
    to: { day: string; month: string; weekday: string };
    year: string;
    days: number;
  } | null {
    if (!event?.startDate) return null;
    const start = new Date(event.startDate + 'T00:00:00');
    const end = event.endDate ? new Date(event.endDate + 'T00:00:00') : start;
    const part = (d: Date) => ({
      day: String(d.getDate()),
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    });
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    return {
      single: days <= 1,
      from: part(start),
      to: part(end),
      year: start.getFullYear() === end.getFullYear()
        ? String(start.getFullYear())
        : `${start.getFullYear()} – ${end.getFullYear()}`,
      days,
    };
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
