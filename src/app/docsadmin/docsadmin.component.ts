import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../services/ThemeService';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { SidebarService } from '../services/sidebarservice';
import { AuthService } from '../services/AuthService';
import { MessageService } from 'primeng/api';
import { PortalProjectDocumentService, ProjectDocument, ProjectFolder } from '../services/portal-project-document.service';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface PortalProject {
  slug: string;
  title: string;
  description: string;
  image: string;
  isActive: boolean;
  accentColor: string;
}

interface TreeRow {
  folder: ProjectFolder;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
}

/** One file to upload, and the folder it goes in relative to where it was dropped. */
interface PendingUpload {
  file: File;
  relDir: string;
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
  selectedFolderIds = new Set<number>();
  moveModalOpen = false;
  movingDocIds: number[] = [];
  movingFolders: ProjectFolder[] = [];

  // Folder state
  folders: ProjectFolder[] = [];
  allFolders: ProjectFolder[] = [];
  currentSubfolder: string | null = null;
  showCreateFolderModal = false;
  newFolderName = '';
  folderNameError = '';
  deleteFolderConfirm: ProjectFolder | null = null;

  /** Folder tree, flattened in display order with collapsed branches left out. */
  treeRows: TreeRow[] = [];
  private expandedPaths = new Set<string>();

  /**
   * What is being dragged inside the explorer (null for files dragged in from
   * the desktop, which are uploads). Drop targets are folder paths, '' = root.
   */
  dragItem: { docIds: number[]; folders: ProjectFolder[] } | null = null;
  dropTargetPath: string | null = null;

