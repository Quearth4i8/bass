import { Component, DestroyRef, HostBinding, HostListener, OnInit, AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/AuthService';
import { TrixService, TrixRegionData, TrixResult, TrixSeason, calcTrix, classify } from '../services/trix.service';
import { TrixPredictionService, TrixPredRegion, TrixPredResult } from '../services/trix-prediction.service';
import { PortalProjectsService } from '../portal/services/portal-projects.service';
import { PortalProjectMeta } from '../portal/models/portal-project.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from '../services/ProjectService';
import { ProjectGroupService } from '../services/ProjectGroupService';
import { ThemeService } from '../services/ThemeService';

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

interface FeaturedOutput {
  videoUrl: string;
  title: string;
  projectSlug: string;
}

@Component({
  selector: 'app-projects-landing',
  templateUrl: './projects-landing.component.html',
  styleUrls: ['./projects-landing.component.scss']
})
export class ProjectsLandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class.theme-light') get isLight() { return this.themeService.isLight; }
  username: string = '';
  password: string = '';
  error: string = '';
  showAdminLogin: boolean = false;
  showPassword: boolean = false;
  isAdminLoggedIn: boolean = false;

  projects: PortalProjectMeta[] = [];
  featuredOutputs: FeaturedOutput[] = [];

  // TRIX — measured
  trixData: TrixRegionData[] = [];
  trixLoading = true;
  selectedSeason: TrixSeason = detectCurrentSeason();
  showSeasonDd = false;
  useMockData = false;
  readonly TRIX_SEASONS: TrixSeason[] = ['winter', 'spring', 'summer', 'autumn'];

  // TRIX — predictions
  predData: TrixPredRegion[] = [];
  predLoading = true;
  predError = false;
  selectedPredSeason: TrixSeason = detectCurrentSeason();
  showPredSeasonDd = false;

  get displayTrixData(): TrixRegionData[] {
    return this.useMockData ? TRIX_MOCK : this.trixData;
  }

  toggleMockData(): void { this.useMockData = !this.useMockData; }

  // TRIX — manual test calculator
  showTrixTest = false;
  testDin = 20;
  testDip = 2;
  testChla = 5;
  testDo2 = 15;

  toggleTrixTest(): void { this.showTrixTest = !this.showTrixTest; }

  get testTrixResult(): TrixResult {
    const trix = calcTrix(this.testDin, this.testDip, this.testDo2, this.testChla);
    return { trix, ...classify(trix), din: this.testDin, dip: this.testDip, chla: this.testChla, do2: this.testDo2 };
  }

  // Stats loaded from backend
  totalResearchProjects: number | null = null;
  totalProjectGroups: number | null = null;
  totalPortalProjects: number | null = null;
  activePortalProjects: number | null = null;

  get leftOutputs(): FeaturedOutput[] { return this.featuredOutputs.filter((_, i) => i % 2 === 0); }
  get rightOutputs(): FeaturedOutput[] { return this.featuredOutputs.filter((_, i) => i % 2 === 1); }

  private io?: IntersectionObserver;
  private navIo?: IntersectionObserver;
  private outputVideoIo?: IntersectionObserver;
  private clockInterval?: ReturnType<typeof setInterval>;
  currentTime: string = '';
  activeSection: string = 'home';

  constructor(
    private router: Router,
    private authService: AuthService,
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
    this.checkAdminSession();
    this.startClock();

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

    this.portalProjectsService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projects) => {
        this.projects = [...projects].sort((a, b) => {
          const aO = a.order ?? Number.MAX_SAFE_INTEGER;
          const bO = b.order ?? Number.MAX_SAFE_INTEGER;
          if (aO !== bO) return aO - bO;
          return Number(b.isActive) - Number(a.isActive);
        });
        this.totalPortalProjects = projects.length;
        this.activePortalProjects = projects.filter(p => p.isActive).length;
        setTimeout(() => this.observeFadeElements(), 80);
      });

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
          .filter(o => o.featured && o.videoUrl?.trim())
          .forEach(o => outputs.push({ videoUrl: o.videoUrl, title: o.title, projectSlug: full.slug }));
      });
      this.featuredOutputs = outputs;
      setTimeout(() => this.setupOutputVideoObserver(), 200);
    });

    this.projectService.getAllProjects().subscribe({
      next: (p) => { this.totalResearchProjects = p.length; },
      error: () => {}
    });

    this.projectGroupService.getProjectGroups().subscribe({
      next: (g) => { this.totalProjectGroups = g.length; },
      error: () => {}
    });
  }

  ngAfterViewInit(): void {
    this.observeFadeElements();
    this.observeSections();
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
    this.navIo?.disconnect();
    this.outputVideoIo?.disconnect();
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  // ── TRIX helpers ──────────────────────────────────────────────────────────

  getSeasonResult(region: TrixRegionData): TrixResult {
    return region.seasons[this.selectedSeason];
  }

  getTrixArc(trix: number | null): string {
    const filled = 329.87 * ((trix ?? 0) / 10);
    return `${filled} ${439.82 - filled}`;
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

  // ── Prediction helpers ────────────────────────────────────────────────────

  getPredResult(region: TrixPredRegion): TrixPredResult {
    return region.seasons[this.selectedPredSeason];
  }

  togglePredSeasonDd(): void { this.showPredSeasonDd = !this.showPredSeasonDd; }

  selectPredSeason(s: TrixSeason): void {
    this.selectedPredSeason = s;
    this.showPredSeasonDd = false;
  }

  getPredNoDataReason(r: TrixPredResult): string {
    if (r.chla === null && r.din === null && r.dip === null) return 'unavailable Data';
    if (r.chla === null) return 'Chl-a data unavailable';
    if (r.din  === null) return 'DIN (NH₄/NO₃) unavailable';
    if (r.dip  === null) return 'DIP (PO₄) unavailable';
    return 'Insufficient data';
  }

  // Needle polygon points for SVG gauge — arc starts at SVG 135° (rotate 135 applied to circles)
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

  // ── Private helpers ───────────────────────────────────────────────────────

  private observeSections(): void {
    const ids = ['home', 'about', 'geodatabase', 'projects', 'team', 'outputs'];
    this.navIo = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) this.activeSection = e.target.id; });
      },
      { rootMargin: '-40% 0px -50% 0px' }
    );
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) this.navIo!.observe(el);
    });
  }

  private startClock(): void {
    const tick = () => {
      this.currentTime = new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Africa/Tunis', hour: '2-digit', minute: '2-digit', second: '2-digit'
      }) + ' TUN';
    };
    tick();
    this.clockInterval = setInterval(tick, 1000);
  }

  private observeFadeElements(): void {
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
    const elements: NodeListOf<Element> = this.el.nativeElement.querySelectorAll('.fade-up:not(.in)');
    elements.forEach(el => this.io!.observe(el));
  }

  private checkAdminSession(): void {
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      this.isAdminLoggedIn = true;
      this.showAdminLogin = false;
    }
  }

  toggleAdminLogin(): void {
    this.showAdminLogin = !this.showAdminLogin;
    this.error = '';
  }

  login(event: Event): void {
    event.preventDefault();
    this.error = '';
    this.authService.login(this.username, this.password).subscribe({
      next: (ok) => {
        if (!ok) { this.error = 'Invalid username or password'; return; }
        if (this.authService.isAdmin()) {
          this.isAdminLoggedIn = true;
          this.showAdminLogin = false;
          this.username = '';
          this.password = '';
          this.router.navigate(['/projectadmin'], { replaceUrl: true });
        } else {
          this.error = 'Admin access required';
          this.authService.logout();
        }
      },
      error: () => { this.error = 'Invalid username or password'; }
    });
  }

  continueToAdmin(): void { this.router.navigate(['/projectadmin']); }

  adminLogout(): void {
    this.authService.logout();
    this.isAdminLoggedIn = false;
    this.showAdminLogin = false;
  }

  togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.admin-area'))            this.showAdminLogin  = false;
    if (!target.closest('.trix-season-wrap'))      this.showSeasonDd    = false;
    if (!target.closest('.trix-pred-season-wrap')) this.showPredSeasonDd = false;
    if (!target.closest('.trix-test-wrap'))        this.showTrixTest    = false;
  }

  private setupOutputVideoObserver(): void {
    this.outputVideoIo?.disconnect();
    this.outputVideoIo = new IntersectionObserver(
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
      .forEach((v: HTMLVideoElement) => this.outputVideoIo!.observe(v));
  }

  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 64 - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  navigateToProject(projectSlug: string): void {
    this.router.navigate(['/portal', projectSlug]);
  }
}
