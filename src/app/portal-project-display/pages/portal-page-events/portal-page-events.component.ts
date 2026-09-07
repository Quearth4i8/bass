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
    this.filteredEvents = !term ? events : events.filter((event: any) =>
      (event.title || '').toLowerCase().includes(term) ||
      (event.organiser || '').toLowerCase().includes(term) ||
      (event.location || '').toLowerCase().includes(term) ||
      (event.speaker || '').toLowerCase().includes(term)
    );
  }
}