  /** Batch upload progress, shown in the toolbar while a drop/selection is processed. */
  uploadProgress: { done: number; total: number; failed: number } | null = null;

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
    this.allFolders = [];
    this.expandedPaths.clear();
    this.treeRows = [];
    this.loadAllFolders();
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
    this.clearDocSelection();
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
    // Opening a folder from anywhere reveals it in the tree.
    if (this.currentSubfolder) {
      const parts = this.currentSubfolder.split('/');
      for (let i = 1; i < parts.length; i++) this.expandedPaths.add(parts.slice(0, i).join('/'));
      this.rebuildTree();
    }
    this.activeFilter = 'all';
    this.docSearch = '';
    this.clearDocSelection();
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
      next: (f) => { this.allFolders = f; this.rebuildTree(); },
      error: () => {}
    });
  }

  toggleTreeNode(path: string, event: Event): void {
    event.stopPropagation();
    if (this.expandedPaths.has(path)) this.expandedPaths.delete(path);
    else this.expandedPaths.add(path);
    this.rebuildTree();
  }

  /** Depth-first walk of allFolders (a flat list with parentPath links). */
  private rebuildTree(): void {
    const byParent = new Map<string, ProjectFolder[]>();
    for (const f of this.allFolders) {
      const parent = f.parentPath || '';
      if (!byParent.has(parent)) byParent.set(parent, []);
      byParent.get(parent)!.push(f);
    }
    byParent.forEach(list => list.sort((a, b) => a.name.localeCompare(b.name)));

    const rows: TreeRow[] = [];
    const walk = (parent: string, depth: number) => {
      for (const folder of byParent.get(parent) ?? []) {
        const hasChildren = byParent.has(folder.path);
        const expanded = hasChildren && this.expandedPaths.has(folder.path);
        rows.push({ folder, depth, hasChildren, expanded });
        if (expanded) walk(folder.path, depth + 1);
      }
    };
    walk('', 0);
    this.treeRows = rows;
  }

  /** Sub-folders of the current level, narrowed by the search box; hidden while a file-type filter is on. */
  get visibleFolders(): ProjectFolder[] {
    if (this.activeFilter !== 'all') return [];
    const q = this.docSearch.trim().toLowerCase();
    return q ? this.folders.filter(f => f.name.toLowerCase().includes(q)) : this.folders;
  }

  /** Destination of the ".." row: the current folder's parent ('' = root). */
  get parentOfCurrent(): string {
    if (!this.currentSubfolder) return '';
    const idx = this.currentSubfolder.lastIndexOf('/');
    return idx >= 0 ? this.currentSubfolder.slice(0, idx) : '';
  }

  get currentFolderSize(): number {
    return this.documents.reduce((sum, d) => sum + (d.fileSize || 0), 0);
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
    // A row being moved is not an upload: no upload overlay for it.
    if (!this.dragItem) this.isDragOver = true;
  }

  // ── Drag to move ───────────────────────────────────────────────────────────

  onFileDragStart(event: DragEvent, doc: ProjectDocument): void {
    this.startDrag(event, this.selectedDocIds.has(doc.id), { docIds: [doc.id], folders: [] }, doc.originalName);
  }

  onFolderDragStart(event: DragEvent, folder: ProjectFolder): void {
    this.startDrag(event, this.selectedFolderIds.has(folder.id), { docIds: [], folders: [folder] }, folder.name);
  }

  /** Grabbing a checked row carries the whole selection; an unchecked one goes alone. */
  private startDrag(event: DragEvent, partOfSelection: boolean,
                    single: { docIds: number[]; folders: ProjectFolder[] }, label: string): void {
    this.dragItem = partOfSelection && this.selectionCount > 1 ? this.currentSelection() : single;
    const n = this.dragItem.docIds.length + this.dragItem.folders.length;
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'move';
    // Firefox will not start a drag without some data set.
    event.dataTransfer.setData('text/plain', n > 1 ? `${n} items` : label);
  }

  onDragEnd(): void {
    this.dragItem = null;
    this.dropTargetPath = null;
  }

  isDragging(kind: 'doc' | 'folder', id: number): boolean {
    if (!this.dragItem) return false;
    return kind === 'doc' ? this.dragItem.docIds.includes(id) : this.dragItem.folders.some(f => f.id === id);
  }

  /** Whether the current drag may land in `path`. */
  canDropInto(path: string): boolean {
    return !!this.dragItem && this.isValidDestination(path, this.dragItem.folders);
  }

  /**
   * Everything that can be dragged or selected sits in the current folder, so
   * that is never a destination; nor is any folder being moved, or anything
   * inside one.
   */
  isValidDestination(path: string, folders: ProjectFolder[]): boolean {
    if (path === (this.currentSubfolder ?? '')) return false;
    return !folders.some(f => path === f.path || path.startsWith(f.path + '/'));
  }

  onTargetDragOver(event: DragEvent, path: string): void {
    if (!this.canDropInto(path)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dropTargetPath = path;
  }

  onTargetDragLeave(event: DragEvent, path: string): void {
    const next = event.relatedTarget as Node | null;
    if (next && (event.currentTarget as HTMLElement).contains(next)) return;
    if (this.dropTargetPath === path) this.dropTargetPath = null;
  }

  onTargetDrop(event: DragEvent, path: string): void {
    event.preventDefault();
    event.stopPropagation();
    const item = this.dragItem;
    this.onDragEnd();
    if (item) this.moveItems(item.docIds, item.folders, path);
  }

  onDragLeave(event?: DragEvent): void {
    // dragleave also fires when the pointer moves onto a child element; only a
    // real exit from the pane should drop the overlay, or it flickers.
    const next = event?.relatedTarget as Node | null;
    const pane = event?.currentTarget as HTMLElement | null;
    if (next && pane && pane.contains(next)) return;
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    // A row released over empty space: not an upload, nothing to do.
    if (this.dragItem) { this.onDragEnd(); return; }

    // Entries must be taken synchronously - the DataTransfer is emptied as soon
    // as this handler returns. Folders only show up as entries; in `files` they
    // appear as empty pseudo-files, which is what made the server reject them.
    const items = Array.from(event.dataTransfer?.items ?? []);
    const entries = items
      .filter(i => i.kind === 'file')
      .map(i => (i as any).webkitGetAsEntry?.() as any)
      .filter(Boolean);

    if (entries.length) {
      Promise.all(entries.map(e => this.collectEntry(e, ''))).then(lists => {
        const dirs = new Set<string>();
        const uploads: PendingUpload[] = [];
        for (const l of lists) { l.dirs.forEach(d => dirs.add(d)); uploads.push(...l.files); }
        this.uploadBatch(uploads, Array.from(dirs));
      });
      return;
    }
    const files = Array.from(event.dataTransfer?.files ?? []);
    this.uploadBatch(files.map(file => ({ file, relDir: '' })), []);
  }

  /** Recursively lists a dropped entry: every file with its folder, and every folder (even empty ones). */
  private async collectEntry(entry: any, parent: string): Promise<{ dirs: string[]; files: PendingUpload[] }> {
    if (entry.isFile) {
      const file: File = await new Promise((res, rej) => entry.file(res, rej));
      return { dirs: [], files: [{ file, relDir: parent }] };
    }
    const dirPath = parent ? `${parent}/${this.safeFolderName(entry.name)}` : this.safeFolderName(entry.name);
    const reader = entry.createReader();
    const children: any[] = [];
    // readEntries hands back at most ~100 entries per call; keep reading until empty.
    for (;;) {
      const batch: any[] = await new Promise((res, rej) => reader.readEntries(res, rej));
      if (!batch.length) break;
      children.push(...batch);
    }
    const result = { dirs: [dirPath], files: [] as PendingUpload[] };
    for (const child of children) {
      const sub = await this.collectEntry(child, dirPath);
      result.dirs.push(...sub.dirs);
      result.files.push(...sub.files);
    }
    return result;
  }

  /** The backend accepts letters, digits, _, spaces, - and . in folder names. */
  private safeFolderName(name: string): string {
    const cleaned = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s\-.]/g, '-').trim();
    return cleaned || 'folder';
  }

  onFolderSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    const dirs = new Set<string>();
    const uploads: PendingUpload[] = files.map(file => {
      // "Top/Sub/file.pdf" -> folder "Top/Sub"
      const parts = ((file as any).webkitRelativePath || file.name).split('/').slice(0, -1).map((p: string) => this.safeFolderName(p));
      for (let i = 1; i <= parts.length; i++) dirs.add(parts.slice(0, i).join('/'));
      return { file, relDir: parts.join('/') };
    });
    this.uploadBatch(uploads, Array.from(dirs));
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    this.uploadBatch(files.map(file => ({ file, relDir: '' })), []);
  }

  /**
   * Creates `dirs` (relative to the current folder) parent-first, then uploads
   * the files a few at a time, with one summary message at the end instead of
   * a toast per file.
   */
  private uploadBatch(uploads: PendingUpload[], dirs: string[]): void {
    if (!this.selectedProject) return;
    const slug = this.selectedProject.slug;
    const base = this.currentSubfolder ?? '';
    const abs = (rel: string) => [base, rel].filter(Boolean).join('/');

    const valid = uploads.filter(u => u.file.size > 0);
    const skipped = uploads.length - valid.length;
    if (!valid.length && !dirs.length) {
      if (skipped) this.messageService.add({ severity: 'warn', summary: 'Nothing uploaded', detail: 'Empty files cannot be uploaded' });
      return;
    }

    this.uploadProgress = { done: 0, total: valid.length, failed: 0 };
    const orderedDirs = [...dirs].sort((a, b) => a.split('/').length - b.split('/').length);

    const createDirs = (i: number): Promise<void> => {
      if (i >= orderedDirs.length) return Promise.resolve();
      const rel = orderedDirs[i];
      const idx = rel.lastIndexOf('/');
      const name = idx >= 0 ? rel.slice(idx + 1) : rel;
      const parent = abs(idx >= 0 ? rel.slice(0, idx) : '');
      // "Folder already exists" is fine - the files just go into it.
      return new Promise<void>(res => this.docService.createFolder(slug, name, parent).subscribe({ next: () => res(), error: () => res() }))
        .then(() => createDirs(i + 1));
    };

    createDirs(0).then(() => {
      let next = 0;
      const worker = (): Promise<void> => {
        if (next >= valid.length) return Promise.resolve();
        const u = valid[next++];
        return new Promise<void>(res => this.docService.upload(slug, u.file, abs(u.relDir) || undefined).subscribe({
          next: (doc) => {
            if (this.selectedProject) {
              this.selectedProject.fileCount++;
              this.selectedProject.totalSize += doc.fileSize;
            }
            this.uploadProgress!.done++;
            res();
          },
          error: () => { this.uploadProgress!.done++; this.uploadProgress!.failed++; res(); },
        })).then(worker);
      };
      return Promise.all([worker(), worker(), worker()]);
    }).then(() => {
      const p = this.uploadProgress!;
      this.uploadProgress = null;
      this.loadFolders();
      this.loadAllFolders();
      this.loadDocuments();
      const ok = p.total - p.failed;
      const parts = [`${ok} ${ok === 1 ? 'file' : 'files'} uploaded`];
      if (dirs.length) parts.push(`${dirs.length} ${dirs.length === 1 ? 'folder' : 'folders'}`);
      if (p.failed) parts.push(`${p.failed} failed`);
      if (skipped) parts.push(`${skipped} empty skipped`);
      this.messageService.add({
        severity: p.failed ? (ok ? 'warn' : 'error') : 'success',
        summary: p.failed ? 'Upload finished with errors' : 'Upload complete',
        detail: parts.join(' · '),
      });
    });
  }

  uploadFile(file: File): void {
    if (!this.selectedProject) return;
    this.docService.upload(this.selectedProject.slug, file, this.currentSubfolder ?? undefined).subscribe({
      next: (doc) => {
        this.documents.unshift(doc);
        this.applyFilters();
        if (this.currentSubfolder) this.loadAllFolders(); // tree file counts
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

  // ── Bulk select (files and folders) ───────────────────────────────────────

  isDocSelected(id: number): boolean {
    return this.selectedDocIds.has(id);
  }

  toggleDocSelection(id: number): void {
    if (this.selectedDocIds.has(id)) this.selectedDocIds.delete(id);
    else this.selectedDocIds.add(id);
  }

  isFolderSelected(id: number): boolean {
    return this.selectedFolderIds.has(id);
  }

  toggleFolderSelection(id: number): void {
    if (this.selectedFolderIds.has(id)) this.selectedFolderIds.delete(id);
    else this.selectedFolderIds.add(id);
  }

  get selectionCount(): number {
    return this.selectedDocIds.size + this.selectedFolderIds.size;
  }

  /** "2 folders, 3 files" - for the selection bar and the dialogs. */
  describeItems(docs: number, folders: number): string {
    const parts: string[] = [];
    if (folders) parts.push(`${folders} ${folders === 1 ? 'folder' : 'folders'}`);
    if (docs) parts.push(`${docs} ${docs === 1 ? 'file' : 'files'}`);
    return parts.join(', ');
  }

  get allItemsSelected(): boolean {
    const folders = this.visibleFolders;
    const docs = this.filteredDocuments;
    return folders.length + docs.length > 0
      && folders.every(f => this.selectedFolderIds.has(f.id))
      && docs.every(d => this.selectedDocIds.has(d.id));
  }

  toggleSelectAll(): void {
    const select = !this.allItemsSelected;
    for (const f of this.visibleFolders) select ? this.selectedFolderIds.add(f.id) : this.selectedFolderIds.delete(f.id);
    for (const d of this.filteredDocuments) select ? this.selectedDocIds.add(d.id) : this.selectedDocIds.delete(d.id);
  }

  clearDocSelection(): void {
    this.selectedDocIds.clear();
    this.selectedFolderIds.clear();
  }

  private currentSelection(): { docIds: number[]; folders: ProjectFolder[] } {
    return {
      docIds: Array.from(this.selectedDocIds),
      folders: this.folders.filter(f => this.selectedFolderIds.has(f.id)),
    };
  }

  // ── Bulk delete ────────────────────────────────────────────────────────────

  confirmBulkDelete(): void {
    if (this.selectionCount === 0) return;
    this.bulkDeleteConfirmOpen = true;
  }

  cancelBulkDelete(): void {
    this.bulkDeleteConfirmOpen = false;
  }

  executeBulkDelete(): void {
    this.bulkDeleteConfirmOpen = false;
    const { docIds, folders } = this.currentSelection();
    this.deleteItems(docIds, folders);
  }

  /** Files first, then folders (each taking its whole contents with it), one at a time. */
  private async deleteItems(docIds: number[], folders: ProjectFolder[]): Promise<void> {
    if (!this.selectedProject) return;
    const slug = this.selectedProject.slug;
    let failed = 0;
    for (const id of docIds) {
      if (!(await this.settle(this.docService.delete(slug, id)))) failed++;
    }
    for (const f of folders) {
      if (!(await this.settle(this.docService.deleteFolder(slug, f.id)))) failed++;
    }
    this.clearDocSelection();
    this.refreshAfterChange();
    const total = docIds.length + folders.length;
    this.messageService.add(failed
      ? { severity: 'error', summary: 'Delete incomplete', detail: `${failed} of ${total} item(s) could not be deleted` }
      : { severity: 'success', summary: 'Deleted', detail: this.describeItems(docIds.length, folders.length) + ' deleted' });
  }

  // ── Move to folder ─────────────────────────────────────────────────────────

  /** Single file, from its row's Move button. */
  openMoveModal(ids: number[]): void {
    if (!this.selectedProject || ids.length === 0) return;
    this.movingDocIds = ids;
    this.movingFolders = [];
    this.moveModalOpen = true;
    this.loadAllFolders();
  }

  /** Everything checked, from the selection bar. */
  openMoveSelection(): void {
    if (!this.selectedProject || this.selectionCount === 0) return;
    const { docIds, folders } = this.currentSelection();
    this.movingDocIds = docIds;
    this.movingFolders = folders;
    this.moveModalOpen = true;
    this.loadAllFolders();
  }

  cancelMove(): void {
    this.moveModalOpen = false;
    this.movingDocIds = [];
    this.movingFolders = [];
  }

  executeMoveTo(subfolder: string): void {
    if (!this.isValidDestination(subfolder, this.movingFolders)) return;
    const docIds = this.movingDocIds;
    const folders = this.movingFolders;
    this.moveModalOpen = false;
    this.movingDocIds = [];
    this.movingFolders = [];
    this.moveItems(docIds, folders, subfolder);
  }

  /** Moves files and folders into `target` one at a time, then one summary message. */
  private async moveItems(docIds: number[], folders: ProjectFolder[], target: string): Promise<void> {
    if (!this.selectedProject) return;
    const slug = this.selectedProject.slug;
    let failed = 0;
    let reason = '';
    for (const id of docIds) {
      if (!(await this.settle(this.docService.move(slug, id, target)))) failed++;
    }
    for (const f of folders) {
      const err = await this.settleWithError(this.docService.moveFolder(slug, f.id, target));
      if (err !== null) { failed++; reason = reason || err; }
    }
    this.clearDocSelection();
    this.refreshAfterChange();
    const where = target ? `"${target}"` : 'the top level';
    const total = docIds.length + folders.length;
    this.messageService.add(failed
      ? { severity: 'error', summary: 'Move incomplete', detail: `${failed} of ${total} item(s) could not be moved${reason ? ': ' + reason : ''}` }
      : { severity: 'success', summary: 'Moved', detail: `${this.describeItems(docIds.length, folders.length)} moved to ${where}` });
  }

  private refreshAfterChange(): void {
    this.loadFolders();
    this.loadAllFolders();
    this.loadDocuments();
    this.refreshProjectStats();
  }

  /** Resolves true on success, false on error - never rejects. */
  private settle(obs: Observable<unknown>): Promise<boolean> {
    return this.settleWithError(obs).then(err => err === null);
  }

  /** Resolves null on success, or the server's message on error. */
  private settleWithError(obs: Observable<unknown>): Promise<string | null> {
    return new Promise(resolve => obs.subscribe({
      next: () => {},
      complete: () => resolve(null),
      error: (e) => resolve(typeof e?.error === 'string' ? e.error : 'request failed'),
    }));
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

  /**
   * Fetched with the admin's token rather than a plain link: only shared files
   * can be downloaded without logging in, and an <a href> never sends the token.
   */
  downloadFile(doc: ProjectDocument): void {
    if (!this.selectedProject) return;
    this.docService.previewBlob(this.selectedProject.slug, doc.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Download failed', detail: doc.originalName }),
    });
  }

  // ── Sharing (the portal's public "Shared" page) ───────────────────────────

  toggleShared(doc: ProjectDocument): void {
    if (!this.selectedProject) return;
    const value = !doc.shared;
    this.docService.setShared(this.selectedProject.slug, doc.id, value).subscribe({
      next: () => {
        doc.shared = value;
        this.messageService.add({
          severity: 'success', summary: value ? 'Shared' : 'No longer shared',
          detail: value ? `${doc.originalName} is now on the project's Shared page` : doc.originalName,
        });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not change sharing' }),
    });
  }

  /** Shares or unshares every checked file (folders are not shareable themselves). */
  async setSelectionShared(value: boolean): Promise<void> {
    if (!this.selectedProject) return;
    const slug = this.selectedProject.slug;
    const docs = this.documents.filter(d => this.selectedDocIds.has(d.id) && !!d.shared !== value);
    let failed = 0;
    for (const d of docs) {
      if (await this.settle(this.docService.setShared(slug, d.id, value))) d.shared = value;
      else failed++;
    }
    this.messageService.add(failed
      ? { severity: 'error', summary: 'Error', detail: `${failed} file(s) could not be changed` }
      : { severity: 'success', summary: value ? 'Shared' : 'Unshared',
          detail: `${docs.length} ${docs.length === 1 ? 'file' : 'files'} ${value ? 'shared' : 'unshared'}` });
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
