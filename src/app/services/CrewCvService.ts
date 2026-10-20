import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { AuthService } from './AuthService';

// ── CV document model ───────────────────────────────────────────────────────
// Stored as JSON by the backend (crew_cvs.cv_json), so sections can be added,
// renamed and reordered freely. Sections nest up to three levels, mirroring
// the detailed CVs: Part ("Scientific Production") > Section ("II. Scientific
// publications") > Subsection ("II.1. Scientific articles").

export interface CvField { label: string; value: string; }

/**
 * One item of a section. `period` is the bold lead-in: a date range, a role...
 * `text` may span several lines (a project and its role/funding/duration).
 * A `heading` entry is a small title grouping the entries after it
 * ("National Research Project: NRP"); numbering restarts below it.
 */
export interface CvEntry { period?: string; text: string; heading?: boolean; }

export interface CvTable { columns: string[]; rows: string[][]; }

/** list = bulleted, numbered = 1. 2. 3. (publications), paragraph = prose, table = grid. */
export type CvSectionKind = 'list' | 'numbered' | 'paragraph' | 'table';

export interface CvSection {
  id: string;
  title: string;
  kind: CvSectionKind;
  entries: CvEntry[];
  table?: CvTable;
  children: CvSection[];
  /** Kept in the editor but left out of the public CV. */
  hidden?: boolean;
}

export interface CvSummaryBlock { title: string; text: string; }

export interface CvDocument {
  version: 1;
  /** Edition shown on the CV, e.g. "July 2025". */
  edition?: string;
  /** Number sections I., II. and subsections II.1., as in the detailed CV. */
  numbering: boolean;
  fields: CvField[];
  summary: CvSummaryBlock[];
  sections: CvSection[];
}

export interface CrewCv {
  id?: number;
  slug?: string;
  fullName: string;
  title?: string;
  /** base64 data URL. */
  photo?: string | null;
  published: boolean;
  displayOrder?: number;
  updatedAt?: string;
  /** Absent in list responses. */
  cv?: CvDocument | null;
  /** Person cards (see cvCardKey) that open this CV when clicked. */
  linkedCards?: string[];
}

// ── Linking person cards to CVs ─────────────────────────────────────────────
// A card is identified by where it lives and the person's name, e.g.
// "team:bechir bejaoui" (public Team page) or "portal:<project slug>:bechir
// bejaoui" (a project portal's Team page). Names are normalized so accents,
// case and punctuation do not break a link.

