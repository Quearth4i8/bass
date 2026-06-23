import { Component, AfterViewInit, ElementRef, OnDestroy, DestroyRef, OnInit } from '@angular/core';
import { PortalProjectsService } from '../../../portal/services/portal-projects.service';
import { filter, switchMap, take } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

interface FeaturedOutput { videoUrl: string; title: string; projectSlug: string; }

@Component({
  selector: 'app-landing-outputs',
  templateUrl: './landing-outputs.component.html',
})
export class LandingOutputsComponent implements OnInit, AfterViewInit, OnDestroy {
  featuredOutputs: FeaturedOutput[] = [];
  private io?: IntersectionObserver;
  private videoIo?: IntersectionObserver;

  constructor(
    private portalProjectsService: PortalProjectsService,
    private el: ElementRef,
  ) {}

  ngOnInit(): void {
    this.portalProjectsService.list().pipe(
      filter(projects => projects.length > 0),
      take(1),
      switchMap(projects => {
        const actives = projects.filter(p => p.isActive);
        if (!actives.length) return of([]);
        return forkJoin(actives.map(p => this.portalProjectsService.getBySlug(p.slug)));
      })
    ).subscribe(fullProjects => {
      const outputs: FeaturedOutput[] = [];
      fullProjects.forEach(full => {
        if (!full) return;
        (full.content?.outputs?.outputs ?? [])
          .filter((o: any) => o.featured && o.videoUrl?.trim())
          .forEach((o: any) => outputs.push({ videoUrl: o.videoUrl, title: o.title, projectSlug: full.slug }));
      });
      this.featuredOutputs = outputs;
      setTimeout(() => this.setupVideoObserver(), 200);
    });
  }

  ngAfterViewInit(): void { this.observeFade(); }

  ngOnDestroy(): void {
    this.io?.disconnect();
    this.videoIo?.disconnect();
  }

  private observeFade(): void {
    this.io = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('in');
            this.io?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    this.el.nativeElement.querySelectorAll('.fade-up:not(.in)')
      .forEach((e: Element) => this.io!.observe(e));
  }

  private setupVideoObserver(): void {
    this.videoIo?.disconnect();
    this.videoIo = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) { if (v.paused) v.play().catch(() => {}); }
          else if (!v.paused) { v.pause(); }
        });
      },
      { threshold: 0.25 }
    );
    this.el.nativeElement.querySelectorAll('video.landing-output-video')
      .forEach((v: HTMLVideoElement) => this.videoIo!.observe(v));
  }
}
