import { Component, DestroyRef, HostBinding, HostListener, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AutosizeDirective } from './autosize.directive';
import { CvHintDirective } from './cv-hint.directive';
import { UpbuttonComponent } from '../utilities/Upbutton/upbutton.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { AdminNavbarComponent } from '../utilities/admin-navbar/admin-navbar.component';
import { AdminSidebarComponent } from '../utilities/admin-sidebar/admin-sidebar.component';
import { SidebarService } from '../services/sidebarservice';
import { ThemeService } from '../services/ThemeService';
import {
  CrewCv, CrewCvService, CvEntry, CvSection, CvSectionKind, CV_SECTION_PRESETS, MAX_SECTION_DEPTH,
  cvCardKey, nameSimilarity, newSection, normalizeCv, sectionNumber, standardCv,
} from '../services/CrewCvService';
import { PortalProjectsService } from '../portal/services/portal-projects.service';
import { PortalProject } from '../portal/models/portal-project.model';
import { catchError, filter, forkJoin, of, switchMap, take } from 'rxjs';
import { LANDING_TEAM_PEOPLE } from '../projects-landing/pages/landing-team/landing-team.people';
import { importCvFromDocx, readFileAsDataUrl, resizeImage } from './cv-docx-import';

type EditorTab = 'profile' | 'details' | 'sections' | 'links';

/** A person card somewhere on the site that a CV can be linked to. */
interface PersonCard {
  key: string;
  name: string;
  role: string;
  /** Where it is shown, for the admin: "Team page", "Portal · <project>". */
  where: string;
  image?: string;
}

/** Name likeness from which a card is suggested (see nameSimilarity). */
const SUGGEST_FROM = 0.5;

interface PendingConfirm {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  action: () => void;
}

@Component({
  selector: 'app-crewcvsadmin',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, AutosizeDirective, CvHintDirective, UpbuttonComponent, AdminNavbarComponent, AdminSidebarComponent],
  templateUrl: './crewcvsadmin.component.html',
  styleUrls: ['./crewcvsadmin.component.scss'],
})
export class CrewcvsadminComponent implements OnInit {
  @HostBinding('class.theme-light') get isLight() { return this.themeService.isLight; }

  readonly presets = CV_SECTION_PRESETS;
  readonly maxDepth = MAX_SECTION_DEPTH;
  readonly kinds: { value: CvSectionKind; label: string; hint: string; icon: string }[] = [
    { value: 'list', label: 'Bulleted list', hint: 'Experience, skills, short items', icon: 'bx-list-ul' },
    { value: 'numbered', label: 'Numbered list', hint: 'Publications, communications', icon: 'bx-list-ol' },
    { value: 'paragraph', label: 'Paragraphs', hint: 'Free text, descriptions', icon: 'bx-paragraph' },
    { value: 'table', label: 'Table', hint: 'Rows and columns', icon: 'bx-table' },
  ];
  /** Section whose "Display as" menu is open. */
  kindMenuFor: string | null = null;

  kindOf(kind: CvSectionKind) {
    return this.kinds.find(k => k.value === kind) ?? this.kinds[0];
  }

  setKind(sec: CvSection, kind: CvSectionKind): void {
    this.kindMenuFor = null;
    if (sec.kind === kind) return;
    sec.kind = kind;
    this.onKindChange(sec);
  }

  /** Clicking anywhere else closes an open menu. */
  @HostListener('document:click')
  closeMenus(): void {
    this.kindMenuFor = null;
    this.presetMenuFor = null;
  }

  isSidebarVisible = true;
  members: CrewCv[] = [];
  loading = true;
  search = '';

  /** The CV being edited; a new member has no slug until first saved. */
  selected: CrewCv | null = null;
  tab: EditorTab = 'profile';
  dirty = false;
  saving = false;
  importing = false;

  expanded = new Set<string>();
  pasteFor: string | null = null;
  pasteText = '';
  presetMenuFor: string | null = null;
  confirm: PendingConfirm | null = null;
  /** Personal field under the mouse, highlighted in both the editor and the preview. */
  hoverField: number | null = null;

