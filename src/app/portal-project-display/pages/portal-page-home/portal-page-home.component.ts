import {
  Component,
  DestroyRef,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PortalProjectContextService } from '../../../portal/services/portal-project-context.service';
import { PortalProject } from '../../../portal/models/portal-project.model';

@Component({
  selector: 'app-portal-page-home',
  templateUrl: './portal-page-home.component.html',
  styleUrls: ['./portal-page-home.component.scss'],
})
export class PortalPageHomeComponent implements OnInit, OnDestroy, AfterViewInit {
  project: PortalProject | null = null;
  loading = true;
  activeSlide = 0;
  private carouselInterval: ReturnType<typeof setInterval> | null = null;
  private intersectionObserver: IntersectionObserver | null = null;

  @ViewChildren('contentWrapper') contentWrappers!: QueryList<ElementRef>;

  constructor(
    private readonly context: PortalProjectContextService,
    private readonly destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.context.project$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((project) => {
        this.stopCarousel();
        this.project = project;
        this.loading = false;
        const slides = project?.content.home.carousel?.length ?? 0;
        if (this.activeSlide >= slides) {
          this.activeSlide = 0;
        }
        if (slides > 1) {
          this.startCarousel();
        }
        setTimeout(() => this.initObservers(), 100);
      });
  }

  ngAfterViewInit(): void {
    if (!this.loading) {
      this.initObservers();
    }
  }

  private initObservers(): void {
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    if (!this.contentWrappers?.length) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const wrapper = entry.target as HTMLElement;
            wrapper.querySelectorAll('.fade-in-left').forEach((el) => el.classList.add('active'));
            wrapper.querySelectorAll('.fade-in-right').forEach((el) => el.classList.add('active'));
            this.intersectionObserver?.unobserve(wrapper);
          }
        });
      },
      { threshold: 0.5 },
    );

    this.contentWrappers.forEach((wrapper) =>
      this.intersectionObserver?.observe(wrapper.nativeElement),
    );
  }

  ngOnDestroy(): void {
    this.stopCarousel();
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
  }

  private startCarousel(): void {
    this.stopCarousel();
    this.carouselInterval = setInterval(() => this.nextSlide(), 5000);
  }

  private stopCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
  }

  nextSlide(): void {
    const count = this.project?.content.home.carousel?.length || 1;
    this.activeSlide = (this.activeSlide + 1) % count;
    this.startCarousel();
  }

  prevSlide(): void {
    const count = this.project?.content.home.carousel?.length || 1;
    this.activeSlide = (this.activeSlide - 1 + count) % count;
    this.startCarousel();
  }

  setSlide(i: number): void {
    this.activeSlide = i;
    this.startCarousel();
  }
}
