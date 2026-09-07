import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../services/ThemeService';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { SidebarService } from '../services/sidebarservice';
import { AuthService } from '../services/AuthService';
import { MessageService } from 'primeng/api';
import { PortalProjectDocumentService, ProjectDocument, ProjectFolder } from '../services/portal-project-document.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface PortalProject {
  slug: string;
  title: string;
  description: string;
  image: string;
  isActive: boolean;
  accentColor: string;
}

interface ProjectWithStats extends PortalProject {
  fileCount: number;
  totalSize: number;
}

@Component({
  selector: 'app-docsadmin',
  templateUrl: 'docsadmin.component.html',
  styleUrls: ['docsadmin.component.scss']
})
export class DocsadminComponent implements OnInit {

  isSidebarVisible = true;

  view: 'projects' | 'documents' = 'projects';

  projects: ProjectWithStats[] = [];
  selectedProject: ProjectWithStats | null = null;
  documents: ProjectDocument[] = [];
  filteredDocuments: ProjectDocument[] = [];

  projectSearch = '';
  docSearch = '';
  activeFilter = 'all';

  isLoadingProjects = false;
  isLoadingDocs = false;
  isDragOver = false;

  totalDocuments = 0;
  totalStorage = 0;

  deleteConfirmDoc: ProjectDocument | null = null;
  bulkDeleteConfirmOpen = false;

  selectedDocIds = new Set<number>();
  moveModalOpen = false;
  movingDocIds: number[] = [];

  // Folder state
  folders: ProjectFolder[] = [];
  allFolders: ProjectFolder[] = [];
  currentSubfolder: string | null = null;
  showCreateFolderModal = false;
  newFolderName = '';
  folderNameError = '';
  deleteFolderConfirm: ProjectFolder | null = null;

  previewDoc: ProjectDocument | null = null;
  previewLoading = false;
  previewSafeImgUrl: SafeUrl | null = null;
  previewSafeResourceUrl: SafeResourceUrl | null = null;
  previewCsvRows: string[][] | null = null;
  previewTextContent: string | null = null;
  previewHtmlContent: SafeHtml | null = null;
  private previewBlobUrl: string | null = null;

  private readonly BLOB_EXTS   = new Set(['pdf','jpg','jpeg','png','gif','webp','bmp','svg']);
  private readonly CSV_EXTS    = new Set(['csv']);
  private readonly TEXT_EXTS   = new Set(['txt','json','xml','html','htm','yaml','yml','md','log','ini','cfg','conf','sql','sh','bat','properties']);
  private readonly MAMMOTH_EXTS = new Set(['docx','doc','odt']);
  private readonly EXCEL_EXTS  = new Set(['xlsx','xls','ods']);

  filters = [
    { key: 'all',   label: 'All',    icon: 'bx-grid-alt' },
    { key: 'pdf',   label: 'PDF',    icon: 'bxs-file-pdf' },
    { key: 'word',  label: 'Word',   icon: 'bxs-file-doc' },
    { key: 'excel', label: 'Excel',  icon: 'bx-table' },
    { key: 'image', label: 'Images', icon: 'bx-image-alt' },
    { key: 'other', label: 'Other',  icon: 'bx-file-blank' },
  ];

