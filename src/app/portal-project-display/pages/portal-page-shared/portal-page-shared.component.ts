import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { PortalProjectContextService } from '../../../portal/services/portal-project-context.service';
import { PortalProject } from '../../../portal/models/portal-project.model';
import { PortalProjectDocumentService, ProjectDocument } from '../../../services/portal-project-document.service';

type TypeFilter = 'all' | ProjectDocument['category'];

/**
 * Files the admin marked as shared in the Shared Folder, as one flat list -
 * visitors never see how the admin organised them into folders. Searchable,
 * and filterable by file type, like the Events page.
 */
@Component({
  selector: 'app-portal-page-shared',
  templateUrl: './portal-page-shared.component.html',
  styleUrls: ['./portal-page-shared.component.scss'],
})
export class PortalPageSharedComponent implements OnInit {
  project: PortalProject | null = null;
  loading = true;
  files: ProjectDocument[] = [];
  filtered: ProjectDocument[] = [];
  searchTerm = '';
  activeType: TypeFilter = 'all';

  readonly typeFilters: { key: TypeFilter; label: string; icon: string }[] = [
    { key: 'all',   label: 'All',    icon: 'bx-grid-alt' },
    { key: 'pdf',   label: 'PDF',    icon: 'bxs-file-pdf' },
    { key: 'word',  label: 'Word',   icon: 'bxs-file-doc' },
    { key: 'excel', label: 'Excel',  icon: 'bx-table' },
    { key: 'image', label: 'Images', icon: 'bx-image-alt' },
    { key: 'other', label: 'Other',  icon: 'bx-file-blank' },
  ];

  constructor(
    private readonly context: PortalProjectContextService,
    private readonly docs: PortalProjectDocumentService,
    private readonly destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.context.project$
      .pipe(
        switchMap((project) => {
          this.project = project;
          return project ? this.docs.listShared(project.slug).pipe(catchError(() => of([]))) : of([]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((list) => {
        this.files = [...list].sort((a, b) => a.originalName.localeCompare(b.originalName));
        this.applyFilters();
        this.loading = false;
      });
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  setType(key: TypeFilter): void {
    this.activeType = key;
    this.applyFilters();
  }

  count(key: TypeFilter): number {
    return key === 'all' ? this.files.length : this.files.filter(f => f.category === key).length;
  }

  /** "All" plus only the types actually present - no row of empty chips. */
  get visibleTypeFilters(): { key: TypeFilter; label: string; icon: string }[] {
    return this.typeFilters.filter(f => f.key === 'all' || this.count(f.key) > 0);
  }

  private applyFilters(): void {
    const q = this.searchTerm.trim().toLowerCase();
    this.filtered = this.files.filter(f =>
      (this.activeType === 'all' || f.category === this.activeType) &&
      (!q || f.originalName.toLowerCase().includes(q) || f.fileType.toLowerCase().includes(q)));
  }

  downloadUrl(doc: ProjectDocument): string {
    return this.docs.downloadUrl(doc.projectSlug, doc.id);
  }

  previewUrl(doc: ProjectDocument): string {
    return this.docs.previewUrl(doc.projectSlug, doc.id);
  }

  /** Types a browser can show by itself in a new tab. */
  canPreview(doc: ProjectDocument): boolean {
    return doc.category === 'pdf' || doc.category === 'image' || doc.fileType === 'txt';
  }

  icon(doc: ProjectDocument): string {
    switch (doc.category) {
      case 'pdf':   return 'bxs-file-pdf';
      case 'word':  return 'bxs-file-doc';
      case 'excel': return 'bx-table';
      case 'image': return 'bx-image-alt';
      default:      return 'bx-file-blank';
    }
  }

  color(doc: ProjectDocument): string {
    switch (doc.category) {
      case 'pdf':   return '#ef4444';
      case 'word':  return '#3b82f6';
      case 'excel': return '#22c55e';
      case 'image': return '#a855f7';
      default:      return '#64748b';
    }
  }

  size(bytes: number): string {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
