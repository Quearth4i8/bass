import { Component, DestroyRef, HostListener, AfterViewInit, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { TrixService, TrixRegionData, TrixResult, TrixSeason, calcTrix, classify } from '../../../services/trix.service';
import { TrixPredictionService, TrixPredRegion, TrixPredResult } from '../../../services/trix-prediction.service';
import { PortalProjectsService } from '../../../portal/services/portal-projects.service';
import { ProjectService } from '../../../services/ProjectService';
import { ProjectGroupService } from '../../../services/ProjectGroupService';
import { ThemeService } from '../../../services/ThemeService';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

function detectCurrentSeason(): TrixSeason {
  const m = new Date().getMonth() + 1;
  if (m <= 2 || m === 12) return 'winter';
  if (m <= 5)             return 'spring';
  if (m <= 8)             return 'summer';
  return 'autumn';
}

const TRIX_MOCK: TrixRegionData[] = [
  { id: 'bizerte', label: 'Lagoon of Bizerte', seasons: {
    winter: { trix: 4.2, eutrophication: 'Medium',    waterQuality: 'Good', din: 18.4, dip: 1.2, chla: 3.8,  do2: 10 },
    spring: { trix: 3.6, eutrophication: 'Low',       waterQuality: 'High', din: 12.1, dip: 0.8, chla: 2.9,  do2:  5 },
    summer: { trix: 5.3, eutrophication: 'High',      waterQuality: 'Poor', din: 24.7, dip: 2.1, chla: 8.4,  do2: 35 },
    autumn: { trix: 4.8, eutrophication: 'Medium',    waterQuality: 'Good', din: 20.3, dip: 1.6, chla: 5.2,  do2: 15 },
  }},
  { id: 'tunis', label: 'Gulf of Tunis', seasons: {
    winter: { trix: 5.1, eutrophication: 'High',      waterQuality: 'Poor', din: 31.2, dip: 2.4, chla: 7.1,  do2: 17 },
    spring: { trix: 4.4, eutrophication: 'Medium',    waterQuality: 'Good', din: 22.6, dip: 1.8, chla: 4.3,  do2: 20 },
    summer: { trix: 6.2, eutrophication: 'Very High', waterQuality: 'Bad',  din: 48.9, dip: 3.7, chla: 14.6, do2: 40 },
    autumn: { trix: 5.7, eutrophication: 'High',      waterQuality: 'Poor', din: 38.4, dip: 2.9, chla: 10.2, do2: 30 },
  }},
  { id: 'gabes', label: 'Gulf of Gabès', seasons: {
    winter: { trix: 3.4, eutrophication: 'Low',       waterQuality: 'High', din:  9.8, dip: 0.6, chla: 2.1,  do2:  5 },
    spring: { trix: 3.8, eutrophication: 'Low',       waterQuality: 'High', din: 11.4, dip: 0.7, chla: 2.7,  do2: 10 },
    summer: { trix: 4.6, eutrophication: 'Medium',    waterQuality: 'Good', din: 16.2, dip: 1.1, chla: 4.8,  do2: 25 },
    autumn: { trix: 4.1, eutrophication: 'Medium',    waterQuality: 'Good', din: 13.9, dip: 0.9, chla: 3.5,  do2: 15 },
  }},
];

@Component({
  selector: 'app-landing-overview',
  templateUrl: './landing-overview.component.html',
})
export class LandingOverviewComponent implements OnInit, AfterViewInit, OnDestroy {

  trixData: TrixRegionData[] = [];
  trixLoading = true;
  selectedSeason: TrixSeason = detectCurrentSeason();
  showSeasonDd = false;
  useMockData = false;
  readonly TRIX_SEASONS: TrixSeason[] = ['winter', 'spring', 'summer', 'autumn'];

  predData: TrixPredRegion[] = [];
  predLoading = true;
  predError = false;
  selectedPredSeason: TrixSeason = detectCurrentSeason();
  showPredSeasonDd = false;
  showFormulaBreakdown = false;

  totalResearchProjects: number | null = null;
  totalPortalProjects: number | null = null;
  activePortalProjects: number | null = null;

  private io?: IntersectionObserver;

  get displayTrixData(): TrixRegionData[] {
    return this.useMockData ? TRIX_MOCK : this.trixData;
  }

  toggleMockData(): void { this.useMockData = !this.useMockData; }

  constructor(
    private trixService: TrixService,
    private trixPredService: TrixPredictionService,
    private portalProjectsService: PortalProjectsService,
    private projectService: ProjectService,
    private projectGroupService: ProjectGroupService,
    private destroyRef: DestroyRef,
    private el: ElementRef,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.trixService.getTrixData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => { this.trixData = data; this.trixLoading = false; },
        error: ()   => { this.trixLoading = false; }
      });

    this.trixPredService.getPredictions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => { this.predData = data; this.predLoading = false; },
        error: ()   => { this.predLoading = false; this.predError = true; }
      });

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

  ngAfterViewInit(): void { this.observeFade(); }

  ngOnDestroy(): void { this.io?.disconnect(); }

  getSeasonResult(region: TrixRegionData): TrixResult {
    return region.seasons[this.selectedSeason];
  }

  getTrixColor(trix: number | null): string {
    const light = this.themeService.isLight;
    if (trix === null) return light ? '#9bb0bc' : '#5d7785';
    if (trix <= 4)  return light ? '#1a8f7f' : '#4ad6c4';
    if (trix <= 5)  return light ? '#b36c00' : '#f5b94a';
    if (trix <= 6)  return light ? '#c2580a' : '#f97316';
    return                light ? '#dc2626' : '#ef4444';
  }

  seasonLabel(s: TrixSeason): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  toggleSeasonDd(): void { this.showSeasonDd = !this.showSeasonDd; }

  selectSeason(s: TrixSeason): void {
    this.selectedSeason = s;
    this.showSeasonDd = false;
  }

  getPredResult(region: TrixPredRegion): TrixPredResult {
    return region.seasons[this.selectedPredSeason];
  }

  togglePredSeasonDd(): void { this.showPredSeasonDd = !this.showPredSeasonDd; }

  selectPredSeason(s: TrixSeason): void {
    this.selectedPredSeason = s;
    this.showPredSeasonDd = false;
  }

  getNeedlePoints(trix: number | null): string {
    const t = trix ?? 0;
    const angle = (135 + (t / 10) * 270) * Math.PI / 180;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const tipX = 100 + 65 * c,  tipY = 100 + 65 * s;
    const bx   = 100 -  9 * c,  by   = 100 -  9 * s;
    return [
      `${tipX.toFixed(2)},${tipY.toFixed(2)}`,
      `${(bx - 6 * s).toFixed(2)},${(by + 6 * c).toFixed(2)}`,
      `${(bx + 6 * s).toFixed(2)},${(by - 6 * c).toFixed(2)}`,
    ].join(' ');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.trix-season-wrap'))      this.showSeasonDd     = false;
    if (!target.closest('.trix-pred-season-wrap')) this.showPredSeasonDd = false;
  }

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
