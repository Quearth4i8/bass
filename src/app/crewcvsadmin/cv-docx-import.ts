import { CvDocument, CvEntry, CvSection, emptyCv, newSection } from '../services/CrewCvService';

export interface CvImportResult {
  cv: CvDocument;
  fullName?: string;
  photo?: string;
  sectionCount: number;
  entryCount: number;
}

// Word's table of contents duplicates every heading with a page number, and
// footers repeat on every page: neither belongs in the CV.
const STYLE_MAP = [
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `p[style-name='toc ${n}'] => !`),
  "p[style-name='TOC Heading'] => !",
];

const COVER_LINE = /^(detailed|d[ée]taill[ée]|(detailed\s+)?(curriculum\s+vitae|cv|r[ée]sum[ée]|summary|sommaire|table of contents|contents))$/i;
const RULE_LINE = /^[\s_\-–—=.·]+$/;
const EDITION_LINE = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janv|f[ée]v|mars|avr|mai|juin|juil|ao[uû]t|sept|d[ée]c)[a-zéû]*\.?\s+\d{4}$/i;
// "II.1. Scientific articles" -> "Scientific articles"; the viewer renumbers.
const HEADING_NUMBER = /^\s*(?:[IVXLC]+\.(?:\d+\.?)*|\d{1,2}(?:\.\d+)*\.?)\s+/;

const MAX_HEADING_LENGTH = 120;
const SHORT_LABELED_LINE = 80;

const FIRST_NAME = /^(name|first\s*name|given\s*name|pr[ée]nom)$/i;
const LAST_NAME = /^(surname|last\s*name|family\s*name|nom)$/i;

const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

/**
 * Turns a Word CV into a CvDocument. Headings become the section tree, the
 * level being decided by order of first appearance (the detailed CV uses
 * heading 6 for parts and heading 1 for sections), lists and paragraphs
 * become entries and tables are kept as tables. What comes before the first
 * heading is read as the cover: "Label: value" lines become personal fields,
 * short title + paragraph pairs become summary blocks, the first image the photo.
 */
export async function importCvFromDocx(file: File): Promise<CvImportResult> {
  const mammoth: any = await (import('mammoth') as Promise<any>);
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer }, { styleMap: STYLE_MAP });
  const body = new DOMParser().parseFromString(html, 'text/html').body;

  const cv = emptyCv();
  const levelRank: string[] = [];
  const stack: CvSection[] = [];
  const preamble: Element[] = [];
  let photo: string | undefined;
  let sawNumberedHeading = false;
  let sectionCount = 0;
  let entryCount = 0;

  const current = () => stack[stack.length - 1];

  const addEntries = (entries: CvEntry[], fromOrderedList: boolean) => {
    const sec = current();
    if (!sec || !entries.length) return;
    if (fromOrderedList && !sec.entries.some(e => !e.heading)) sec.kind = 'numbered';
    sec.entries.push(...entries);
    entryCount += entries.length;
  };

  // Word CVs often write an item as one numbered line followed by plain
  // paragraphs (Role / Funding / Duration): those continue the item above.
  let continuesListItem = false;
  // Likewise a short labeled line ("Postdoc I: September 1st - November 30th
  // 2016") followed by unlabeled paragraphs describing it.
  let continuesLabeled = false;

  for (const el of Array.from(body.children)) {
    const tag = el.tagName.toLowerCase();

    // Paragraph-length text styled as a heading is body text, not a section.
    if (/^h[1-6]$/.test(tag) && clean(el.textContent).length <= MAX_HEADING_LENGTH) {
      const raw = clean(el.textContent);
      if (!raw) continue;
      continuesListItem = continuesLabeled = false;
      if (!levelRank.includes(tag)) levelRank.push(tag);
      const depth = Math.min(levelRank.indexOf(tag), 2);
      if (HEADING_NUMBER.test(raw)) sawNumberedHeading = true;
      const sec = newSection(raw.replace(HEADING_NUMBER, '') || raw);
      sectionCount++;
      // A level skipped (part -> subsection) hangs off the nearest open parent.
      while (stack.length > depth) stack.pop();
      const parent = current();
      (parent ? parent.children : cv.sections).push(sec);
      stack.push(sec);
      continue;
    }

    if (!stack.length) {
      if (!photo) {
        const img = el.querySelector('img');
        if (img?.getAttribute('src')?.startsWith('data:')) photo = await resizeImage(img.getAttribute('src')!, 400);
      }
      preamble.push(el);
      continue;
    }

    const sec = current();
    if (tag === 'ul' || tag === 'ol') {
      const entries = listEntries(el);
      addEntries(entries, tag === 'ol');
      continuesListItem = entries.length > 0;
    } else if (tag === 'table') {
      const table = readTable(el);
      if (table) {
        sec.table = table;
        if (!sec.entries.length) sec.kind = 'table';
      }
      continuesListItem = false;
    } else if (isBoldOnly(el) && !(continuesListItem && /:\s*$/.test(clean(el.textContent)))) {
      // "II.1.1 National Research Project: NRP": a title over the items below.
      addEntries([{ period: '', text: clean(el.textContent).replace(HEADING_NUMBER, ''), heading: true }], false);
      continuesListItem = false;
    } else {
      const entry = toEntry(el);
      const last = sec.entries[sec.entries.length - 1];
      if (entry && last && !last.heading && (continuesListItem || (continuesLabeled && !entry.period))) {
        const line = entry.period ? `${entry.period}: ${entry.text}` : entry.text;
        last.text = `${last.text}\n${line}`;
      } else if (entry) {
        addEntries([entry], false);
        continuesLabeled = !!entry.period && entry.text.length <= SHORT_LABELED_LINE;
      }
      continue;
    }
    continuesLabeled = false;
  }

  cv.numbering = sawNumberedHeading;
  const cover = readCover(preamble);
  cv.fields = cover.fields;
  cv.summary = cover.summary;
  cv.edition = cover.edition;

  return { cv, fullName: cover.fullName, photo, sectionCount, entryCount };
}

