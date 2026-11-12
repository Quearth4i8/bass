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
import { STAGES, STAGE_DATE_FIELD, StatusStage, laterStages, previousStage, stagePath, stageTitle, statusLabel, statusStage, statusTone } from '../../utilities/project-labels';
import { DateFilterComponent } from '../../shared/components/date-filter/date-filter.component';
import { matchesSearch } from '../../shared/utils/text-search';

/** A stretch of time during which a project held one status. `to` is null for its current status. */
interface Period {
  status: string;
  from: Date;
  to: Date | null;
  /** The project field holding the date it took this status ('ongoingDate'...); null for a status outside the tree. */
  field: string | null;
  /** No date stored: `from` is the backend's guess. */
  estimated: boolean;
}

/** A box of the workflow diagram: one status, and how far the project got with it. */
interface FlowNode {
  stage: StatusStage;
  /** The status's project group title ("ONGOING PROJECTS"). */
  title: string;
  field: string;
  /** When the project held it; null when it never did. */
  period: Period | null;
  /** done: passed through; next: one the project can move on to; off: not on its way. */
  state: 'done' | 'current' | 'next' | 'off';
  col: number;
  row: number;
}

/** A link from a status to one that can follow it, with the time it took when the project went that way. */
interface FlowEdge {
  to: StatusStage;
  path: string;
  state: 'taken' | 'next' | 'off';
  tone: string;
  /** "1 y 3 mo" between the two dates; null unless taken. */
  label: string | null;
  /** The label's place, in the diagram's 600 x 500 drawing units. */
  x: number;
  y: number;
}

/**
 * Where each status sits in the diagram: its column, and the first of the two
 * rows (of five) it covers, so boxes in a column never overlap. The tree reads
 * left to right: Submitted branches to Rejected and Ongoing, Ongoing to
 * Canceled and Achieved.
 */
/**
 * The drawing is 600 units wide: three box columns of FLOW_COL with FLOW_GAP
 * between them (the links run in the gaps). Matches .flow's column-gap: 9%
 * (54 / 600) and boxes filling their column, so the first box starts and the
 * last one ends flush with the row.
 */
const FLOW_GAP = 54;
const FLOW_COL = (600 - 2 * FLOW_GAP) / 3;

const FLOW_POS: Record<StatusStage, { col: number; row: number }> = {
  SUBMITTED: { col: 1, row: 2 },
  REJECTED: { col: 2, row: 1 },
  ONGOING: { col: 2, row: 3 },
  // Level with Rejected / Ongoing: four grid rows instead of five.
  CANCELED: { col: 3, row: 1 },
  ACHIEVED: { col: 3, row: 3 },
};

/** A project with its status timeline, oldest period first. */
interface Row {
  project: any;
  periods: Period[];
  /** When its status last changed; null without history. */
  lastChange: Date | null;
  nodes: FlowNode[];
  edges: FlowEdge[];
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

  /** The date stored for the status; '' (an empty field) when the project has none. */
  dateValue(row: Row, node: FlowNode): string {
    return row.project[node.field] || '';
  }

  /**
   * A date picked in the diagram: saved to the project once the admin stops
   * picking. On a status the project hasn't reached, it moves the project on to it.
   */
  onDatePicked(row: Row, node: FlowNode, value: string): void {
    const field = node.field;
    if (!value || value === row.project[field]) return;
    const key = `${row.project.id}:${field}`;
    clearTimeout(this.pendingSaves.get(key));
    this.pendingSaves.set(key, setTimeout(() => {
      this.pendingSaves.delete(key);
      this.save(row, node.state === 'next' ? { [field]: value, title: node.title } : { [field]: value });
    }, 800));
  }

  /**
   * A status date taken off: the project never got there, so the statuses
   * after it go too and it steps back to the one before (Submitted stays,
   * without its date).
   */
  clearDate(row: Row, node: FlowNode): void {
    const stage = node.stage;
    if (!row.project[node.field]) return;
    const changes: Record<string, any> = {};
    for (const s of [stage, ...laterStages(stage)]) {
      changes[STAGE_DATE_FIELD[s]] = null;
      // A date still being picked for one of them must not land afterwards.
      const key = `${row.project.id}:${STAGE_DATE_FIELD[s]}`;
      clearTimeout(this.pendingSaves.get(key));
      this.pendingSaves.delete(key);
    }
    changes['title'] = stageTitle(previousStage(stage) ?? stage, this.statuses);
    this.save(row, changes);
  }

