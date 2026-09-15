import { Component, DestroyRef, HostListener, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PortalProjectContextService } from '../../../portal/services/portal-project-context.service';
import { PortalProject } from '../../../portal/models/portal-project.model';

@Component({
  selector: 'app-portal-page-gallery',
  templateUrl: './portal-page-gallery.component.html',
  styleUrls: ['./portal-page-gallery.component.scss'],
})
export class PortalPageGalleryComponent implements OnInit {
  project: PortalProject | null = null;
  loading = true;
  lightboxOpen = false;
  lightboxIndex = 0;

  /* .portal-scroll is position:fixed and therefore a stacking context, so the
     overlay cannot outrank the fixed navbar on its own. Flag the body and let
     the global rule in styles.css demote the navbar (and lock the scroller)
     for as long as the lightbox is open. */
  private static readonly BODY_OPEN_CLASS = 'gallery-lightbox-open';

  imagesPerPage = 30;
  currentPage = 1;
  Math = Math;

  constructor(
    private readonly context: PortalProjectContextService,
    private readonly destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.context.project$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((project) => {
        this.project = project;
        this.loading = false;
        this.currentPage = 1;
        const len = project?.content.gallery.images.length ?? 0;
        if (len > 0 && this.lightboxIndex >= len) {
          this.lightboxIndex = 0;
        }
      });

    // A route change closes the component without closing the lightbox, which
    // would leave the navbar hidden on the next page.
    this.destroyRef.onDestroy(() => this.setBodyLightboxState(false));
  }

  private setBodyLightboxState(open: boolean): void {
    document.body.classList.toggle(PortalPageGalleryComponent.BODY_OPEN_CLASS, open);
  }

  get paginatedImages() {
    if (!this.project?.content.gallery.images) return [];
    const start = (this.currentPage - 1) * this.imagesPerPage;
    const end = start + this.imagesPerPage;
    return this.project.content.gallery.images.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil((this.project?.content.gallery.images?.length ?? 0) / this.imagesPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  openLightbox(index: number): void {
    this.lightboxIndex = index;
    this.lightboxOpen = true;
    this.setBodyLightboxState(true);
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    this.setBodyLightboxState(false);
  }

  prevImage(): void {
    const len = this.project?.content.gallery.images.length || 1;
    this.lightboxIndex = (this.lightboxIndex - 1 + len) % len;
  }

  nextImage(): void {
    const len = this.project?.content.gallery.images.length || 1;
    this.lightboxIndex = (this.lightboxIndex + 1) % len;
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.lightboxOpen) return;
    if (e.key === 'Escape') this.closeLightbox();
    if (e.key === 'ArrowLeft') this.prevImage();
    if (e.key === 'ArrowRight') this.nextImage();
  }
}
