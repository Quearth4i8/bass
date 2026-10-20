import { Directive, ElementRef, HostListener, Input, OnDestroy } from '@angular/core';

/**
 * Hover help for the Crew CVs editor: after a short pause over an element
 * with [appCvHint]="key", a card opens beside it with a title, one line of
 * explanation and, for most keys, a small sketch of what the option produces
 * on the public CV.
 *
 * The card is appended to <body> (so menus and scroll areas never clip it),
 * which puts it outside the component's encapsulated styles: its stylesheet
 * is injected once, below. Sketches are fixed SVG strings from this file,
 * never user content, so setting them as innerHTML is safe.
 */

interface CvHint { title: string; text: string; sketch?: string; }

// ── Sketches (160×84). .i = ink, .a = accent, .f = faint fill ───────────────
const line = (x: number, y: number, w: number, cls = 'i') => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="4" rx="2"/>`;
const svg = (body: string) => `<svg viewBox="0 0 160 84" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

const SKETCH = {
  list: svg([14, 34, 54].map(y => `<circle class="a" cx="14" cy="${y + 2}" r="3"/>${line(24, y, 120)}${line(24, y + 8, 80, 'f')}`).join('')),
  numbered: svg([14, 34, 54].map((y, i) => `<text class="at" x="8" y="${y + 6}">${i + 1}.</text>${line(26, y, 118)}${line(26, y + 8, 84, 'f')}`).join('')),
  paragraph: svg([12, 22, 32, 42].map(y => line(10, y, 140)).join('') + line(10, 52, 90) + [66].map(y => line(10, y, 140)).join('') + line(10, 76, 60)),
  table: svg(`<rect class="ab" x="10" y="10" width="140" height="14" rx="3"/>`
    + [24, 40, 56].map(y => `<rect class="g" x="10" y="${y}" width="140" height="16"/>`).join('')
    + `<line class="gl" x1="58" y1="10" x2="58" y2="72"/><line class="gl" x1="118" y1="10" x2="118" y2="72"/>`
    + [30, 46, 62].map(y => line(16, y, 34) + line(64, y, 46) + line(124, y, 20)).join('')),
  numberSections: svg(`<text class="at" x="10" y="20">I.</text>${line(28, 15, 90)}<text class="at s" x="18" y="40">I.1.</text>${line(42, 35, 70, 'f')}<text class="at s" x="18" y="58">I.2.</text>${line(42, 53, 60, 'f')}<text class="at" x="10" y="78">II.</text>${line(28, 73, 80)}`),
  published: svg(`<rect class="g" x="20" y="10" width="120" height="64" rx="8"/><circle class="f" cx="44" cy="34" r="12"/>${line(64, 26, 60)}${line(64, 36, 40, 'f')}<rect class="ab" x="64" y="52" width="40" height="12" rx="6"/><text class="wt" x="72" y="61">LIVE</text>`),
  heading: svg(`<rect class="a" x="10" y="10" width="78" height="5" rx="2"/>`
    + [26, 44, 62].map((y, i) => `<text class="at s" x="12" y="${y + 6}">${i + 1}.</text>${line(28, y, 116)}${line(28, y + 8, 70, 'f')}`).join('')),
  hidden: svg(`${line(10, 14, 90)}${line(10, 24, 130, 'f')}<g opacity=".35">${line(10, 40, 90)}${line(10, 50, 130, 'f')}</g><line class="al" x1="8" y1="45" x2="104" y2="45"/>${line(10, 66, 90)}${line(10, 76, 120, 'f')}`),
  paste: svg(`<rect class="g" x="8" y="12" width="62" height="60" rx="6"/>${[22, 32, 42, 52].map(y => line(14, y, 50, 'f')).join('')}<path class="al" d="M76 42h14m-5-5 5 5-5 5" fill="none"/>`
    + [16, 36, 56].map(y => `<circle class="a" cx="102" cy="${y + 2}" r="3"/>${line(110, y, 40)}`).join('')),
  subsection: svg(`${line(10, 14, 90)}<path class="al" d="M16 22v20h10" fill="none"/>${line(30, 40, 80)}<path class="al" d="M16 42v20h10" fill="none"/>${line(30, 60, 64)}`),
  period: svg([10, 46].map(y => `<rect class="ab2" x="10" y="${y}" width="52" height="11" rx="3"/>${line(10, y + 17, 140)}${line(10, y + 25, 90, 'f')}`).join('')),
  bold: svg(`<text class="it" x="10" y="30">**Béjaoui B.**, 2016…</text><path class="al" d="M80 40v10m-5-5 5 5 5-5" fill="none"/><text class="it b" x="10" y="72">Béjaoui B.</text><text class="it" x="69" y="72">, 2016…</text>`),
  docx: svg(`<path class="g" d="M14 8h34l12 12v56H14z"/><text class="at s" x="22" y="56">.docx</text><path class="al" d="M70 42h14m-5-5 5 5-5 5" fill="none"/>`
    + `${line(94, 14, 50)}${line(102, 26, 44, 'f')}${line(102, 36, 36, 'f')}${line(94, 50, 50)}${line(102, 62, 40, 'f')}${line(102, 72, 30, 'f')}`),
  linkCard: svg(`<rect class="g" x="16" y="12" width="128" height="60" rx="8"/><rect class="f" x="16" y="12" width="40" height="60" rx="8"/>${line(64, 22, 60)}${line(64, 32, 44, 'f')}<rect class="ab2" x="64" y="44" width="46" height="12" rx="6"/><text class="at s" x="70" y="53">View CV</text>`),
  photo: svg(`<circle class="f" cx="40" cy="42" r="24"/><circle class="al" cx="40" cy="42" r="24" fill="none"/>${line(76, 30, 70)}${line(76, 42, 50, 'f')}${line(76, 52, 60, 'f')}`),
  fields: svg([12, 32, 52].map(y => `${line(10, y, 30, 'f')}${line(46, y, 30)}${line(86, y, 30, 'f')}${line(122, y, 28)}`).join('')
    + `<line class="gl" x1="80" y1="8" x2="80" y2="66"/>`),
  summary: svg(`${line(10, 12, 50, 'a')}${line(10, 22, 140)}${line(10, 30, 110, 'f')}${line(10, 46, 40, 'a')}${line(10, 56, 140)}${line(10, 64, 90, 'f')}`),
  edition: svg(`<text class="at s" x="10" y="20">CURRICULUM VITAE · JULY 2025</text>${line(10, 32, 90)}${line(10, 44, 120, 'f')}`),
};