  private save(row: Row, changes: Record<string, any>): void {
    this.saveError = null;
    this.savingId = row.project.id;
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
   * The line under a box: how long Ongoing ran (to Achieved or Canceled, or
   * the planned end date). Guessed dates are never shown.
   */
  nodeNote(row: Row, node: FlowNode): string {
    // 'next' needs no note: its NEXT tag and "Pick the date" field say it.
    if (node.state === 'next') return '';
    // No date saved: the field is simply left empty, no note.
    if (!node.period) return '';
    // How long it ran shows on the link to the status that ended it.
    if (node.stage === 'ONGOING' && node.state === 'current') {
      const end = this.endDate(row);
      if (end) return `${end < new Date() ? 'Ended' : 'Planned end'} ${this.formatDate(end)}`;
    }
    return '';
  }

  trackRow(_: number, row: Row): number {
    return row.project.id;
  }

  trackNode(_: number, node: FlowNode): StatusStage {
    return node.stage;
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
        estimated: row.estimated,
      }));
      return { project, periods, lastChange: periods.length ? periods[periods.length - 1].from : null, nodes: [], edges: [] } as Row;
    }).sort((a, b) => (b.lastChange?.getTime() ?? 0) - (a.lastChange?.getTime() ?? 0)
      || String(a.project.acronyme || '').localeCompare(String(b.project.acronyme || '')));

    for (const row of this.rows) this.buildFlow(row, groupTitles);

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

  /** The workflow diagram of a project: a box per status, linked as the statuses can follow each other. */
  private buildFlow(row: Row, groupTitles: string[]): void {
    const current = statusStage(row.project.title);
    const periodOf = (stage: StatusStage) => row.periods.find(p => statusStage(p.status) === stage) ?? null;
    const last = row.periods[row.periods.length - 1];

    row.nodes = STAGES.map(stage => {
      const period = periodOf(stage);
      // A status before the current one was passed through, dated or not.
      const passed = !!period || (!!current && stage !== current && stagePath(current).includes(stage));
      const state: FlowNode['state'] = stage === current && (!period || period === last) ? 'current'
        : passed ? 'done'
        : (current ? previousStage(stage) === current : stage === 'SUBMITTED') ? 'next' : 'off';
      return { stage, title: stageTitle(stage, groupTitles), field: STAGE_DATE_FIELD[stage], period, state, ...FLOW_POS[stage] };
    });

    // A box in drawing units: its left edge, and its centre row line (four rows of 100; a box covers two rows).
    const at = (stage: StatusStage) => ({ x: (FLOW_POS[stage].col - 1) * (FLOW_COL + FLOW_GAP), y: FLOW_POS[stage].row * 100 });
    row.edges = row.nodes.filter(n => previousStage(n.stage)).map(n => {
      const from = previousStage(n.stage)!;
      const a = at(from);
      const b = at(n.stage);
      // From the source box's right edge to the target's left edge, so the
      // whole S-curve shows in the gap between them.
      const x1 = a.x + FLOW_COL, x2 = b.x;
      const mid = (x1 + x2) / 2;
      const bend = (x2 - x1) * .55;
      const before = periodOf(from);
      const taken = n.state === 'done' || n.state === 'current';
      return {
        to: n.stage,
        path: `M ${x1} ${a.y} C ${x1 + bend} ${a.y}, ${x2 - bend} ${b.y}, ${x2} ${b.y}`,
        state: taken ? 'taken' : n.state === 'next' ? 'next' : 'off',
        tone: statusTone(n.title),
        // Only between two saved dates: a guessed date is never shown, so neither is a span measured from one.
        label: taken && before && n.period && row.project[STAGE_DATE_FIELD[from]] && row.project[n.field]
          ? span(before.from, n.period.from) : null,
        x: mid,
        y: (a.y + b.y) / 2,
      } as FlowEdge;
    });
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

/** The time between two dates, roughly: "12 d", "5 mo", "2 y 3 mo". */
function span(from: Date, to: Date): string {
  const days = Math.round((to.getTime() - from.getTime()) / 86400000);
  if (days < 0) return '';
  if (days < 60) return `${days} d`;
  const months = Math.round(days / 30.44);
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  return months % 12 ? `${years} y ${months % 12} mo` : `${years} y`;
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