  constructor(
    private sidebarService: SidebarService,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private messageService: MessageService,
    private docService: PortalProjectDocumentService,
    private sanitizer: DomSanitizer,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated() || !this.authService.isAdmin()) {
      this.router.navigate(['/'], { replaceUrl: true });
      return;
    }
    this.sidebarService.sidebarVisibility$.subscribe(v => this.isSidebarVisible = v);
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoadingProjects = true;
    const url = `${this.authService.getApiBaseUrl()}/portal-projects`;
    this.http.get<PortalProject[]>(url).subscribe({
      next: (projects) => {
        if (projects.length === 0) {
          this.projects = [];
          this.totalDocuments = 0;
          this.totalStorage = 0;
          this.isLoadingProjects = false;
          return;
        }
        const statsRequests = projects.map(p =>
          this.docService.stats(p.slug).pipe(catchError(() => of({ fileCount: 0, totalSize: 0 })))
        );
        forkJoin(statsRequests).subscribe({
          next: (statsArray) => {
            this.projects = projects.map((p, i) => ({
              ...p,
              fileCount: statsArray[i].fileCount,
              totalSize: statsArray[i].totalSize,
            }));
            this.totalDocuments = this.projects.reduce((sum, p) => sum + p.fileCount, 0);
            this.totalStorage = this.projects.reduce((sum, p) => sum + p.totalSize, 0);
            this.isLoadingProjects = false;
          },
          error: () => { this.isLoadingProjects = false; }
        });
      },
      error: () => { this.isLoadingProjects = false; }
    });
  }

  openProject(project: ProjectWithStats): void {
    this.selectedProject = { ...project };
    this.view = 'documents';
    this.navigateToPath(null);
  }

  backToProjects(): void {
    this.view = 'projects';
    this.selectedProject = null;
    this.currentSubfolder = null;
    this.documents = [];
    this.filteredDocuments = [];
    this.folders = [];
    this.allFolders = [];
    this.selectedDocIds.clear();
    this.loadProjects();
  }

  openFolder(folder: ProjectFolder): void {
    this.navigateToPath(folder.path);
  }

  backToRoot(): void {
    this.navigateToPath(null);
  }

  goUpOneLevel(): void {
    if (!this.currentSubfolder) return;
    const idx = this.currentSubfolder.lastIndexOf('/');
    this.navigateToPath(idx >= 0 ? this.currentSubfolder.slice(0, idx) : null);
  }

  navigateToPath(path: string | null): void {
    this.currentSubfolder = path && path.length > 0 ? path : null;
    this.activeFilter = 'all';
    this.docSearch = '';
    this.selectedDocIds.clear();
    this.loadFolders();
    this.loadDocuments();
  }

  get breadcrumbSegments(): { name: string; path: string }[] {
    if (!this.currentSubfolder) return [];
    const parts = this.currentSubfolder.split('/');
    let acc = '';
    return parts.map(name => {
      acc = acc ? `${acc}/${name}` : name;
      return { name, path: acc };
    });
  }

  loadFolders(): void {
    if (!this.selectedProject) return;
    this.docService.listFolders(this.selectedProject.slug, this.currentSubfolder ?? '').subscribe({
      next: (f) => { this.folders = f; },
      error: () => {}
    });
  }

  loadAllFolders(): void {
    if (!this.selectedProject) return;
    this.docService.listAllFolders(this.selectedProject.slug).subscribe({
      next: (f) => { this.allFolders = f; },
      error: () => {}
    });
  }

  loadDocuments(): void {
    if (!this.selectedProject) return;
    this.isLoadingDocs = true;
    this.docService.list(this.selectedProject.slug, undefined, this.currentSubfolder ?? '').subscribe({
      next: (docs) => {
        this.documents = docs;
        this.applyFilters();
        this.isLoadingDocs = false;
      },
      error: () => { this.isLoadingDocs = false; }
    });
  }

  // ── Folder CRUD ─────────────────────────────────────────────────────────────

  openCreateFolderModal(): void {
    this.newFolderName = '';
    this.folderNameError = '';
    this.showCreateFolderModal = true;
  }

  closeCreateFolderModal(): void {
    this.showCreateFolderModal = false;
  }

  submitCreateFolder(): void {
    const name = this.newFolderName.trim();
    if (!name) { this.folderNameError = 'Folder name is required'; return; }
    if (!/^[\w\s\-\.]+$/.test(name)) { this.folderNameError = 'Only letters, numbers, spaces, - and . allowed'; return; }
    if (!this.selectedProject) return;
    this.docService.createFolder(this.selectedProject.slug, name, this.currentSubfolder ?? '').subscribe({
      next: (folder) => {
        this.folders = [...this.folders, folder].sort((a, b) => a.name.localeCompare(b.name));
        this.loadAllFolders();
        this.showCreateFolderModal = false;
        this.messageService.add({ severity: 'success', summary: 'Created', detail: `Folder "${name}" created` });
      },
      error: (err) => {
        this.folderNameError = err?.error || 'Could not create folder';
      }
    });
  }

  confirmDeleteFolder(folder: ProjectFolder, event: Event): void {
    event.stopPropagation();
    this.deleteFolderConfirm = folder;
  }

  cancelDeleteFolder(): void { this.deleteFolderConfirm = null; }

  executeDeleteFolder(): void {
    if (!this.deleteFolderConfirm || !this.selectedProject) return;
    const folder = this.deleteFolderConfirm;
    this.deleteFolderConfirm = null;
    this.docService.deleteFolder(this.selectedProject.slug, folder.id).subscribe({
      next: () => {
        this.folders = this.folders.filter(f => f.id !== folder.id);
        this.loadAllFolders();
        this.refreshProjectStats();
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `Folder "${folder.name}" deleted` });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete folder' });
      }
    });
  }

  private refreshProjectStats(): void {
    if (!this.selectedProject) return;
    const slug = this.selectedProject.slug;
    this.docService.stats(slug).subscribe({
      next: (stats) => {
        if (this.selectedProject && this.selectedProject.slug === slug) {
          this.selectedProject.fileCount = stats.fileCount;
          this.selectedProject.totalSize = stats.totalSize;
        }
      },
      error: () => {}
    });
  }

  setFilter(key: string): void {
    this.activeFilter = key;
    this.applyFilters();
  }

  applyFilters(): void {
    let docs = [...this.documents];
    if (this.activeFilter !== 'all') {
      docs = docs.filter(d => d.category === this.activeFilter);
    }
    if (this.docSearch.trim()) {
      const q = this.docSearch.trim().toLowerCase();
      docs = docs.filter(d => d.originalName.toLowerCase().includes(q));
    }
    this.filteredDocuments = docs;
  }

  onDocSearchChange(): void {
    this.applyFilters();
  }

  get filteredProjects(): ProjectWithStats[] {
    if (!this.projectSearch.trim()) return this.projects;
    const q = this.projectSearch.trim().toLowerCase();
    return this.projects.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(f => this.uploadFile(f));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(f => this.uploadFile(f));
    }
    input.value = '';
  }

  uploadFile(file: File): void {
    if (!this.selectedProject) return;
    this.docService.upload(this.selectedProject.slug, file, this.currentSubfolder ?? undefined).subscribe({
      next: (doc) => {
        this.documents.unshift(doc);
        this.applyFilters();
        if (this.selectedProject) {
          this.selectedProject.fileCount++;
          this.selectedProject.totalSize += doc.fileSize;
        }
        this.messageService.add({
          severity: 'success', summary: 'Uploaded', detail: file.name
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error', summary: 'Upload Failed', detail: file.name
        });
      }
    });
  }

  confirmDelete(doc: ProjectDocument): void {
    this.deleteConfirmDoc = doc;
  }

  cancelDelete(): void {
    this.deleteConfirmDoc = null;
  }

  executeDelete(): void {
    if (!this.deleteConfirmDoc || !this.selectedProject) return;
    const doc = this.deleteConfirmDoc;
    this.deleteConfirmDoc = null;
    this.docService.delete(this.selectedProject.slug, doc.id).subscribe({
      next: () => {
        this.documents = this.documents.filter(d => d.id !== doc.id);
        this.selectedDocIds.delete(doc.id);
        this.applyFilters();
        if (this.selectedProject) {
          this.selectedProject.fileCount = Math.max(0, this.selectedProject.fileCount - 1);
          this.selectedProject.totalSize = Math.max(0, this.selectedProject.totalSize - doc.fileSize);
        }
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: doc.originalName });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete file' });
      }
    });
  }

  // ── Bulk select ────────────────────────────────────────────────────────────

  isDocSelected(id: number): boolean {
    return this.selectedDocIds.has(id);
  }

  toggleDocSelection(id: number): void {
    if (this.selectedDocIds.has(id)) this.selectedDocIds.delete(id);
    else this.selectedDocIds.add(id);
  }

  get allDocsSelected(): boolean {
    return this.filteredDocuments.length > 0 && this.filteredDocuments.every(d => this.selectedDocIds.has(d.id));
  }

  toggleSelectAllDocs(): void {
    if (this.allDocsSelected) {
      this.filteredDocuments.forEach(d => this.selectedDocIds.delete(d.id));
    } else {
      this.filteredDocuments.forEach(d => this.selectedDocIds.add(d.id));
    }
  }

  clearDocSelection(): void {
    this.selectedDocIds.clear();
  }

  getSelectedDocIds(): number[] {
    return Array.from(this.selectedDocIds);
  }

  // ── Bulk delete ────────────────────────────────────────────────────────────

  confirmBulkDelete(): void {
    if (this.selectedDocIds.size === 0) return;
    this.bulkDeleteConfirmOpen = true;
  }

  cancelBulkDelete(): void {
    this.bulkDeleteConfirmOpen = false;
  }

  executeBulkDelete(): void {
    this.bulkDeleteConfirmOpen = false;
    this.deleteDocsSequentially(Array.from(this.selectedDocIds), []);
  }

  private deleteDocsSequentially(ids: number[], failed: number[]): void {
    if (!this.selectedProject) return;

    if (ids.length === 0) {
      this.selectedDocIds.clear();
      if (failed.length > 0) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `${failed.length} file(s) could not be deleted` });
      } else {
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Selected files deleted' });
      }
      return;
    }

    const [id, ...rest] = ids;
    const doc = this.documents.find(d => d.id === id);
    this.docService.delete(this.selectedProject.slug, id).subscribe({
      next: () => {
        this.documents = this.documents.filter(d => d.id !== id);
        this.applyFilters();
        if (this.selectedProject && doc) {
          this.selectedProject.fileCount = Math.max(0, this.selectedProject.fileCount - 1);
          this.selectedProject.totalSize = Math.max(0, this.selectedProject.totalSize - doc.fileSize);
        }
        this.deleteDocsSequentially(rest, failed);
      },
      error: () => this.deleteDocsSequentially(rest, [...failed, id])
    });
  }

  // ── Move to folder ─────────────────────────────────────────────────────────

  openMoveModal(ids: number[]): void {
    if (!this.selectedProject || ids.length === 0) return;
    this.movingDocIds = ids;
    this.moveModalOpen = true;
    this.loadAllFolders();
  }

  cancelMove(): void {
    this.moveModalOpen = false;
    this.movingDocIds = [];
  }

  executeMoveTo(subfolder: string): void {
    if (!this.selectedProject) return;
    const ids = this.movingDocIds;
    this.moveModalOpen = false;
    this.moveDocsSequentially(ids, subfolder, []);
  }

  private moveDocsSequentially(ids: number[], subfolder: string, failed: number[]): void {
    if (!this.selectedProject) return;

    if (ids.length === 0) {
      this.movingDocIds = [];
      this.selectedDocIds.clear();
      this.loadFolders();
      this.loadAllFolders();
      this.loadDocuments();
      if (failed.length > 0) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `${failed.length} file(s) could not be moved` });
      } else {
        this.messageService.add({ severity: 'success', summary: 'Moved', detail: subfolder ? `Moved to "${subfolder}"` : 'Moved to root' });
      }
      return;
    }

    const [id, ...rest] = ids;
    this.docService.move(this.selectedProject.slug, id, subfolder).subscribe({
      next: () => this.moveDocsSequentially(rest, subfolder, failed),
      error: () => this.moveDocsSequentially(rest, subfolder, [...failed, id])
    });
  }

  viewFile(doc: ProjectDocument): void {
    if (!this.selectedProject) return;
    this.previewDoc          = doc;
    this.previewLoading      = true;
    this.previewSafeImgUrl   = null;
    this.previewSafeResourceUrl = null;
    this.previewCsvRows      = null;
    this.previewTextContent  = null;
    this.previewHtmlContent  = null;

    const slug = this.selectedProject.slug;
    const ext  = doc.fileType.toLowerCase();

    if (this.BLOB_EXTS.has(ext)) {
      this.docService.previewBlob(slug, doc.id).subscribe({
        next: (blob) => {
          if (this.previewBlobUrl) URL.revokeObjectURL(this.previewBlobUrl);
          this.previewBlobUrl         = URL.createObjectURL(blob);
          this.previewSafeImgUrl      = this.sanitizer.bypassSecurityTrustUrl(this.previewBlobUrl);
          this.previewSafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewBlobUrl);
          this.previewLoading = false;
        },
        error: () => { this.previewLoading = false; }
      });

    } else if (this.CSV_EXTS.has(ext)) {
      this.docService.previewText(slug, doc.id).subscribe({
        next: (text) => { this.previewCsvRows = this.parseCsv(text); this.previewLoading = false; },
        error: () => { this.previewLoading = false; }
      });

    } else if (this.TEXT_EXTS.has(ext)) {
      this.docService.previewText(slug, doc.id).subscribe({
        next: (text) => {
          this.previewTextContent = text.length > 200_000 ? text.slice(0, 200_000) + '\n… (truncated)' : text;
          this.previewLoading = false;
        },
        error: () => { this.previewLoading = false; }
      });

    } else if (this.MAMMOTH_EXTS.has(ext)) {
      this.docService.previewArrayBuffer(slug, doc.id).subscribe({
        next: (buf) => {
          (import('mammoth') as Promise<any>).then((mammoth: any) => {
            mammoth.convertToHtml({ arrayBuffer: buf })
              .then((result: { value: string }) => {
                this.previewHtmlContent = this.sanitizer.bypassSecurityTrustHtml(result.value);
                this.previewLoading = false;
              })
              .catch(() => { this.previewLoading = false; });
          });
        },
        error: () => { this.previewLoading = false; }
      });

    } else if (this.EXCEL_EXTS.has(ext)) {
      this.docService.previewArrayBuffer(slug, doc.id).subscribe({
        next: (buf) => {
          (import('xlsx') as Promise<any>).then((XLSX: any) => {
            const wb   = XLSX.read(buf, { type: 'array' });
            const ws   = wb.Sheets[wb.SheetNames[0]];
            const html = XLSX.utils.sheet_to_html(ws, { id: 'xlsx-table' });
            this.previewHtmlContent = this.sanitizer.bypassSecurityTrustHtml(html);
            this.previewLoading = false;
          });
        },
        error: () => { this.previewLoading = false; }
      });

    } else {
      this.previewLoading = false;
    }
  }

  closePreview(): void {
    if (this.previewBlobUrl) { URL.revokeObjectURL(this.previewBlobUrl); this.previewBlobUrl = null; }
    this.previewDoc             = null;
    this.previewSafeImgUrl      = null;
    this.previewSafeResourceUrl = null;
    this.previewCsvRows         = null;
    this.previewTextContent     = null;
    this.previewHtmlContent     = null;
  }

  private parseCsv(text: string): string[][] {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
                      .split('\n').filter(l => l.trim()).slice(0, 500);
    return lines.map(line => {
      const cells: string[] = [];
      let cur = '', inQ = false;
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; }
        else if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ''; }
        else { cur += ch; }
      }
      cells.push(cur.trim());
      return cells;
    });
  }

  downloadFile(doc: ProjectDocument): void {
    if (!this.selectedProject) return;
    const url = this.docService.downloadUrl(this.selectedProject.slug, doc.id);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  formatSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  }

  getFileIcon(category: string): string {
    switch (category) {
      case 'pdf':   return 'bxs-file-pdf';
      case 'word':  return 'bxs-file-doc';
      case 'excel': return 'bx-table';
      case 'image': return 'bx-image-alt';
      default:      return 'bx-file-blank';
    }
  }

  getFileColor(category: string): string {
    switch (category) {
      case 'pdf':   return '#ef4444';
      case 'word':  return '#3b82f6';
      case 'excel': return '#22c55e';
      case 'image': return '#a855f7';
      default:      return '#64748b';
    }
  }

  getCategoryCount(category: string): number {
    if (!this.documents) return 0;
    if (category === 'all') return this.documents.length;
    return this.documents.filter(d => d.category === category).length;
  }

  toggleSidebar(): void { this.sidebarService.toggleSidebar(); }

}
