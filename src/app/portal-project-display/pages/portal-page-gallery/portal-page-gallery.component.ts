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
        const len = project?.content.gallery.images.length ?? 0;
        if (len > 0 && this.lightboxIndex >= len) {
          this.lightboxIndex = 0;
        }
      });
  }

  openLightbox(index: number): void {
    this.lightboxIndex = index;
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
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