export function normalizePersonName(name: string): string {
  return (name ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

export function cvCardKey(scope: string, name: string): string {
  return `${scope}:${normalizePersonName(name)}`;
}

function editDistance(a: string, b: string): number {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return d[b.length];
}

/**
 * 0..1 likeness of two person names, word by word and order-free, tolerating
 * a typo per word ("Bejaoui" ~ "Béjaoui" ~ "Bejoui"): matched words over the
 * longer name's word count.
 */
export function nameSimilarity(a: string, b: string): number {
  const wa = normalizePersonName(a).split(' ').filter(Boolean);
  const wb = normalizePersonName(b).split(' ').filter(Boolean);
  if (!wa.length || !wb.length) return 0;
  const pool = [...wb];
  let matched = 0;
  for (const w of wa) {
    const i = pool.findIndex(p => p === w || (w.length >= 4 && p.length >= 4 && editDistance(w, p) <= 1));
    if (i >= 0) { matched++; pool.splice(i, 1); }
  }
  return matched / Math.max(wa.length, wb.length);
}

export interface CvCardLink { slug: string; fullName: string; }

export const MAX_SECTION_DEPTH = 3;

export function newCvId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function newSection(title = '', kind: CvSectionKind = 'list'): CvSection {
  return { id: newCvId(), title, kind, entries: [], children: [] };
}

export function emptyCv(): CvDocument {
  return { version: 1, numbering: false, fields: [], summary: [], sections: [] };
}

/** Preset sections offered by "Add section"; a lighter CV is a subset of these. */
export const CV_SECTION_PRESETS: { title: string; kind: CvSectionKind }[] = [
  { title: 'Education', kind: 'list' },
  { title: 'Professional Experience', kind: 'list' },
  { title: 'Training', kind: 'list' },
  { title: 'Research Projects', kind: 'list' },
  { title: 'Publications', kind: 'numbered' },
  { title: 'Communications', kind: 'numbered' },
  { title: 'Supervision', kind: 'list' },
  { title: 'Teaching', kind: 'list' },
  { title: 'Skills', kind: 'list' },
  { title: 'Languages', kind: 'list' },
  { title: 'Awards & Distinctions', kind: 'list' },
];

/** Starting point for a new crew member: the common core of every CV. */
export function standardCv(): CvDocument {
  const cv = emptyCv();
  cv.fields = [
    { label: 'Nationality', value: '' },
    { label: 'Email', value: '' },
    { label: 'Phone', value: '' },
    { label: 'Professional address', value: '' },
  ];
  cv.summary = [{ title: 'Current position', text: '' }];
  cv.sections = ['Education', 'Professional Experience', 'Publications', 'Skills', 'Languages']
    .map(t => newSection(t, CV_SECTION_PRESETS.find(p => p.title === t)!.kind));
  return cv;
}

/** Fills in anything an older or hand-made document is missing. */
export function normalizeCv(raw: any): CvDocument {
  const cv = emptyCv();
  if (!raw || typeof raw !== 'object') return cv;
  cv.edition = raw.edition || '';
  cv.numbering = !!raw.numbering;
  cv.fields = Array.isArray(raw.fields) ? raw.fields.map((f: any) => ({ label: f?.label ?? '', value: f?.value ?? '' })) : [];
  cv.summary = Array.isArray(raw.summary) ? raw.summary.map((s: any) => ({ title: s?.title ?? '', text: s?.text ?? '' })) : [];
  const fix = (s: any): CvSection => ({
    id: s?.id || newCvId(),
    title: s?.title ?? '',
    kind: (['list', 'numbered', 'paragraph', 'table'].includes(s?.kind) ? s.kind : 'list') as CvSectionKind,
    entries: Array.isArray(s?.entries)
      ? s.entries.map((e: any) => ({ period: e?.period ?? '', text: e?.text ?? '', ...(e?.heading ? { heading: true } : {}) }))
      : [],
    table: s?.table && Array.isArray(s.table.columns)
      ? { columns: s.table.columns.map(String), rows: (s.table.rows || []).map((r: any[]) => r.map(String)) }
      : undefined,
    children: Array.isArray(s?.children) ? s.children.map(fix) : [],
    hidden: !!s?.hidden,
  });
  cv.sections = Array.isArray(raw.sections) ? raw.sections.map(fix) : [];
  return cv;
}

export function toRoman(n: number): string {
  const map: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of map) { while (n >= v) { out += s; n -= v; } }
  return out;
}

/**
 * Number for a section at `depth` given its 1-based position and its parent's
 * position: depth 0 (parts) are unnumbered, depth 1 "II.", depth 2 "II.1.".
 */
export function sectionNumber(depth: number, index: number, parentIndex: number): string {
  if (depth === 1) return `${toRoman(index)}.`;
  if (depth === 2) return `${toRoman(parentIndex)}.${index}.`;
  return '';
}

@Injectable({ providedIn: 'root' })
export class CrewCvService {
  private cardLinksCache$?: Observable<Map<string, CvCardLink>>;

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Card key -> CV, loaded once and shared by every card on the page. Only
   * CVs the caller may open are listed (published ones, or all for an admin).
   */
  cardLinks(): Observable<Map<string, CvCardLink>> {
    this.cardLinksCache$ ??= this.list().pipe(
      map(list => {
        const links = new Map<string, CvCardLink>();
        for (const cv of list) {
          for (const key of cv.linkedCards ?? []) links.set(key, { slug: cv.slug!, fullName: cv.fullName });
        }
        return links;
      }),
      catchError(() => of(new Map<string, CvCardLink>())),
      shareReplay(1),
    );
    return this.cardLinksCache$;
  }

  /** After the admin changes links, so cards pick them up without a reload. */
  invalidateCardLinks(): void {
    this.cardLinksCache$ = undefined;
  }

  private get base(): string {
    return `${this.authService.getApiBaseUrl()}/crew-cvs`;
  }

  list(): Observable<CrewCv[]> {
    return this.http.get<CrewCv[]>(this.base);
  }

  get(slug: string): Observable<CrewCv> {
    return this.http.get<CrewCv>(`${this.base}/${encodeURIComponent(slug)}`);
  }

  create(cv: CrewCv): Observable<CrewCv> {
    return this.http.post<CrewCv>(this.base, cv).pipe(tap(() => this.invalidateCardLinks()));
  }

  update(slug: string, cv: CrewCv): Observable<CrewCv> {
    return this.http.put<CrewCv>(`${this.base}/${encodeURIComponent(slug)}`, cv).pipe(tap(() => this.invalidateCardLinks()));
  }

  reorder(slugs: string[]): Observable<void> {
    return this.http.put<void>(`${this.base}/order`, slugs);
  }

  delete(slug: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(slug)}`).pipe(tap(() => this.invalidateCardLinks()));
  }
}