  /** Every person card on the site: the public Team page and each portal's Team page. */
  private allCards: PersonCard[] = [];
  showAllCards = false;

  constructor(
    private crewCvService: CrewCvService,
    private messageService: MessageService,
    private sidebarService: SidebarService,
    private portalProjectsService: PortalProjectsService,
    private router: Router,
    private location: Location,
    private destroyRef: DestroyRef,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.sidebarService.sidebarVisibility$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.isSidebarVisible = v);
    this.loadList();
    this.loadCards();
  }

  // ── Linked cards ──────────────────────────────────────────────────────────

  private loadCards(): void {
    const team: PersonCard[] = LANDING_TEAM_PEOPLE.map(p => ({
      key: cvCardKey('team', p.name), name: p.name, role: p.role, where: 'Team page',
    }));
    this.allCards = team;
    // The project list comes without content (team included), so each project
    // is loaded on its own, the way its portal Team page does.
    // getBySlug writes each project back into the store, which re-emits the
    // list: only the first non-empty list is used, or the loads would restart.
    this.portalProjectsService.list()
      .pipe(
        filter(metas => metas.length > 0),
        take(1),
        switchMap(metas => forkJoin(metas.map(m =>
          this.portalProjectsService.getBySlug(m.slug).pipe(catchError(() => of(null)))))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(loaded => {
        const projects = loaded.filter((p): p is PortalProject => !!p);
        const portal: PersonCard[] = [];
        for (const project of projects) {
          for (const section of project.content?.team?.sections ?? []) {
            for (const person of section.members ?? []) {
              if (!person.name?.trim()) continue;
              portal.push({
                key: cvCardKey(`portal:${project.slug}`, person.name),
                name: person.name,
                role: [person.role, person.institute].filter(Boolean).join(' · '),
                where: `Portal · ${project.title}`,
                image: person.image || undefined,
              });
            }
          }
        }
        this.allCards = [...team, ...portal];
      });
  }

  /** Linked cards first, then by how close the name is to the member's. */
  get cardRows(): { card: PersonCard; score: number; linked: boolean; linkedTo?: string }[] {
    const s = this.selected;
    if (!s) return [];
    const linked = new Set(s.linkedCards ?? []);
    return this.allCards
      .map(card => ({
        card,
        score: nameSimilarity(s.fullName, card.name),
        linked: linked.has(card.key),
        linkedTo: this.members.find(m => m.slug !== s.slug && m.linkedCards?.includes(card.key))?.fullName,
      }))
      .filter(r => r.linked || this.showAllCards || r.score >= SUGGEST_FROM)
      .sort((a, b) => Number(b.linked) - Number(a.linked) || b.score - a.score || a.card.name.localeCompare(b.card.name));
  }

  get linkedCount(): number {
    return this.selected?.linkedCards?.length ?? 0;
  }

  toggleCardLink(card: PersonCard): void {
    const s = this.selected;
    if (!s) return;
    const keys = new Set(s.linkedCards ?? []);
    if (keys.has(card.key)) keys.delete(card.key); else keys.add(card.key);
    s.linkedCards = [...keys];
    this.markDirty();
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
    this.sidebarService.toggleSidebar();
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent): void {
    if (this.dirty) { e.preventDefault(); e.returnValue = ''; }
  }

  /** Any typing inside the editor; structural edits call markDirty() themselves. */
  markDirty(): void { this.dirty = true; }

  // ── Member list ───────────────────────────────────────────────────────────

  get filteredMembers(): CrewCv[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.members;
    return this.members.filter(m => `${m.fullName} ${m.title ?? ''}`.toLowerCase().includes(q));
  }

  loadList(): void {
    this.loading = true;
    this.crewCvService.list().subscribe({
      next: list => { this.members = list; this.loading = false; },
      error: () => {
        this.loading = false;
        this.toast('error', 'Could not load crew members');
      },
    });
  }

  select(member: CrewCv): void {
    if (member.slug && member.slug === this.selected?.slug) return;
    this.guardUnsaved(() => {
      this.crewCvService.get(member.slug!).subscribe({
        next: full => this.openEditor({ ...full, cv: normalizeCv(full.cv) }),
        error: () => this.toast('error', 'Could not load this CV'),
      });
    });
  }

  startNew(): void {
    this.guardUnsaved(() => {
      this.openEditor({ fullName: '', title: '', photo: null, published: false, cv: standardCv() });
      this.dirty = true;
    });
  }

  private openEditor(cv: CrewCv): void {
    this.selected = cv;
    this.tab = 'profile';
    this.dirty = false;
    this.pasteFor = null;
    this.expanded.clear();
    // Short CVs open expanded; a long imported one opens as an outline.
    if (this.countSections(cv.cv!.sections) <= 8) this.expandAll();
  }

  onListDrop(e: CdkDragDrop<CrewCv[]>): void {
    // Dragging is disabled while searching, so indexes match `members`.
    if (e.previousIndex === e.currentIndex) return;
    moveItemInArray(this.members, e.previousIndex, e.currentIndex);
    this.crewCvService.reorder(this.members.map(m => m.slug!)).subscribe({
      error: () => { this.toast('error', 'Could not save the new order'); this.loadList(); },
    });
  }

  // ── Save / delete / preview ───────────────────────────────────────────────

  save(): void {
    const s = this.selected;
    if (!s || this.saving) return;
    if (!s.fullName.trim()) {
      this.tab = 'profile';
      this.toast('warn', 'The full name is required');
      return;
    }
    this.saving = true;
    const req = s.slug ? this.crewCvService.update(s.slug, s) : this.crewCvService.create(s);
    req.subscribe({
      next: saved => {
        this.saving = false;
        this.dirty = false;
        this.selected = { ...saved, cv: normalizeCv(saved.cv) };
        const { cv, ...meta } = saved;
        const i = this.members.findIndex(m => m.slug === saved.slug);
        if (i >= 0) this.members[i] = meta; else this.members.push(meta);
        this.toast('success', `${saved.fullName}'s CV saved`);
      },
      error: err => {
        this.saving = false;
        this.toast('error', typeof err?.error === 'string' ? err.error : 'Could not save the CV');
      },
    });
  }

  askDelete(): void {
    const s = this.selected;
    if (!s) return;
    if (!s.slug) { this.selected = null; this.dirty = false; return; }
    this.confirm = {
      title: 'Delete this CV?',
      message: `${s.fullName} and their whole CV will be removed. This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      action: () => this.crewCvService.delete(s.slug!).subscribe({
        next: () => {
          this.members = this.members.filter(m => m.slug !== s.slug);
          this.selected = null;
          this.dirty = false;
          this.toast('success', 'CV deleted');
        },
        error: () => this.toast('error', 'Could not delete the CV'),
      }),
    };
  }

  preview(): void {
    if (!this.selected?.slug) {
      this.toast('info', 'Save the CV once to preview it');
      return;
    }
    if (this.dirty) this.toast('info', 'The preview shows the last saved version');
    // Through the router + base href: deployed, the app lives under /bassiana/.
    const path = this.router.serializeUrl(this.router.createUrlTree(['/cv', this.selected.slug]));
    window.open(this.location.prepareExternalUrl(path), '_blank');
  }

  togglePublished(): void {
    if (!this.selected) return;
    this.selected.published = !this.selected.published;
    this.markDirty();
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  async onPhotoSelected(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.selected) return;
    if (!file.type.startsWith('image/')) { this.toast('warn', 'Choose an image file'); return; }
    try {
      this.selected.photo = await resizeImage(await readFileAsDataUrl(file), 400);
      this.markDirty();
    } catch {
      this.toast('error', 'Could not read this image');
    }
  }

  removePhoto(): void {
    if (!this.selected) return;
    this.selected.photo = null;
    this.markDirty();
  }

  async onDocxSelected(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.selected) return;
    const target = this.selected;
    const hasContent = this.countSections(target.cv!.sections) > 0 && target.cv!.sections.some(s => this.hasEntries(s));
    const run = async () => {
      this.importing = true;
      try {
        const result = await importCvFromDocx(file);
        target.cv = result.cv;
        if (result.fullName && !target.fullName.trim()) target.fullName = result.fullName;
        if (result.photo && !target.photo) target.photo = result.photo;
        const position = result.cv.summary.find(b => /position|situation|poste/i.test(b.title));
        if (position && !target.title?.trim()) target.title = position.text;
        this.expanded.clear();
        this.markDirty();
        this.tab = 'sections';
        this.toast('success', `Imported ${result.sectionCount} sections and ${result.entryCount} entries — review, then save`);
      } catch {
        this.toast('error', 'Could not read this Word file');
      } finally {
        this.importing = false;
      }
    };
    if (hasContent) {
      this.confirm = {
        title: 'Replace the CV content?',
        message: `The personal details and all sections will be replaced by the content of ${file.name}. Nothing is saved until you press Save.`,
        confirmLabel: 'Replace',
        action: run,
      };
    } else {
      run();
    }
  }

  // ── Generic list helpers (fields, summary blocks, entries, sections) ──────

  move<T>(list: T[], i: number, dir: number): void {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    this.markDirty();
  }

  /** Drag & drop reorder of personal fields / summary blocks. */
  dropInto<T>(list: T[], e: CdkDragDrop<unknown>): void {
    if (e.previousIndex === e.currentIndex) return;
    moveItemInArray(list, e.previousIndex, e.currentIndex);
    this.markDirty();
  }

  removeAt<T>(list: T[], i: number): void {
    list.splice(i, 1);
    this.markDirty();
  }

  addField(): void {
    this.selected!.cv!.fields.push({ label: '', value: '' });
    this.markDirty();
  }

  addSummary(): void {
    this.selected!.cv!.summary.push({ title: '', text: '' });
    this.markDirty();
  }

  // ── Sections ──────────────────────────────────────────────────────────────

  addSection(list: CvSection[], title = '', kind: CvSectionKind = 'list'): void {
    const sec = newSection(title, kind);
    if (kind === 'table') this.ensureTable(sec);
    list.push(sec);
    this.expanded.add(sec.id);
    this.presetMenuFor = null;
    this.markDirty();
  }

  askRemoveSection(list: CvSection[], i: number): void {
    const sec = list[i];
    const n = this.countEntries(sec);
    if (!n && !sec.children.length) { this.removeAt(list, i); return; }
    this.confirm = {
      title: 'Remove this section?',
      message: `"${sec.title || 'Untitled section'}" and everything in it (${n} entr${n === 1 ? 'y' : 'ies'}${sec.children.length ? `, ${sec.children.length} subsection(s)` : ''}) will be removed.`,
      confirmLabel: 'Remove',
      danger: true,
      action: () => this.removeAt(list, i),
    };
  }

  toggleHidden(sec: CvSection): void {
    sec.hidden = !sec.hidden;
    this.markDirty();
  }

  toggle(sec: CvSection): void {
    if (this.expanded.has(sec.id)) this.expanded.delete(sec.id); else this.expanded.add(sec.id);
  }

  expandAll(): void {
    const walk = (list: CvSection[]) => list.forEach(s => { this.expanded.add(s.id); walk(s.children); });
    walk(this.selected?.cv?.sections ?? []);
  }

  collapseAll(): void { this.expanded.clear(); }

  onKindChange(sec: CvSection): void {
    if (sec.kind === 'table') this.ensureTable(sec);
    this.markDirty();
  }

  number(depth: number, index: number, parentIndex: number): string {
    return this.selected?.cv?.numbering ? sectionNumber(depth, index + 1, parentIndex + 1) : '';
  }

  depthLabel(depth: number): string {
    return ['Part', 'Section', 'Subsection'][depth] ?? 'Section';
  }

  // ── Entries ───────────────────────────────────────────────────────────────

  addEntry(sec: CvSection): void {
    sec.entries.push({ period: '', text: '' });
    this.markDirty();
  }

  toggleHeading(e: CvEntry): void {
    if (e.heading) delete e.heading; else { e.heading = true; e.period = ''; }
    this.markDirty();
  }

  openPaste(sec: CvSection): void {
    this.pasteFor = this.pasteFor === sec.id ? null : sec.id;
    this.pasteText = '';
  }

  /** One entry per non-empty line; "2019-2021: text" splits into period + text. */
  applyPaste(sec: CvSection): void {
    const entries: CvEntry[] = this.pasteText.split(/\r?\n/)
      .map(l => l.replace(/^\s*(?:[-•*▪●]|\d+[.)])\s+/, '').trim())
      .filter(Boolean)
      .map(line => {
        const c = line.indexOf(':');
        if (c > 0 && c <= 60 && /\d/.test(line.slice(0, c)) && line.slice(c + 1, c + 3) !== '//') {
          return { period: line.slice(0, c).trim(), text: line.slice(c + 1).trim() };
        }
        return { period: '', text: line };
      });
    sec.entries.push(...entries);
    this.pasteFor = null;
    this.pasteText = '';
    if (entries.length) this.markDirty();
  }

  // ── Tables ────────────────────────────────────────────────────────────────

  ensureTable(sec: CvSection): void {
    if (!sec.table) sec.table = { columns: ['Column 1', 'Column 2'], rows: [['', '']] };
  }

  addColumn(sec: CvSection): void {
    sec.table!.columns.push(`Column ${sec.table!.columns.length + 1}`);
    sec.table!.rows.forEach(r => r.push(''));
    this.markDirty();
  }

  removeColumn(sec: CvSection, j: number): void {
    if (sec.table!.columns.length <= 1) return;
    sec.table!.columns.splice(j, 1);
    sec.table!.rows.forEach(r => r.splice(j, 1));
    this.markDirty();
  }

  addRow(sec: CvSection): void {
    sec.table!.rows.push(sec.table!.columns.map(() => ''));
    this.markDirty();
  }

  removeTable(sec: CvSection): void {
    sec.table = undefined;
    if (sec.kind === 'table') sec.kind = 'list';
    this.markDirty();
  }

  // ── Misc ──────────────────────────────────────────────────────────────────

  countEntries(sec: CvSection): number {
    return sec.entries.length + (sec.table?.rows.length ?? 0)
      + sec.children.reduce((n, c) => n + this.countEntries(c), 0);
  }

  private countSections(list: CvSection[]): number {
    return list.reduce((n, s) => n + 1 + this.countSections(s.children), 0);
  }

  private hasEntries(sec: CvSection): boolean {
    return this.countEntries(sec) > 0;
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || '?';
  }

  trackById = (_: number, s: CvSection) => s.id;
  trackByIndex = (i: number) => i;
  // cardRows builds new row objects on every check; without this each check
  // re-created the rows, so a Link button vanished between mousedown and click.
  trackByCard = (_: number, r: { card: PersonCard }) => r.card.key;

  runConfirm(): void {
    const action = this.confirm?.action;
    this.confirm = null;
    action?.();
  }

  private guardUnsaved(next: () => void): void {
    if (!this.dirty) { next(); return; }
    this.confirm = {
      title: 'Discard unsaved changes?',
      message: `Your changes to ${this.selected?.fullName || 'this CV'} have not been saved.`,
      confirmLabel: 'Discard',
      danger: true,
      action: () => { this.dirty = false; next(); },
    };
  }

  private toast(severity: 'success' | 'info' | 'warn' | 'error', detail: string): void {
    const summary = { success: 'Done', info: 'Info', warn: 'Check', error: 'Error' }[severity];
    this.messageService.add({ severity, summary, detail });
  }
}
