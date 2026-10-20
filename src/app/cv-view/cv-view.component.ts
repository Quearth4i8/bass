import { Component, HostBinding, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ThemeService } from '../services/ThemeService';
import { UpbuttonComponent } from '../utilities/Upbutton/upbutton.component';
import { CrewCv, CrewCvService, CvSection, CvSectionKind, normalizeCv, sectionNumber } from '../services/CrewCvService';

/**
 * Text split into runs: plain, bold (**...** in the stored text) and links,
 * so it renders as <strong>/<a> without innerHTML.
 */
interface Seg { t: string; href?: string; b?: boolean; }

interface ViewEntry {
  period: string;
  segs: Seg[];
  heading: boolean;
  /** Stacked layout only: the entry's first line, its "Key: value" details and the rest. */
  title?: Seg[];
  meta?: { k: string; v: Seg[] }[];
  body?: Seg[][];
}

interface ViewSection {
  anchor: string;
  num: string;
  title: string;
  kind: CvSectionKind;
  depth: number;
  entries: ViewEntry[];
  /** Lay entries out as a label column + text column. */
  hasPeriods: boolean;
  /**
   * Labeled entries: label tag + first line, then short "Key: value" details
   * side by side, then the rest, all full width. Replaces the label column,
   * which left a mostly empty gutter beside short labels.
   */
  stacked: boolean;
  table?: { columns: string[]; rows: Seg[][][] };
  children: ViewSection[];
}

const LINK = /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]|www\.[^\s<>()]+[^\s<>().,;:!?'"]|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/gi;

const BOLD =/\*\*(.+?)\*\*/gs;

function linkify(text: string): Seg[] {
  const out: Seg[] = [];
  let last = 0;
  for (const m of text.matchAll(BOLD)) {
    const i = m.index ?? 0;
    if (i > last) out.push(...links(text.slice(last, i)));
    out.push(...links(m[1]).map(s => ({ ...s, b: true })));
    last = i + m[0].length;
  }
  if (last < text.length) out.push(...links(text.slice(last)));
  return out;
}

function links(text: string): Seg[] {
  const out: Seg[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ t: text.slice(last, i) });
    const v = m[0];
    const href = v.includes('@') && !v.includes('/') ? `mailto:${v}` : v.startsWith('www.') ? `https://${v}` : v;
    out.push({ t: v, href });
    last = i + v.length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out;
}

/** "Role in the project: Member" -> a detail; long or URL-led lines stay text. */
const META_LINE = /^([^:]{2,32}?)\s*:\s*(.+)$/;

function splitStacked(e: ViewEntry, text: string): ViewEntry {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const meta: { k: string; v: Seg[] }[] = [];
  const body: Seg[][] = [];
  for (const line of lines.slice(1)) {
    const m = META_LINE.exec(line);
    const key = m?.[1].replace(/\*\*/g, '').trim();
    const value = m?.[2].replace(/\*\*/g, '').trim();
    if (m && key && value && !/https?$|www/i.test(key) && line.length <= 160) meta.push({ k: key, v: linkify(m[2]) });
    else body.push(linkify(line));
  }
  return { ...e, title: linkify(lines[0] ?? ''), meta, body };
}

/**
 * A label column only pays off when most items have a label (dates, roles);
 * with a few stray ones it leaves a blank gutter, so they go inline instead.
 */
function mostlyLabeled(entries: ViewEntry[]): boolean {
  const items = entries.filter(e => !e.heading);
  return items.length > 0 && items.filter(e => e.period).length / items.length >= 0.6;
}

@Component({
  selector: 'app-cv-view',
  standalone: true,
  imports: [CommonModule, RouterLink, UpbuttonComponent],
  templateUrl: './cv-view.component.html',
  styleUrls: ['./cv-view.component.scss'],
})
export class CvViewComponent implements OnInit, OnDestroy {
  @HostBinding('class.theme-light') get isLight() { return this.themeService.isLight; }

  loading = true;
  notFound = false;
  member: CrewCv | null = null;
  edition = '';
  fields: { label: string; segs: Seg[] }[] = [];
  summary: { title: string; segs: Seg[] }[] = [];
  sections: ViewSection[] = [];
  /** Sections listed in the side contents: parts and their sections. */
  showToc = false;
  activeAnchor = '';
  activePart = '';

  private previousTitle = '';
  private partOf = new Map<string, string>();
  private spy?: IntersectionObserver;
  private printStyle?: HTMLStyleElement;

  constructor(
    private route: ActivatedRoute,
    private crewCvService: CrewCvService,
    private titleService: Title,
    private location: Location,
    private zone: NgZone,
    private router: Router,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.previousTitle = this.titleService.getTitle();
    this.route.paramMap.subscribe(p => this.load(p.get('slug') ?? ''));
  }

