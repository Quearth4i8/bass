import { Component, AfterViewInit, DestroyRef, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ProjectService } from '../../../services/ProjectService';

interface PieSlice { key: string; label: string; count: number; percent: number; d: string; }

@Component({
  selector: 'app-landing-about',
  templateUrl: './landing-about.component.html',
})
export class LandingAboutComponent implements OnInit, AfterViewInit, OnDestroy {
  // Backing values for the hero stats strip, which moved here from the
  // Overview page along with the rest of the hero.
  totalResearchProjects: number | null = null;
  submittedResearchProjects: number | null = null;
  ongoingResearchProjects: number | null = null;
  achievedResearchProjects: number | null = null;

  // Pie at the end of the stats strip: one slice per status, rejected included
  // so the slices add up to the Total figure.
  pieSlices: PieSlice[] = [];
  // Status under the pointer, on a stat or a slice; lights up both.
  activeKey: string | null = null;

  // Budget panel, over Ongoing projects only.
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
          const ongoing = listed.filter(x => /ONGOING/i.test(x.title));
          this.submittedResearchProjects = listed.filter(x => /SUBMITTED/i.test(x.title)).length;
          this.ongoingResearchProjects = ongoing.length;
          this.achievedResearchProjects = listed.filter(x => /ACHIEVED/i.test(x.title)).length;
          this.pieSlices = this.buildPie([
            { key: 'submitted', label: 'Submitted', count: this.submittedResearchProjects },
            { key: 'ongoing',   label: 'Ongoing',   count: this.ongoingResearchProjects },
            { key: 'achieved',  label: 'Achieved',  count: this.achievedResearchProjects },
            { key: 'other',     label: 'Rejected',
              count: listed.length - this.submittedResearchProjects - this.ongoingResearchProjects - this.achievedResearchProjects },
          ]);
          this.computeBudgets(ongoing);
        },
        error: () => {}
      });
  }

  /** Share of the total for one status, 0 while loading. */
  share(key: string): number {
    return this.pieSlices.find(s => s.key === key)?.percent ?? 0;
  }

  /** SVG paths for a pie of radius 46 centred in a 100×100 viewBox, starting at 12 o'clock. */
  private buildPie(parts: { key: string; label: string; count: number }[]): PieSlice[] {
    const shown = parts.filter(p => p.count > 0);
    const total = shown.reduce((s, p) => s + p.count, 0);
    if (!total) return [];
    const r = 46;
    const point = (turn: number) => {
      const a = turn * 2 * Math.PI - Math.PI / 2;
      return `${(50 + r * Math.cos(a)).toFixed(3)} ${(50 + r * Math.sin(a)).toFixed(3)}`;
    };
    let start = 0;
    return shown.map(p => {
      const frac = p.count / total;
      const end = start + frac;
      // A single full slice can't be drawn as one arc, so it becomes two half arcs.
      const d = frac >= 1
        ? `M 50 4 A ${r} ${r} 0 1 1 50 96 A ${r} ${r} 0 1 1 50 4 Z`
        : `M 50 50 L ${point(start)} A ${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${point(end)} Z`;
      start = end;
      return { key: p.key, label: p.label, count: p.count, percent: Math.round(frac * 100), d };
    });
  }

  private computeBudgets(projects: any[]): void {
    this.totalProjectsBudget = projects.reduce((sum, p) => sum + (Number(p.totalBudget) || 0), 0);
    this.totalPartnersBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
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
