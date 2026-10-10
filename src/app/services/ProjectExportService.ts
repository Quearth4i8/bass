import { Injectable } from '@angular/core';

export type ProjectExportFormat = 'xlsx' | 'docx' | 'pdf' | 'txt';

interface ExportColumn {
  header: string;
  value: (project: any) => string | number;
}

/**
 * Exports a list of projects (typically the admin page's current filtered
 * results) as Excel, Word, PDF or plain text. Each format's library is loaded
 * on demand so it doesn't weigh on the initial bundle.
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectExportService {

  private readonly columns: ExportColumn[] = [
    { header: 'Project',     value: p => p.titreproj || '' },
    { header: 'Acronym',     value: p => p.acronyme || '' },
    { header: 'Coordinator', value: p => p.responsable || '' },
    { header: 'Partner',     value: p => p.partenaire || '' },
    { header: 'Program',     value: p => p.programme || '' },
    { header: 'Thematic',    value: p => p.thematique || '' },
    { header: 'Start year',  value: p => p.startyear || '' },
    { header: 'End year',    value: p => p.endyear || '' },
    { header: 'Budget (€)',  value: p => (p.budget || p.budget === 0) ? Number(p.budget) : '' },
    { header: 'Group',       value: p => this.groupLabel(p.title) },
  ];

  /** @param filterLabel human-readable description of the active filter, '' for none. */
  async export(projects: any[], format: ProjectExportFormat, filterLabel: string): Promise<void> {
    const fileName = this.fileName(filterLabel, format);
    switch (format) {
      case 'xlsx': return this.exportExcel(projects, filterLabel, fileName);
      case 'docx': return this.exportWord(projects, filterLabel, fileName);
      case 'pdf':  return this.exportPdf(projects, filterLabel, fileName);
      case 'txt':  return this.exportText(projects, filterLabel, fileName);
    }
  }

  private async exportExcel(projects: any[], filterLabel: string, fileName: string): Promise<void> {
    const XLSX = await import('xlsx');
    const rows = projects.map((p, i) => [i + 1, ...this.columns.map(c => c.value(p))]);
    const sheet = XLSX.utils.aoa_to_sheet([['#', ...this.columns.map(c => c.header)], ...rows]);
    sheet['!cols'] = [{ wch: 5 }, { wch: 50 }, { wch: 14 }, { wch: 24 }, { wch: 30 }, { wch: 24 },
                      { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 12 }];

    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Projects');
    if (filterLabel) {
      XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
        ['Filter', filterLabel], ['Projects', projects.length], ['Exported', this.today()],
      ]), 'Filter');
    }
    XLSX.writeFile(book, fileName);
  }

  private async exportWord(projects: any[], filterLabel: string, fileName: string): Promise<void> {
    const d = await import('docx');
    const cell = (text: string, bold = false) => new d.TableCell({
      children: [new d.Paragraph({ children: [new d.TextRun({ text, bold, size: 16 })] })],
      shading: bold ? { fill: 'D9EFEC', type: d.ShadingType.CLEAR, color: 'auto' } : undefined,
    });

    const table = new d.Table({
      width: { size: 100, type: d.WidthType.PERCENTAGE },
      rows: [
        new d.TableRow({ tableHeader: true, children: ['#', ...this.columns.map(c => c.header)].map(h => cell(h, true)) }),
        ...projects.map((p, i) => new d.TableRow({
          children: [String(i + 1), ...this.columns.map(c => this.display(c, p))].map(v => cell(v)),
        })),
      ],
    });

    const doc = new d.Document({
      sections: [{
        properties: { page: { size: { orientation: d.PageOrientation.LANDSCAPE } } },
        children: [
          new d.Paragraph({ heading: d.HeadingLevel.HEADING_1, children: [new d.TextRun('Bassiana — Projects')] }),
          new d.Paragraph({ children: [new d.TextRun({ text: this.summary(projects, filterLabel), italics: true, size: 18 })] }),
          new d.Paragraph({ children: [] }),
          table,
        ],
      }],
    });
    this.save(await d.Packer.toBlob(doc), fileName);
  }

  private async exportPdf(projects: any[], filterLabel: string, fileName: string): Promise<void> {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    doc.setFontSize(16);
    doc.text('Bassiana — Projects', 40, 40);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(this.summary(projects, filterLabel), 40, 58);

    autoTable(doc, {
      startY: 72,
      head: [['#', ...this.columns.map(c => c.header)]],
      body: projects.map((p, i) => [String(i + 1), ...this.columns.map(c => this.display(c, p))]),
      styles: { fontSize: 7.5, cellPadding: 4, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: [26, 143, 127], textColor: 255 },
      alternateRowStyles: { fillColor: [244, 249, 251] },
      columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 150 } },
      margin: { left: 40, right: 40 },
    });
    doc.save(fileName);
  }

  private exportText(projects: any[], filterLabel: string, fileName: string): void {
    const width = Math.max(...this.columns.map(c => c.header.length));
    const blocks = projects.map((p, i) =>
      [`${i + 1}.`, ...this.columns.map(c => `   ${c.header.padEnd(width)} : ${this.display(c, p) || '—'}`)].join('\n'));
    const text = ['BASSIANA — PROJECTS', this.summary(projects, filterLabel), '='.repeat(60), '', blocks.join('\n\n'), '']
      .join('\n');
    // BOM so Notepad/Excel read accented names (Béchir…) as UTF-8.
    this.save(new Blob(['﻿' + text], { type: 'text/plain;charset=utf-8' }), fileName);
  }

  /** Cell text for Word/PDF/TXT, where the budget reads better formatted. */
  private display(column: ExportColumn, project: any): string {
    const value = column.value(project);
    if (column.header.startsWith('Budget') && typeof value === 'number') {
      return '€ ' + value.toLocaleString('fr-FR').replace(/ | /g, ' ');
    }
    return String(value);
  }

  private summary(projects: any[], filterLabel: string): string {
    const count = `${projects.length} project${projects.length === 1 ? '' : 's'}`;
    return `${filterLabel ? `Filter: ${filterLabel} · ` : 'All projects · '}${count} · Exported ${this.today()}`;
  }

  /** "SUBMITTED PROJECTS" -> "Submitted" (same as the admin table's pill). */
  private groupLabel(title: string): string {
    const word = (title || '').replace(/\s*PROJECTS?\s*$/i, '').trim().toLowerCase();
    return word ? word.charAt(0).toUpperCase() + word.slice(1) : (title || '');
  }

  private fileName(filterLabel: string, ext: string): string {
    const slug = filterLabel
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      .slice(0, 40);
    return `bassiana-projects${slug ? '-' + slug : ''}-${this.today()}.${ext}`;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private save(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
