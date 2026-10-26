import { Injectable } from '@angular/core';
import { CrewCv, CvSection, normalizeCv, sectionNumber } from './CrewCvService';

/** A run of text: bold where the stored text has **...**. */
interface Run { t: string; b?: boolean; }

/**
 * One line of a CV as both exports draw it: a section heading, a small
 * grouping heading, an item (bulleted, numbered or prose, with its bold
 * lead-in) or a table. Built once from the CV, so Word and PDF agree.
 */
type Block =
  | { kind: 'heading'; depth: number; text: string }
  | { kind: 'subheading'; text: string }
  | { kind: 'item'; marker: string; lead: string; lines: Run[][] }
  | { kind: 'table'; columns: string[]; rows: string[][] };

// Heading colours of the printed CV (cv-view.component.scss, @media print).
const HEADING_COLORS = ['0D2B57', '1A5FA6', '3B7FBF'];
const GREY = '6B7280';

function runs(text: string): Run[] {
  const out: Run[] = [];
  let last = 0;
  for (const m of text.matchAll(/\*\*(.+?)\*\*/gs)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ t: text.slice(last, i) });
    out.push({ t: m[1], b: true });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out;
}

const plain = (text: string) => text.replace(/\*\*/g, '');

/**
 * Downloads a public CV (the /cv/:slug page) as Word or PDF, laid out like
 * its printed version: "Curriculum Vitae" and the name as a running header,
 * page numbers bottom right. Each library loads on demand.
 */
@Injectable({ providedIn: 'root' })
export class CvExportService {

