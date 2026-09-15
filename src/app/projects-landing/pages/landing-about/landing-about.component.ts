import { Component, AfterViewInit, DestroyRef, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PortalProjectsService } from '../../../portal/services/portal-projects.service';
import { ProjectService } from '../../../services/ProjectService';

@Component({
  selector: 'app-landing-about',
  templateUrl: './landing-about.component.html',
})
export class LandingAboutComponent implements OnInit, AfterViewInit, OnDestroy {
  // Backing values for the hero stats strip, which moved here from the
  // Overview page along with the rest of the hero.
  totalResearchProjects: number | null = null;
  totalPortalProjects: number | null = null;
  activePortalProjects: number | null = null;

  private io?: IntersectionObserver;

  constructor(
    private portalProjectsService: PortalProjectsService,
    private projectService: ProjectService,
    private destroyRef: DestroyRef,
    private el: ElementRef,
  ) {}

  ngOnInit(): void {
    this.portalProjectsService.list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(projects => {
        this.totalPortalProjects = projects.length;
        this.activePortalProjects = projects.filter(p => p.isActive).length;
      });

    this.projectService.getAllProjects().subscribe({
      next: p => { this.totalResearchProjects = p.length; },
      error: () => {}
    });
  }

  ngAfterViewInit(): void {
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

  ngOnDestroy(): void { this.io?.disconnect(); }
}