function listEntries(list: Element): CvEntry[] {
  const out: CvEntry[] = [];
  for (const li of Array.from(list.children)) {
    if (li.tagName.toLowerCase() !== 'li') continue;
    const own = li.cloneNode(true) as Element;
    own.querySelectorAll('ul, ol').forEach(n => n.remove());
    const entry = toEntry(own);
    if (entry) out.push(entry);
    li.querySelectorAll(':scope > ul, :scope > ol').forEach(nested => out.push(...listEntries(nested)));
  }
  return out;
}

/**
 * A line becomes { period, text } when it leads with a bold or dated "xxx:"
 * label. Bold inside the text is kept as **markers** (names, years...).
 */
function toEntry(el: Element): CvEntry | null {
  const chars = richChars(el);
  const text = chars.map(ch => ch.c).join('');
  if (!text || RULE_LINE.test(text)) return null;

  // Skip Word's empty bookmark anchors (<a id="_Hlk…">) in front of the label.
  const first = Array.from(el.children).find(c => clean(c.textContent));
  const lead = first && first.tagName.toLowerCase() === 'strong' && text.startsWith(clean(first.textContent))
    ? clean(first.textContent) : '';
  // Only a label when a separator follows: "Postdoc I : ..." but not "Fellowship at ...".
  const after = text.slice(lead.length);
  if (lead && lead.length <= 80 && (/:$/.test(lead) || /^\s*[:\-–—]\s/.test(after))) {
    const restStart = text.length - after.replace(/^\s*[:\-–—]\s*/, '').length;
    const rest = serializeRich(chars.slice(restStart));
    if (rest) return { period: lead.replace(/\s*:$/, ''), text: rest };
  }
  // The bold run covers label and title: "**Workshop : Vers un Plan…**".
  const inner = lead && /^([^:]{1,40}?)\s*:\s+\S/.exec(lead);
  if (inner) {
    const restStart = inner[0].length - 1;
    const rest = serializeRich(chars.slice(restStart));
    if (rest) return { period: inner[1].trim(), text: rest };
  }

  const colon = text.indexOf(':');
  if (colon > 0 && colon <= 60 && /\d/.test(text.slice(0, colon)) && text.slice(colon + 1, colon + 3) !== '//') {
    const rest = serializeRich(chars.slice(colon + 1));
    if (rest) return { period: text.slice(0, colon).trim(), text: rest };
  }
  return { period: '', text: serializeRich(chars) };
}

interface RichChar { c: string; b: boolean; }

