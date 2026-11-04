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
import { ProjectService, ProjectStatusChange } from '../../services/ProjectService';
import { ProjectGroupService } from '../../services/ProjectGroupService';
import { statusLabel, statusTone } from '../../utilities/project-labels';
import { matchesSearch } from '../../shared/utils/text-search';

/** A stretch of time during which a project held one status. `to` is null for its current status. */
interface Period {
  status: string;
  from: Date;
  to: Date | null;
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
 * Status history of the research projects, from the backend's record of every
 * status change: one list of projects, most recently changed first, each
 * opening onto its timeline, and next to it a year-by-status count table whose
 * cells narrow the list to the projects behind that number.
 */
@Component({
  selector: 'app-status-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminNavbarComponent, AdminSidebarComponent],
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

    forkJoin({
      projects: this.projectService.getAllProjects(),
      groups: this.projectGroupService.getProjectGroups(),
      changes: this.projectService.getStatusChanges(),
    }).subscribe({
      next: ({ projects, groups, changes }) => {
        this.load(projects, groups.map(g => g.title), changes);
        this.loading = false;
        this.openFromUrl();
      },
      error: err => {
        console.error('Error loading status history:', err);
        this.error = 'The status history could not be loaded.';
        this.loading = false;
      },
    });
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
    this.sidebarService.toggleSidebar();
  }

  private load(projects: any[], groupTitles: string[], changes: ProjectStatusChange[]): void {
    const byProject = new Map<number, ProjectStatusChange[]>();
    for (const c of changes) {
      const list = byProject.get(c.projectId) ?? [];
      list.push(c);
      byProject.set(c.projectId, list);
    }

    this.rows = projects.map(project => {
      const changes = (byProject.get(project.id) ?? [])
        .sort((a, b) => parseDate(a.changedAt).getTime() - parseDate(b.changedAt).getTime() || a.id - b.id);
      const periods = changes.map((row, i) => ({
        status: row.status,
        from: parseDate(row.changedAt),
        to: i + 1 < changes.length ? parseDate(changes[i + 1].changedAt) : null,
      }));
      return { project, periods, lastChange: periods.length ? periods[periods.length - 1].from : null };
    }).sort((a, b) => (b.lastChange?.getTime() ?? 0) - (a.lastChange?.getTime() ?? 0)
      || String(a.project.acronyme || '').localeCompare(String(b.project.acronyme || '')));

    const known = new Set(groupTitles.map(normalize));
    const extra = changes.map(c => c.status).filter(st => st && !known.has(normalize(st)));
    // Same order as the project dialog: Ongoing, Achieved, Submitted, Rejected, then others.
    const rank = ['ONGOING', 'ACHIEVED', 'SUBMITTED', 'REJECTED'];
    const pos = (t: string) => {
      const i = rank.findIndex(r => normalize(t).includes(r));
      return i < 0 ? rank.length : i;
    };
    this.statuses = [...groupTitles, ...Array.from(new Set(extra))].sort((a, b) => pos(a) - pos(b));

    const now = new Date().getFullYear();
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

  formatDate(date: Date): string {
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }

  /** "2 yr 3 mo", "5 mo", "12 days". */
  duration(from: Date, to: Date | null): string {
    const end = to ?? new Date();
    let months = (end.getFullYear() - from.getFullYear()) * 12 + end.getMonth() - from.getMonth();
    if (end.getDate() < from.getDate()) months--;
    if (months < 1) {
      const days = Math.max(Math.round((end.getTime() - from.getTime()) / 86_400_000), 0);
      return days === 1 ? '1 day' : `${days} days`;
    }
    const years = Math.floor(months / 12);
    const rest = months % 12;
    return [years ? `${years} yr` : '', rest ? `${rest} mo` : ''].filter(Boolean).join(' ');
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

/** A LocalDateTime from the backend: an ISO string, or [y, m, d, h, min, ...] if serialized as an array. */
function parseDate(value: string | number[]): Date {
  if (Array.isArray(value)) return new Date(value[0], value[1] - 1, value[2], value[3] ?? 0, value[4] ?? 0);
  return new Date(value);
}
