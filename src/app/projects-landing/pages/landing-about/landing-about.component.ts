import { Component, AfterViewInit, DestroyRef, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ProjectService } from '../../../services/ProjectService';
import { isRejectedStatus } from '../../../utilities/project-labels';

@Component({
  selector: 'app-landing-about',
  templateUrl: './landing-about.component.html',
})
export class LandingAboutComponent implements OnInit, AfterViewInit, OnDestroy {
  // Backing values for the hero stats strip, which moved here from the
  // Overview page along with the rest of the hero.
  totalResearchProjects: number | null = null;
  ongoingResearchProjects: number | null = null;
  achievedResearchProjects: number | null = null;

  // Budget panel, over the List of Projects' projects minus Rejected.
  totalProjectsBudget: number | null = null;
  totalPartnersBudget: number | null = null;

  private io?: IntersectionObserver;

  constructor(
    private projectService: ProjectService,
    private destroyRef: DestroyRef,
    private el: ElementRef,
  ) {}

  ngOnInit(): void {
    this.projectService.getAllProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: p => {
          // Same set as the List of Projects' Total tab: every project with a status.
          const listed = p.filter(x => (x.title || '').trim());
          this.totalResearchProjects = listed.length;
          this.ongoingResearchProjects = listed.filter(x => /ONGOING/i.test(x.title)).length;
          this.achievedResearchProjects = listed.filter(x => /ACHIEVED/i.test(x.title)).length;
          // Rejected projects never ran, so they add nothing to the budgets.
          this.computeBudgets(listed.filter(x => !isRejectedStatus(x.title)));
        },
        error: () => {}
      });
  }

  private computeBudgets(visible: any[]): void {
    this.totalProjectsBudget = visible.reduce((sum, p) => sum + (Number(p.totalBudget) || 0), 0);
    this.totalPartnersBudget = visible.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
  }

  /** 0 -> "€0", 850 000 -> "€850K", 1 250 000 -> "€1.25M". */
  compactEuro(value: number): string {
    if (!value) return '€0';
    if (value >= 1_000_000) return '€' + (value / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
    if (value >= 1_000) return '€' + Math.round(value / 1_000) + 'K';
    return '€' + Math.round(value);
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
