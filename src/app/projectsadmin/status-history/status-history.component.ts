import { Component, DestroyRef, ElementRef, HostBinding, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { AdminNavbarComponent } from '../../utilities/admin-navbar/admin-navbar.component';
import { AdminSidebarComponent } from '../../utilities/admin-sidebar/admin-sidebar.component';
import { SidebarService } from '../../services/sidebarservice';
import { ThemeService } from '../../services/ThemeService';
import { ProjectService, ProjectStatusStep } from '../../services/ProjectService';
import { ProjectGroupService } from '../../services/ProjectGroupService';
import { STAGE_DATE_FIELD, statusLabel, statusStage, statusTone } from '../../utilities/project-labels';
import { DateFilterComponent } from '../../shared/components/date-filter/date-filter.component';
import { matchesSearch } from '../../shared/utils/text-search';

/** A stretch of time during which a project held one status. `to` is null for its current status. */
interface Period {
  status: string;
  from: Date;
  to: Date | null;
  /** The project field holding the date it took this status ('startDate' for Ongoing...); null for a status outside the tree. */
  field: string | null;
}

/** A project with its status timeline, oldest period first. */
interface Row {
  project: any;
  periods: Period[];
  /** When its status last changed; null without history. */
  lastChange: Date | null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Status history of the research projects, from the date each project took
 * each of its statuses: one list of projects, most recently changed first, each
 * opening onto its timeline, and next to it a year-by-status count table whose
 * cells narrow the list to the projects behind that number.
 */
@Component({
  selector: 'app-status-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminNavbarComponent, AdminSidebarComponent, DateFilterComponent],
  templateUrl: './status-history.component.html',
  styleUrls: ['./status-history.component.scss'],
})
export class StatusHistoryComponent implements OnInit {
  @HostBinding('class.theme-light') get isLight() { return this.themeService.isLight; }

  readonly statusLabel = statusLabel;
  readonly statusTone = statusTone;

  isSidebarVisible = true;
  loading = true;
  error = '';

  rows: Row[] = [];
  /** Every status, in the project groups' order, then any old one only found in history. */
  statuses: string[] = [];
  /** The years history covers, newest first. */
  years: number[] = [];
  /** For each year, how many projects held each status at some point during it. */
  overview: { year: number; counts: Record<string, number> }[] = [];
  /** Per status, its largest yearly count: the cell shading is relative to it. */
  private peak: Record<string, number> = {};

  search = '';
  /** Current status to list; '' for all. */
  status = '';
  /** Ids of the projects whose timeline is open. */
  expanded = new Set<number>();
  /**
   * Ids of the projects whose timeline has been built: kept after closing, so
   * the closing animation has content to fold away and reopening is instant.
   */
  rendered = new Set<number>();
  /** A cell of the year table: lists the projects that held `status` during `year`. */
  yearFilter: { status: string; year: number } | null = null;

  /** The project whose status date is being saved. */
  savingId: number | null = null;
  /** Why the last date change was refused, shown under that project's timeline. */
  saveError: { projectId: number; message: string } | null = null;
  /** Saves waiting a moment, so a date still being picked (year, then month...) is sent once. */
  private pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private projectService: ProjectService,
    private projectGroupService: ProjectGroupService,
    private sidebarService: SidebarService,
    private route: ActivatedRoute,
    private destroyRef: DestroyRef,
    private host: ElementRef<HTMLElement>,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.sidebarService.sidebarVisibility$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.isSidebarVisible = v);

    this.fetch(true);
    this.destroyRef.onDestroy(() => this.pendingSaves.forEach(t => clearTimeout(t)));
  }

  /** Loads projects and timelines; again after a date is changed, so the timeline and year table follow. */
  private fetch(first: boolean): void {
    forkJoin({
      projects: this.projectService.getAllProjects(),
      groups: this.projectGroupService.getProjectGroups(),
      changes: this.projectService.getStatusChanges(),
    }).subscribe({
      next: ({ projects, groups, changes }) => {
        this.load(projects, groups.map(g => g.title), changes);
        this.loading = false;
        this.savingId = null;
        if (first) this.openFromUrl();
      },
      error: err => {
        console.error('Error loading status history:', err);
        this.error = 'The status history could not be loaded.';
        this.loading = false;
        this.savingId = null;
      },
    });
  }

  /** The date stored for the period's status; '' when the project has none yet (its timeline shows a guess). */
  dateValue(row: Row, period: Period): string {
    return period.field ? (row.project[period.field] || '') : '';
  }

  /** A date picked on the timeline: saved to the project once the admin stops picking. */
  onDatePicked(row: Row, period: Period, value: string): void {
    const field = period.field;
    if (!field || !value || value === row.project[field]) return;
    const key = `${row.project.id}:${field}`;
    clearTimeout(this.pendingSaves.get(key));
    this.pendingSaves.set(key, setTimeout(() => {
      this.pendingSaves.delete(key);
      this.saveDate(row, field, value);
    }, 800));
  }

  private saveDate(row: Row, field: string, value: string): void {
    this.saveError = null;
    this.savingId = row.project.id;
    const changes: Record<string, any> = { [field]: value };
    // The start year goes with the start date (Ongoing's date).
    if (field === 'startDate') changes['startyear'] = Number(value.slice(0, 4));
    this.projectService.updateProject(row.project.id, { ...row.project, ...changes }).subscribe({
      next: () => this.fetch(false),
      error: err => {
        console.error('Error saving status date:', err);
        this.savingId = null;
        // A date out of order comes back as 400 with the reason as text.
        this.saveError = {
          projectId: row.project.id,
          message: err?.status === 400 && typeof err.error === 'string' ? err.error : 'The date could not be saved.',
        };
      },
    });
  }

  /**
   * Ongoing is shown as a span from the start date, up to the date the project
   * became Achieved or Canceled, or else its end date.
   */
  isOngoing(period: Period): boolean {
    return statusStage(period.status) === 'ONGOING';
  }

  trackRow(_: number, row: Row): number {
    return row.project.id;
  }

  trackPeriod(_: number, period: Period): string {
    return period.status;
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
    this.sidebarService.toggleSidebar();
  }

  private load(projects: any[], groupTitles: string[], changes: ProjectStatusStep[]): void {
    const byProject = new Map<number, ProjectStatusStep[]>();
    for (const c of changes) {
      const list = byProject.get(c.projectId) ?? [];
      list.push(c);
      byProject.set(c.projectId, list);
    }

    this.rows = projects.map(project => {
      // Already in status order: Submitted, then Ongoing... (two can share a day).
      // A step without a readable date would turn every year computation into NaN and empty the year table.
      const changes = (byProject.get(project.id) ?? []).filter(c => !isNaN(parseDate(c.date).getTime()));
      const periods = changes.map((row, i) => ({
        status: row.status,
        from: parseDate(row.date),
        to: i + 1 < changes.length ? parseDate(changes[i + 1].date) : null,
        field: (stage => stage ? STAGE_DATE_FIELD[stage] : null)(statusStage(row.status)),
      }));
      return { project, periods, lastChange: periods.length ? periods[periods.length - 1].from : null };
    }).sort((a, b) => (b.lastChange?.getTime() ?? 0) - (a.lastChange?.getTime() ?? 0)
      || String(a.project.acronyme || '').localeCompare(String(b.project.acronyme || '')));

    const known = new Set(groupTitles.map(normalize));
    const extra = changes.map(c => c.status).filter(st => st && !known.has(normalize(st)));
    // Same order as the project dialog: Ongoing, Achieved, Submitted, Rejected, Canceled, then others.
    const rank = ['ONGOING', 'ACHIEVED', 'SUBMITTED', 'REJECTED', 'CANCEL'];
    const pos = (t: string) => {
      const i = rank.findIndex(r => normalize(t).includes(r));
      return i < 0 ? rank.length : i;
    };
    this.statuses = [...groupTitles, ...Array.from(new Set(extra))].sort((a, b) => pos(a) - pos(b));

    const now = new Date().getFullYear();
    this.years = [];
    const first = Math.min(now, ...this.rows.filter(r => r.periods.length).map(r => r.periods[0].from.getFullYear()));
    for (let y = now; y >= first; y--) this.years.push(y);

    this.overview = this.years.map(year => ({
      year,
      counts: Object.fromEntries(this.statuses.map(st => [st, this.rows.filter(r => heldIn(r, st, year)).length])),
    }));
    this.peak = Object.fromEntries(this.statuses.map(st =>
      [st, Math.max(1, ...this.overview.map(row => row.counts[st]))]));
  }

  /** The Projects page links here with ?project=<id>: open that one and bring it into view. */
  private openFromUrl(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('project'));
    if (!id || !this.rows.some(r => r.project.id === id)) return;
    this.rendered.add(id);
    this.expanded.add(id);
    setTimeout(() => this.host.nativeElement.querySelector(`[data-project="${id}"]`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  }

  get filteredRows(): Row[] {
    const q = this.search.trim();
    const yf = this.yearFilter;
    return this.rows.filter(r =>
      (!yf || heldIn(r, yf.status, yf.year)) &&
      (!this.status || r.project.title === this.status) &&
      (!q || [r.project.acronyme, r.project.titreproj, r.project.responsable].some(v => matchesSearch(v, q))));
  }

  countFor(status: string): number {
    return this.rows.filter(r => r.project.title === status).length;
  }

  /** The statuses some project has now, for the chips. */
  get currentStatuses(): string[] {
    return this.statuses.filter(st => this.countFor(st));
  }

  /** Clicking the picked cell again clears it. */
  pickCell(status: string, year: number): void {
    const same = this.yearFilter?.status === status && this.yearFilter.year === year;
    this.yearFilter = same ? null : { status, year };
    // The two would contradict each other ("now Achieved" vs "Ongoing in 2021").
    if (this.yearFilter) this.status = '';
  }

  /** A cell's shading: the larger its share of the status's busiest year, the stronger. */
  cellStyle(status: string, count: number): Record<string, string> {
    if (!count) return {};
    const pct = Math.round(8 + 32 * count / this.peak[status]);
    return { background: `color-mix(in srgb, var(--${statusTone(status)}) ${pct}%, transparent)` };
  }

  toggle(id: number): void {
    if (this.expanded.has(id)) this.expanded.delete(id);
    else {
      this.rendered.add(id);
      this.expanded.add(id);
    }
  }

  /** Each period's share of the project's whole timeline, for the bar above it. */
  bar(periods: Period[]): { period: Period; width: number }[] {
    if (!periods.length) return [];
    const start = periods[0].from.getTime();
    const total = Math.max(Date.now() - start, 1);
    return periods.map(period => ({
      period,
      // Kept visible even for a change undone the same day.
      width: Math.max(((period.to ?? new Date()).getTime() - period.from.getTime()) / total * 100, 2),
    }));
  }

  /** The project's end date, for an Ongoing span not closed by a later status; null without one. */
  endDate(row: Row): Date | null {
    const end = row.project.endDate;
    return end ? parseDate(end) : null;
  }

  formatDate(date: Date): string {
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }
}

/** Whether the project held `status` at any point during `year`. */
function heldIn(row: Row, status: string, year: number): boolean {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  return row.periods.some(p => p.from < end && (!p.to || p.to > start) && normalize(p.status) === normalize(status));
}

function normalize(status: string | null | undefined): string {
  return (status || '').trim().toUpperCase();
}

/** A LocalDate from the backend, "2024-03-14" (or [2024, 3, 14] if serialized as an array), as local midnight. */
function parseDate(value: string | number[]): Date {
  const [y, m, d] = Array.isArray(value) ? value : String(value ?? '').split('-').map(Number);
  return new Date(y, m - 1, d);
}