export const CV_HINTS: Record<string, CvHint> = {
  'kind-list': { title: 'Bulleted list', text: 'One bullet per entry. For experience, training, skills.', sketch: SKETCH.list },
  'kind-numbered': { title: 'Numbered list', text: 'Entries numbered 1, 2, 3… For publications and communications.', sketch: SKETCH.numbered },
  'kind-paragraph': { title: 'Paragraphs', text: 'Each entry is a justified paragraph of text, no bullets.', sketch: SKETCH.paragraph },
  'kind-table': { title: 'Table', text: 'Rows and columns with a header, e.g. journals reviewed.', sketch: SKETCH.table },
  'number-sections': { title: 'Number sections', text: 'Parts stay plain, sections get I., II. and subsections II.1., II.2.', sketch: SKETCH.numberSections },
  'published': { title: 'Published', text: 'Visitors can open the CV, and linked cards show "View CV". Drafts are admin-only.', sketch: SKETCH.published },
  'entry-heading': { title: 'Group title', text: 'Turns this entry into a small title over the entries below it; numbering restarts.', sketch: SKETCH.heading },
  'hide-section': { title: 'Hide section', text: 'Kept in the editor but left out of the public CV and the PDF.', sketch: SKETCH.hidden },
  'paste-lines': { title: 'Paste lines', text: 'Paste a list: each line becomes an entry. "2019-2021: text" fills the date too.', sketch: SKETCH.paste },
  'add-table': { title: 'Add a table', text: 'Adds a grid with editable columns and rows to this section.', sketch: SKETCH.table },
  'add-subsection': { title: 'Add a level below', text: 'Nests a new section inside this one (part › section › subsection).', sketch: SKETCH.subsection },
  'entry-period': { title: 'Date / label', text: 'Shown as a blue tag above the entry text: a date range, "Postdoc I", "Workshop"…', sketch: SKETCH.period },
  'bold': { title: 'Bold text', text: 'Wrap words in **double asterisks** to show them in bold on the CV.', sketch: SKETCH.bold },
  'import-docx': { title: 'Import a Word CV', text: 'Reads headings, lists, tables, bold and the photo. Replaces the content; nothing is saved until you press Save.', sketch: SKETCH.docx },
  'preview': { title: 'Preview', text: 'Opens the public CV in a new tab, as last saved.' },
  'linked-cards': { title: 'Linked cards', text: 'Person cards on the Team page and project portals that open this CV.', sketch: SKETCH.linkCard },
  'link-card': { title: 'Link this card', text: 'The card gets a "View CV" button and opens this CV when clicked (after Save).', sketch: SKETCH.linkCard },
  'show-all-cards': { title: 'Show all cards', text: 'Lists every person card, not only names close to this member, to link one by hand.' },
  'photo': { title: 'Photo', text: 'Shown round at the top of the CV and on the member card. Resized automatically.', sketch: SKETCH.photo },
  'edition': { title: 'CV edition', text: 'A date shown above the name, e.g. "July 2025".', sketch: SKETCH.edition },
  'fields': { title: 'Personal information', text: 'Label / value pairs shown two per row in the CV header, in this order.', sketch: SKETCH.fields },
  'summary': { title: 'Summary blocks', text: 'Short titled texts under the header, e.g. "Current position".', sketch: SKETCH.summary },
  'drag': { title: 'Drag to reorder', text: 'Hold and move up or down; the preview follows.' },
};

