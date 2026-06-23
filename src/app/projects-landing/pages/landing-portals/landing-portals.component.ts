import { Component, AfterViewInit, ElementRef, OnDestroy, DestroyRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PortalProjectsService } from '../../../portal/services/portal-projects.service';
import { PortalProjectMeta } from '../../../portal/models/portal-project.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-landing-portals',
  templateUrl: './landing-portals.component.html',
})
export class LandingPortalsComponent implements OnInit, AfterViewInit, OnDestroy {
  projects: PortalProjectMeta[] = [];
  totalPortalProjects: number | null = null;
  private io?: IntersectionObserver;

  constructor(
    private router: Router,
    private portalProjectsService: PortalProjectsService,
    private destroyRef: DestroyRef,
    private el: ElementRef,
  ) {}

  ngOnInit(): void {
    this.portalProjectsService.list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(projects => {
        this.projects = [...projects].sort((a, b) => {
          const aO = a.order ?? Number.MAX_SAFE_INTEGER;
          const bO = b.order ?? Number.MAX_SAFE_INTEGER;
          if (aO !== bO) return aO - bO;
          return Number(b.isActive) - Number(a.isActive);
        });
        this.totalPortalProjects = projects.length;
        setTimeout(() => this.observeFade(), 80);
      });
  }

  ngAfterViewInit(): void { this.observeFade(); }
  ngOnDestroy(): void { this.io?.disconnect(); }

  navigateToProject(slug: string): void { this.router.navigate(['/portal', slug]); }

  private observeFade(): void {
    this.io?.disconnect();
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
}