  ngOnDestroy(): void {
    this.titleService.setTitle(this.previousTitle);
    this.spy?.disconnect();
    this.printStyle?.remove();
  }

  /**
   * Printed / PDF pages get the Word CV's running header ("Curriculum Vitae"
   * left, the name right, a rule under) and "Page N" bottom right. @page margin
   * boxes cannot read the DOM, so the rule is written with the name; Chrome and
   * Edge render it, other browsers print without it.
   */
  private setPrintHeader(name: string): void {
    const quoted = `"${name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    // A margin box fills the whole top margin, so its rule would touch the
    // text: margin-bottom keeps a gap between the header line and the page body.
    const box = `font: 10pt Georgia, 'Times New Roman', serif; color: #6b7280; border-bottom: 1px solid #6b7280; vertical-align: bottom; padding-bottom: 3pt; margin-bottom: 7mm;`;
    this.printStyle?.remove();
    this.printStyle = document.createElement('style');
    this.printStyle.textContent = `
      @page {
        size: A4; margin: 28mm 18mm 18mm;
        @top-left { content: "Curriculum Vitae"; ${box} }
        @top-center { content: ""; ${box} }
        @top-right { content: ${quoted}; ${box} }
        @bottom-right { content: "Page " counter(page); font: 9pt Georgia, 'Times New Roman', serif; color: #6b7280; }
      }`;
    document.head.appendChild(this.printStyle);
  }

  /** Highlights in the contents the part/section currently at the top of the screen. */
  private watchScroll(): void {
    this.spy?.disconnect();
    this.partOf.clear();
    for (const p of this.sections) {
      this.partOf.set(p.anchor, p.anchor);
      p.children.forEach(c => this.partOf.set(c.anchor, p.anchor));
    }
    this.activeAnchor = this.activePart = this.sections[0]?.anchor ?? '';
    this.spy = new IntersectionObserver(entries => {
      const hit = entries.filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!hit) return;
      this.zone.run(() => {
        this.activeAnchor = hit.target.id;
        this.activePart = this.partOf.get(hit.target.id) ?? this.activePart;
      });
    }, { rootMargin: '-80px 0px -70% 0px' });
    this.partOf.forEach((_, anchor) => {
      const el = document.getElementById(anchor);
      if (el) this.spy!.observe(el);
    });
  }

  private load(slug: string): void {
    this.loading = true;
    this.notFound = false;
    this.crewCvService.get(slug).subscribe({
      next: member => {
        const cv = normalizeCv(member.cv);
        this.member = member;
        this.edition = cv.edition ?? '';
        this.fields = cv.fields.filter(f => f.value.trim()).map(f => ({ label: f.label, segs: linkify(f.value) }));
        this.summary = cv.summary.filter(b => b.text.trim()).map(b => ({ title: b.title, segs: linkify(b.text) }));
        this.sections = this.build(cv.sections, 0, 0, cv.numbering);
        this.showToc = this.sections.reduce((n, s) => n + 1 + s.children.length, 0) >= 4;
        this.titleService.setTitle(`${member.fullName} — CV`);
        this.setPrintHeader(member.fullName);
        this.loading = false;
        if (this.showToc) setTimeout(() => this.watchScroll());
      },
      error: () => {
        this.notFound = true;
        this.loading = false;
      },
    });
  }

  private build(list: CvSection[], depth: number, parentIndex: number, numbering: boolean): ViewSection[] {
    let shown = 0;
    return list.filter(s => !s.hidden).map(s => {
      shown++;
      const kept = s.entries.filter(e => e.text.trim() || e.period?.trim());
      let entries: ViewEntry[] = kept.map(e => e.heading
        ? { period: '', segs: [{ t: e.text.trim() }], heading: true }
        : { period: e.period?.trim() ?? '', segs: linkify(e.text), heading: false });
      const labeled = s.kind !== 'paragraph' && mostlyLabeled(entries);
      // Every labeled section uses the same layout (label tag + full-width text),
      // whether its entries are one line or several.
      const stacked = labeled;
      if (stacked) entries = entries.map((v, i) => v.heading ? v : splitStacked(v, kept[i].text));
      const table = s.table && s.table.columns.length
        ? { columns: s.table.columns, rows: s.table.rows.map(r => r.map(c => linkify(c))) }
        : undefined;
      return {
        anchor: `cv-${s.id}`,
        num: numbering ? sectionNumber(depth, shown, parentIndex) : '',
        title: s.title,
        kind: s.kind,
        depth,
        entries,
        hasPeriods: labeled && !stacked,
        stacked,
        table,
        children: this.build(s.children, depth + 1, shown, numbering),
      };
    });
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
  }

  scrollTo(anchor: string): void {
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  back(): void {
    if (window.history.length > 1) this.location.back();
    else this.router.navigateByUrl('/team');
  }

  print(): void { window.print(); }
}
