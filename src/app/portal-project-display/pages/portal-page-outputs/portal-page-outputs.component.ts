import { Component, DestroyRef, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PortalProjectContextService } from '../../../portal/services/portal-project-context.service';
import { PortalProject } from '../../../portal/models/portal-project.model';

@Component({
  selector: 'app-portal-page-outputs',
  templateUrl: './portal-page-outputs.component.html',
  styleUrls: ['./portal-page-outputs.component.scss'],
})
export class PortalPageOutputsComponent implements OnInit, OnDestroy {
  project: PortalProject | null = null;
  loading = true;
  private videoObserver: IntersectionObserver | null = null;

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
        queueMicrotask(() => this.setupVideoObserver());
      });
  }

  ngOnDestroy(): void {
    this.videoObserver?.disconnect();
    this.videoObserver = null;
  }

  private setupVideoObserver(): void {
    this.videoObserver?.disconnect();
    this.videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) {
            if (v.paused) v.play().catch(() => {});
          } else if (!v.paused) {
            v.pause();
          }
        });
      },
      { threshold: 0.25 },
    );
    document.querySelectorAll('video.portal-observe-video').forEach((v) => this.videoObserver?.observe(v));
  }
}
