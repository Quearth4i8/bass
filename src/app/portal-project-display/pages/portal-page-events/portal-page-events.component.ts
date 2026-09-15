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
    this.filteredEvents = this.sortNewestFirst(matched);
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