  async exportWord(member: CrewCv): Promise<void> {
    const d = await import('docx');
    const cv = normalizeCv(member.cv);
    const children: any[] = [];

    // ── Photo, name, title
    const photo = await this.photo(member.photo);
    const kicker = 'CURRICULUM VITAE' + (cv.edition ? ` · ${cv.edition.toUpperCase()}` : '');
    const heroText = [
      new d.Paragraph({ children: [new d.TextRun({ text: kicker, size: 16, color: GREY, characterSpacing: 20 })] }),
      new d.Paragraph({ spacing: { before: 60 }, children: [new d.TextRun({ text: member.fullName, bold: true, size: 40, color: HEADING_COLORS[0] })] }),
      ...(member.title ? [new d.Paragraph({ children: [new d.TextRun({ text: member.title, size: 22, color: GREY })] })] : []),
    ];
    const none = { style: d.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const noBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
    if (photo) {
      const { w, h } = this.fit(photo.width, photo.height, 96, 120);
      children.push(new d.Table({
        width: { size: 100, type: d.WidthType.PERCENTAGE },
        borders: noBorders,
        rows: [new d.TableRow({ children: [
          new d.TableCell({ width: { size: 1900, type: d.WidthType.DXA }, children: [
            new d.Paragraph({ children: [new d.ImageRun({ type: photo.type, data: photo.data, transformation: { width: w, height: h } })] }),
          ] }),
          new d.TableCell({ verticalAlign: d.VerticalAlign.CENTER, children: heroText }),
        ] })],
      }));
    } else {
      children.push(...heroText);
    }
    children.push(this.rule(d));

    // ── Personal details: label | value
    const fields = cv.fields.filter(f => f.value.trim());
    if (fields.length) {
      children.push(new d.Table({
        width: { size: 100, type: d.WidthType.PERCENTAGE },
        borders: noBorders,
        rows: fields.map(f => new d.TableRow({ children: [
          new d.TableCell({ width: { size: 2600, type: d.WidthType.DXA }, children: [
            new d.Paragraph({ children: [new d.TextRun({ text: f.label, bold: true, size: 19, color: GREY })] }),
          ] }),
          new d.TableCell({ children: f.value.split('\n').map(line => new d.Paragraph({ children: this.wordRuns(d, runs(line)) })) }),
        ] })),
      }));
    }

    // ── Summary
    for (const b of cv.summary.filter(s => s.text.trim())) {
      if (b.title) children.push(new d.Paragraph({ spacing: { before: 200 }, children: [new d.TextRun({ text: b.title, bold: true, size: 22 })] }));
      for (const line of b.text.split('\n').filter(l => l.trim())) {
        children.push(new d.Paragraph({ spacing: { after: 80 }, children: this.wordRuns(d, runs(line)) }));
      }
    }

    // ── Sections
    for (const block of this.blocks(cv.sections, cv.numbering)) {
      switch (block.kind) {
        case 'heading': {
          const size = [30, 25, 22][Math.min(block.depth, 2)];
          children.push(new d.Paragraph({
            keepNext: true,
            spacing: { before: block.depth === 0 ? 360 : 240, after: 100 },
            border: block.depth === 0 ? { bottom: { style: d.BorderStyle.SINGLE, size: 6, color: HEADING_COLORS[0], space: 2 } } : undefined,
            children: [new d.TextRun({ text: block.text, bold: true, size, color: HEADING_COLORS[Math.min(block.depth, 2)] })],
          }));
          break;
        }
        case 'subheading':
          children.push(new d.Paragraph({ keepNext: true, spacing: { before: 140, after: 60 }, children: [new d.TextRun({ text: block.text, bold: true, italics: true, size: 20 })] }));
          break;
        case 'item': {
          const [first, ...rest] = block.lines.length ? block.lines : [[]];
          const lead = block.lead ? [new d.TextRun({ text: block.lead + (first.length ? ' — ' : ''), bold: true })] : [];
          const marker = block.marker ? [new d.TextRun({ text: block.marker + '\t' })] : [];
          const indent = block.marker ? { left: 360, hanging: 360 } : undefined;
          children.push(new d.Paragraph({ indent, tabStops: block.marker ? [{ type: d.TabStopType.LEFT, position: 360 }] : undefined,
            spacing: { after: rest.length ? 0 : 80 }, children: [...marker, ...lead, ...this.wordRuns(d, first)] }));
          rest.forEach((line, i) => children.push(new d.Paragraph({
            indent: { left: block.marker ? 360 : 0 }, spacing: { after: i === rest.length - 1 ? 80 : 0 },
            children: this.wordRuns(d, line, GREY),
          })));
          break;
        }
        case 'table': {
          const cell = (text: string, head: boolean) => new d.TableCell({
            shading: head ? { fill: 'E8F1F5', type: d.ShadingType.CLEAR, color: 'auto' } : undefined,
            children: [new d.Paragraph({ children: [new d.TextRun({ text: plain(text), bold: head, size: 18 })] })],
          });
          children.push(new d.Table({
            width: { size: 100, type: d.WidthType.PERCENTAGE },
            rows: [
              new d.TableRow({ tableHeader: true, children: block.columns.map(c => cell(c, true)) }),
              ...block.rows.map(r => new d.TableRow({ children: block.columns.map((_, i) => cell(r[i] ?? '', false)) })),
            ],
          }));
          children.push(new d.Paragraph({ children: [] }));
          break;
        }
      }
    }

    const headerBox = { size: 18, color: GREY, font: 'Georgia' };
    const doc = new d.Document({
      creator: 'BASSIANA',
      title: `${member.fullName} — Curriculum Vitae`,
      styles: { default: { document: { run: { font: 'Calibri', size: 21 } } } },
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1080, left: 1020, right: 1020 } } },
        headers: { default: new d.Header({ children: [new d.Paragraph({
          tabStops: [{ type: d.TabStopType.RIGHT, position: d.TabStopPosition.MAX }],
          border: { bottom: { style: d.BorderStyle.SINGLE, size: 4, color: GREY, space: 3 } },
          children: [new d.TextRun({ text: 'Curriculum Vitae', ...headerBox }), new d.TextRun({ text: `\t${member.fullName}`, ...headerBox })],
        })] }) },
        footers: { default: new d.Footer({ children: [new d.Paragraph({
          alignment: d.AlignmentType.RIGHT,
          children: [new d.TextRun({ children: ['Page ', d.PageNumber.CURRENT], size: 16, color: GREY, font: 'Georgia' })],
        })] }) },
        children,
      }],
    });
    this.save(await d.Packer.toBlob(doc), this.fileName(member, 'docx'));
  }

  async exportPdf(member: CrewCv): Promise<void> {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const cv = normalizeCv(member.cv);
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const left = 51, right = pageW - 51, top = 80, bottom = pageH - 51;
    const width = right - left;
    let y = top;

    const hex = (h: string): [number, number, number] => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    const room = (h: number) => { if (y + h > bottom) { doc.addPage(); y = top; } };

    /** Writes runs word by word, wrapping at `w`, switching to bold where needed. */
    const write = (line: Run[], x: number, w: number, size: number, color: [number, number, number] = [17, 17, 17]) => {
      const lh = size * 1.35;
      doc.setFontSize(size);
      doc.setTextColor(...color);
      let cx = x;
      room(lh);
      for (const r of line) {
        doc.setFont('helvetica', r.b ? 'bold' : 'normal');
        for (const word of r.t.split(/(\s+)/)) {
          if (!word) continue;
          const ww = doc.getTextWidth(word);
          if (/^\s+$/.test(word)) { if (cx > x) cx += ww; continue; }
          if (cx + ww > x + w && cx > x) { y += lh; room(lh); cx = x; }
          doc.text(word, cx, y + size);
          cx += ww;
        }
      }
      y += lh;
    };

    // ── Photo, name, title
    const photo = await this.photo(member.photo);
    let textX = left;
    if (photo) {
      const { w, h } = this.fit(photo.width, photo.height, 80, 100);
      doc.addImage(photo.dataUrl, photo.type === 'png' ? 'PNG' : 'JPEG', left, y, w, h);
      textX = left + w + 18;
      const startY = y;
      y += Math.max(0, (h - 70) / 2);
      this.pdfHero(doc, cv.edition, member, textX, () => y, v => (y = v));
      y = Math.max(y, startY + h);
    } else {
      this.pdfHero(doc, cv.edition, member, textX, () => y, v => (y = v));
    }
    y += 10;
    doc.setDrawColor(...hex('C5D3DC'));
    doc.line(left, y, right, y);
    y += 14;

    // ── Personal details
    for (const f of cv.fields.filter(f => f.value.trim())) {
      room(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...hex(GREY));
      doc.text(f.label, left, y + 9.5, { maxWidth: 120 });
      for (const line of f.value.split('\n')) write(runs(line), left + 130, width - 130, 10);
      y += 3;
    }

    // ── Summary
    for (const b of cv.summary.filter(s => s.text.trim())) {
      y += 8;
      if (b.title) write([{ t: b.title, b: true }], left, width, 11);
      for (const line of b.text.split('\n').filter(l => l.trim())) { write(runs(line), left, width, 10); y += 3; }
    }

    // ── Sections
    for (const block of this.blocks(cv.sections, cv.numbering)) {
      switch (block.kind) {
        case 'heading': {
          const size = [15, 12.5, 11][Math.min(block.depth, 2)];
          y += block.depth === 0 ? 16 : 10;
          room(size * 1.35 + 30); // keep the heading with what follows
          write([{ t: block.text, b: true }], left, width, size, hex(HEADING_COLORS[Math.min(block.depth, 2)]));
          if (block.depth === 0) { doc.setDrawColor(...hex(HEADING_COLORS[0])); doc.line(left, y, right, y); y += 4; }
          y += 4;
          break;
        }
        case 'subheading':
          y += 4;
          room(40);
          write([{ t: block.text, b: true }], left, width, 10.5);
          break;
        case 'item': {
          const indent = block.marker ? 18 : 0;
          const [first, ...rest] = block.lines.length ? block.lines : [[]];
          room(14);
          if (block.marker) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(17, 17, 17);
            doc.text(block.marker, left, y + 10);
          }
          const lead: Run[] = block.lead ? [{ t: block.lead + (first.length ? ' — ' : ''), b: true }] : [];
          write([...lead, ...first], left + indent, width - indent, 10);
          for (const line of rest) write(line, left + indent, width - indent, 9.5, hex(GREY));
          y += 4;
          break;
        }
        case 'table':
          autoTable(doc, {
            startY: y,
            head: [block.columns.map(plain)],
            body: block.rows.map(r => block.columns.map((_, i) => plain(r[i] ?? ''))),
            styles: { fontSize: 8.5, cellPadding: 4, overflow: 'linebreak', valign: 'top' },
            headStyles: { fillColor: hex('E8F1F5'), textColor: 20, fontStyle: 'bold' },
            margin: { left, right: pageW - right, top },
          });
          y = (doc as any).lastAutoTable.finalY + 10;
          break;
      }
    }

    // ── Running header and page numbers, as on the printed CV
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...hex(GREY));
      doc.text('Curriculum Vitae', left, 52);
      doc.text(member.fullName, right, 52, { align: 'right' });
      doc.setDrawColor(...hex(GREY));
      doc.line(left, 57, right, 57);
      doc.setFontSize(9);
      doc.text(`Page ${p}`, right, pageH - 28, { align: 'right' });
    }
    doc.save(this.fileName(member, 'pdf'));
  }

  private pdfHero(doc: any, edition: string | undefined, member: CrewCv, x: number, getY: () => number, setY: (v: number) => void): void {
    let y = getY();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('CURRICULUM VITAE' + (edition ? ` · ${edition.toUpperCase()}` : ''), x, y + 8, { charSpace: 0.8 });
    y += 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(13, 43, 87);
    doc.text(member.fullName, x, y + 20);
    y += 28;
    if (member.title) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(107, 114, 128);
      doc.text(member.title, x, y + 11);
      y += 18;
    }
    setY(y);
  }

  /** The CV's visible sections flattened into blocks, numbered as on the page. */
  private blocks(list: CvSection[], numbering: boolean, depth = 0, parentIndex = 0): Block[] {
    const out: Block[] = [];
    let shown = 0;
    for (const s of list.filter(x => !x.hidden)) {
      shown++;
      const num = numbering ? sectionNumber(depth, shown, parentIndex) : '';
      out.push({ kind: 'heading', depth, text: [num, s.title].filter(Boolean).join(' ') });
      let n = 0;
      for (const e of s.entries.filter(e => e.text.trim() || e.period?.trim())) {
        if (e.heading) { out.push({ kind: 'subheading', text: plain(e.text.trim()) }); n = 0; continue; }
        const marker = s.kind === 'numbered' ? `${++n}.` : s.kind === 'paragraph' ? '' : '•';
        const lines = e.text.split('\n').map(l => l.trim()).filter(Boolean).map(runs);
        out.push({ kind: 'item', marker, lead: e.period?.trim() ?? '', lines });
      }
      if (s.table?.columns.length) out.push({ kind: 'table', columns: s.table.columns, rows: s.table.rows });
      out.push(...this.blocks(s.children, numbering, depth + 1, shown));
    }
    return out;
  }

  private wordRuns(d: any, line: Run[], color?: string): any[] {
    return line.map(r => new d.TextRun({ text: r.t, bold: r.b, color }));
  }

  private rule(d: any): any {
    return new d.Paragraph({ spacing: { after: 160 }, border: { bottom: { style: d.BorderStyle.SINGLE, size: 4, color: 'C5D3DC', space: 6 } }, children: [] });
  }

  /** The stored photo (a data URL) decoded, with its size; null when absent or not PNG/JPEG. */
  private async photo(src: string | null | undefined): Promise<{ dataUrl: string; data: Uint8Array; type: 'png' | 'jpg'; width: number; height: number } | null> {
    const m = /^data:image\/(png|jpe?g);base64,(.+)$/i.exec(src || '');
    if (!m) return null;
    const size = await new Promise<{ width: number; height: number } | null>(resolve => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = src!;
    });
    if (!size) return null;
    const bin = atob(m[2]);
    const data = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
    return { dataUrl: src!, data, type: m[1].toLowerCase() === 'png' ? 'png' : 'jpg', ...size };
  }

  /** Scales w×h to fit inside maxW×maxH, keeping its proportions. */
  private fit(w: number, h: number, maxW: number, maxH: number): { w: number; h: number } {
    const k = Math.min(maxW / w, maxH / h);
    return { w: Math.round(w * k), h: Math.round(h * k) };
  }

  private fileName(member: CrewCv, ext: string): string {
    const slug = (member.slug || member.fullName)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `cv-${slug || 'bassiana'}.${ext}`;
  }

  private save(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