const STYLE_ID = 'cv-hint-styles';
const STYLES = `
.cv-hint {
  --hb: #ffffff; --hl: #c5d8e6; --ht: #0d2137; --hd: #4a7590; --ha: #1a8f7f; --hi: #9fb6c6; --hf: #d9e6ee; --hg: #f3f8fb;
  position: fixed; z-index: 10000; width: 236px; padding: 12px 13px 13px; border-radius: 12px;
  background: var(--hb); border: 1px solid var(--hl); color: var(--ht);
  box-shadow: 0 18px 40px rgba(2, 20, 32, .22); font: 400 12px/1.5 'Geist', 'Manrope', system-ui, sans-serif;
  pointer-events: none; opacity: 0; transform: translateX(-4px); transition: opacity .14s, transform .14s;
}
body[data-theme="dark"] .cv-hint {
  --hb: #082a3d; --hl: #1b5573; --ht: #e8f1f5; --hd: #9fb3bf; --ha: #4ad6c4; --hi: #4f7387; --hf: #18465d; --hg: #0a3142;
}
.cv-hint.on { opacity: 1; transform: none; }
.cv-hint.left { transform: translateX(4px); }
.cv-hint.left.on { transform: none; }
.cv-hint-title { font-weight: 700; font-size: 12.5px; margin-bottom: 2px; }
.cv-hint-text { color: var(--hd); }
.cv-hint-sketch { margin-top: 10px; padding: 6px; border-radius: 8px; background: var(--hg); border: 1px solid var(--hl); }
.cv-hint-sketch svg { display: block; width: 100%; height: auto; }
.cv-hint .i { fill: var(--hi); } .cv-hint .f { fill: var(--hf); } .cv-hint .a { fill: var(--ha); }
.cv-hint .ab { fill: var(--ha); } .cv-hint .ab2 { fill: var(--ha); opacity: .22; }
.cv-hint .g { fill: var(--hb); stroke: var(--hl); } .cv-hint .gl { stroke: var(--hl); }
.cv-hint .al { stroke: var(--ha); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.cv-hint .at { fill: var(--ha); font: 700 9px 'JetBrains Mono', ui-monospace, monospace; }
.cv-hint .at.s { font-size: 7.5px; }
.cv-hint .it { fill: var(--ht); font: 400 10px ui-monospace, monospace; } .cv-hint .it.b { font-weight: 800; }
.cv-hint .wt { fill: #fff; font: 700 7px ui-monospace, monospace; }
`;

@Directive({ selector: '[appCvHint]', standalone: true })
export class CvHintDirective implements OnDestroy {
  @Input('appCvHint') key = '';

  private card?: HTMLElement;
  private timer?: ReturnType<typeof setTimeout>;

  constructor(private host: ElementRef<HTMLElement>) {}

  @HostListener('mouseenter')
  onEnter(): void {
    const hint = CV_HINTS[this.key];
    if (!hint) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.show(hint), 280);
  }

  @HostListener('mouseleave')
  @HostListener('mousedown')
  @HostListener('window:scroll')
  onLeave(): void {
    clearTimeout(this.timer);
    this.card?.remove();
    this.card = undefined;
  }

  ngOnDestroy(): void {
    this.onLeave();
  }

  private show(hint: CvHint): void {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = STYLES;
      document.head.appendChild(style);
    }
    this.card?.remove();
    const card = document.createElement('div');
    card.className = 'cv-hint';
    card.setAttribute('role', 'tooltip');
    const title = document.createElement('div');
    title.className = 'cv-hint-title';
    title.textContent = hint.title;
    const text = document.createElement('div');
    text.className = 'cv-hint-text';
    text.textContent = hint.text;
    card.append(title, text);
    if (hint.sketch) {
      const sketch = document.createElement('div');
      sketch.className = 'cv-hint-sketch';
      sketch.innerHTML = hint.sketch;
      card.appendChild(sketch);
    }
    document.body.appendChild(card);
    this.card = card;

    // To the right of the element, or to its left when there is no room.
    const r = this.host.nativeElement.getBoundingClientRect();
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const gap = 10;
    const toLeft = r.right + gap + w > window.innerWidth - 8;
    if (toLeft) card.classList.add('left');
    const left = toLeft ? Math.max(8, r.left - gap - w) : r.right + gap;
    const top = Math.min(Math.max(8, r.top + r.height / 2 - h / 2), window.innerHeight - h - 8);
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    requestAnimationFrame(() => card.classList.add('on'));
  }
}