/** The element's text as characters flagged bold or not, whitespace collapsed like clean(). */
function richChars(el: Element): RichChar[] {
  const out: RichChar[] = [];
  const walk = (node: Node, bold: boolean) => {
    if (node.nodeType === Node.TEXT_NODE) {
      for (const c of node.textContent ?? '') {
        if (/\s/.test(c)) {
          if (out.length && out[out.length - 1].c !== ' ') out.push({ c: ' ', b: false });
        } else {
          out.push({ c, b: bold });
        }
      }
      return;
    }
    const tag = (node as Element).tagName?.toLowerCase();
    const isBold = bold || tag === 'strong' || tag === 'b';
    node.childNodes.forEach(child => walk(child, isBold));
  };
  walk(el, false);
  while (out.length && out[out.length - 1].c === ' ') out.pop();
  return out;
}

/** Characters back to text with **bold** markers; spaces stay outside the markers. */
function serializeRich(chars: RichChar[]): string {
  let s = '';
  let open = false;
  const close = () => {
    // Keep the marker tight against the bold text: "**a** b", not "**a **b".
    s = s.endsWith(' ') ? `${s.slice(0, -1)}** ` : `${s}**`;
    open = false;
  };
  for (const { c, b } of chars) {
    if (c === ' ') { s += ' '; continue; }
    if (b && !open) { s += '**'; open = true; }
    if (!b && open) close();
    s += c;
  }
  if (open) close();
  // "**a** **b**" -> "**a b**"; then trim.
  return s.replace(/\*\* \*\*/g, ' ').replace(/\*\*\*\*/g, '').trim();
}

/** A short paragraph whose whole text is bold. */
function isBoldOnly(el: Element): boolean {
  const text = clean(el.textContent);
  if (!text || text.length > MAX_HEADING_LENGTH) return false;
  const bold = Array.from(el.querySelectorAll('strong')).map(s => s.textContent ?? '').join('');
  return clean(bold) === text;
}

function readTable(table: Element): { columns: string[]; rows: string[][] } | null {
  const rows = Array.from(table.querySelectorAll('tr')).map(tr =>
    Array.from(tr.children).map(td =>
      Array.from(td.querySelectorAll('p')).map(p => clean(p.textContent)).filter(Boolean).join(' ')
        || clean(td.textContent)));
  if (!rows.length) return null;
  const [columns, ...rest] = rows;
  const width = Math.max(...rows.map(r => r.length));
  const pad = (r: string[]) => [...r, ...Array(width - r.length).fill('')];
  return { columns: pad(columns), rows: rest.map(pad) };
}

function readCover(preamble: Element[]) {
  const fields: { label: string; value: string }[] = [];
  const summary: { title: string; text: string }[] = [];
  let edition = '';
  let first = '';
  let last = '';

  const lines = preamble
    .flatMap(el => ['ul', 'ol'].includes(el.tagName.toLowerCase()) ? Array.from(el.children) : [el])
    .map(el => clean(el.textContent))
    .filter(t => t && !RULE_LINE.test(t) && !COVER_LINE.test(t));

  const isField = (t: string) => {
    const i = t.indexOf(':');
    return i > 0 && i <= 40 && t.slice(i + 1, i + 3) !== '//' && t.slice(0, i).trim().split(/\s+/).length <= 6
      && t.slice(i + 1).trim().length > 0;
  };
  const isTitle = (t: string) => t.length <= 60 && !t.includes(':') && !/[.;]$/.test(t);

  const loose: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i];
    if (EDITION_LINE.test(t)) { edition = t; continue; }
    if (isField(t)) {
      const c = t.indexOf(':');
      const label = t.slice(0, c).trim();
      const value = t.slice(c + 1).trim();
      if (FIRST_NAME.test(label)) first = value;
      else if (LAST_NAME.test(label)) last = value;
      else fields.push({ label, value });
      continue;
    }
    const next = lines[i + 1];
    if (isTitle(t) && next && !isField(next) && !isTitle(next)) {
      summary.push({ title: t, text: next });
      i++;
      continue;
    }
    loose.push(t);
  }

  // Without Name/Surname fields, the cover's first short line is the name.
  const fullName = clean(`${first} ${last}`) || loose.find(isTitle) || undefined;
  const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  for (const t of loose) {
    if (fullName && norm(t) === norm(fullName)) continue;
    summary.push({ title: '', text: t });
  }
  return { fields, summary, edition, fullName };
}

/** Downscales an image to `max` px on its longest side, as a JPEG data URL. */
export function resizeImage(src: string, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = src;
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
