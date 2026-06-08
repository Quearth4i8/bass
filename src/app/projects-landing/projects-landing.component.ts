import { Component, DestroyRef, HostBinding, HostListener, OnInit, AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/AuthService';
import { EcoStatusService } from '../services/eco-status.service';
import { PortalProjectsService } from '../portal/services/portal-projects.service';
import { PortalProjectMeta } from '../portal/models/portal-project.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from '../services/ProjectService';
import { ProjectGroupService } from '../services/ProjectGroupService';
import { ThemeService } from '../services/ThemeService';

interface FeaturedOutput {
  videoUrl: string;
  title: string;
  projectSlug: string;
}

interface EcoParam {
  key: string;
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  lowThreshold: number;
  critThreshold: number;
  higherIsBetter?: boolean;
  category: string;
  desc: string;
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

  ecoParams: EcoParam[] = [
    {
      key: 'nh4', label: 'NH₄⁺ — Ammonium', unit: 'µmol/L', value: 3.2,
      min: 0, max: 20, lowThreshold: 2, critThreshold: 10,
      category: 'WATER · CHEMICAL',
      desc: 'High ammonium indicates organic decomposition and anthropogenic inputs. Promotes algal blooms above 2 µmol/L.'
    },
    {
      key: 'no3', label: 'NO₃⁻ — Nitrate', unit: 'µmol/L', value: 18.4,
      min: 0, max: 120, lowThreshold: 25, critThreshold: 60,
      category: 'WATER · CHEMICAL',
      desc: 'Primary dissolved inorganic nitrogen form. Elevated levels indicate eutrophication pressure from agricultural runoff.'
    },
    {
      key: 'no2', label: 'NO₂⁻ — Nitrite', unit: 'µmol/L', value: 0.6,
      min: 0, max: 8, lowThreshold: 1, critThreshold: 4,
      category: 'WATER · CHEMICAL',
      desc: 'Nitrite is toxic to aquatic fauna at elevated concentrations. Transient intermediate in the nitrogen cycling pathway.'
    },
    {
      key: 'po4', label: 'PO₄³⁻ — Phosphate', unit: 'µmol/L', value: 0.8,
      min: 0, max: 8, lowThreshold: 1, critThreshold: 3,
      category: 'WATER · CHEMICAL',
      desc: 'Limiting nutrient in most marine systems. Co-elevation with nitrogen drives hypoxic bloom events in coastal lagoons.'
    },
    {
      key: 'si', label: 'Si — Silicate', unit: 'µmol/L', value: 12.1,
      min: 0, max: 80, lowThreshold: 15, critThreshold: 40,
      category: 'WATER · CHEMICAL',
      desc: 'Essential for diatom growth. Imbalance relative to N and P shifts phytoplankton community structure toward harmful species.'
    },
    {
      key: 'toc', label: 'TOC — Total Organic Carbon', unit: 'mg/L', value: 2.1,
      min: 0, max: 15, lowThreshold: 3, critThreshold: 8,
      category: 'WATER · CHEMICAL',
      desc: 'Indicator of organic pollution load. High TOC drives microbial oxygen consumption and promotes hypoxic bottom waters.'
    },
    {
      key: 'chl', label: 'Chl-a — Chlorophyll a', unit: 'µg/L', value: 4.2,
      min: 0, max: 60, lowThreshold: 10, critThreshold: 30,
      category: 'BIOTA · CHEMICAL',
      desc: 'Proxy for phytoplankton biomass. Elevated concentrations signal bloom events and eutrophication stress on the ecosystem.'
    },
    {
      key: 'turb', label: 'Turb — Turbidity', unit: 'NTU', value: 3.8,
      min: 0, max: 30, lowThreshold: 5, critThreshold: 15,
      category: 'WATER · PHYSICAL',
      desc: 'Reduces light penetration affecting primary production. Elevated values indicate sediment load or algal proliferation.'
    },
    {
      key: 'temp', label: 'T° — Water Temperature', unit: '°C', value: 22.4,
      min: 0, max: 35, lowThreshold: 25, critThreshold: 30,
      category: 'WATER · PHYSICAL',
      desc: 'Above 25°C reduces dissolved oxygen capacity and accelerates metabolic stress rates in aquatic organisms.'
    },
    {
      key: 'do', label: 'O₂ — Dissolved Oxygen', unit: 'mg/L', value: 7.2,
      min: 0, max: 14, lowThreshold: 8, critThreshold: 5,
      higherIsBetter: true,
      category: 'WATER · PHYSICAL',
      desc: 'Critical for aerobic life. Below 5 mg/L triggers hypoxic stress; below 2 mg/L is lethal to most marine organisms.'
    }
  ];

  selectedParam!: EcoParam;
  showParamDropdown = false;

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

  get gaugePercent(): number {
    const p = this.selectedParam;
    if (!p) return 0;
    const frac = (p.value - p.min) / (p.max - p.min);
    const raw = p.higherIsBetter ? (1 - frac) * 100 : frac * 100;
    return Math.min(100, Math.max(0, raw));
  }

  get gaugeArc(): string {
    const filled = 329.87 * (this.gaugePercent / 100);
    return `${filled} ${439.82 - filled}`;
  }

  get gaugeStatus(): 'LOW' | 'MODERATE' | 'CRITICAL' {
    const p = this.selectedParam;
    if (!p) return 'LOW';
    if (p.higherIsBetter) {
      if (p.value >= p.lowThreshold) return 'LOW';
      if (p.value >= p.critThreshold) return 'MODERATE';
      return 'CRITICAL';
    }
    if (p.value <= p.lowThreshold) return 'LOW';
    if (p.value <= p.critThreshold) return 'MODERATE';
    return 'CRITICAL';
  }

  get gaugeStatusColor(): string {
    const isLight = this.themeService.isLight;
    switch (this.gaugeStatus) {
      case 'LOW':      return isLight ? '#1a8f7f' : '#4ad6c4';
      case 'MODERATE': return isLight ? '#b36c00' : '#f5b94a';
      case 'CRITICAL': return isLight ? '#dc2626' : '#ef4444';
    }
  }

  get rangeMarkerPos(): number {
    const p = this.selectedParam;
    if (!p) return 0;
    return (p.value - p.min) / (p.max - p.min) * 100;
  }

  get rangeSegments(): { flex: number; color: string }[] {
    const p = this.selectedParam;
    if (!p) return [];
    const range = p.max - p.min;
    if (p.higherIsBetter) {
      return [
        { flex: (p.critThreshold - p.min) / range,        color: '#ef4444' },
        { flex: (p.lowThreshold - p.critThreshold) / range, color: '#f5b94a' },
        { flex: (p.max - p.lowThreshold) / range,          color: '#4ad6c4' },
      ];
    }
    return [
      { flex: (p.lowThreshold - p.min) / range,           color: '#4ad6c4' },
      { flex: (p.critThreshold - p.lowThreshold) / range,  color: '#f5b94a' },
      { flex: (p.max - p.critThreshold) / range,           color: '#ef4444' },
    ];
  }

  get rangeTicks(): { value: number; color: string; pos: number }[] {
    const p = this.selectedParam;
    if (!p) return [];
    const range  = p.max - p.min;
    const pct    = (v: number) => (v - p.min) / range * 100;
    const isLight = this.themeService.isLight;
    const gray   = isLight ? '#9bb0bc' : '#5d7785';
    const orange = isLight ? '#b36c00' : '#f5b94a';
    const red    = isLight ? '#dc2626' : '#ef4444';
    if (p.higherIsBetter) {
      return [
        { value: p.min,           color: gray,   pos: 0 },
        { value: p.critThreshold, color: red,    pos: pct(p.critThreshold) },
        { value: p.lowThreshold,  color: orange, pos: pct(p.lowThreshold) },
        { value: p.max,           color: gray,   pos: 100 },
      ];
    }
    return [
      { value: p.min,           color: gray,   pos: 0 },
      { value: p.lowThreshold,  color: orange, pos: pct(p.lowThreshold) },
      { value: p.critThreshold, color: red,    pos: pct(p.critThreshold) },
      { value: p.max,           color: gray,   pos: 100 },
    ];
  }

  paramCompare(a: EcoParam, b: EcoParam): boolean {
    return a?.key === b?.key;
  }

  ecoValuesLoading = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private ecoStatusService: EcoStatusService,
    private portalProjectsService: PortalProjectsService,
    private projectService: ProjectService,
    private projectGroupService: ProjectGroupService,
    private destroyRef: DestroyRef,
    private el: ElementRef,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.selectedParam = this.ecoParams[0];
    this.checkAdminSession();
    this.startClock();

    this.ecoStatusService.getLatestValues()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: vals => {
          const map: Record<string, number | null> = {
            nh4: vals.nh4, no3: vals.no3, no2: vals.no2, po4: vals.po4,
            si: vals.si, toc: vals.toc, do: vals.do, temp: vals.temp,
            turb: vals.turb, chl: vals.chl,
          };
          this.ecoParams = this.ecoParams.map(p =>
            map[p.key] != null ? { ...p, value: map[p.key]! } : p
          );
          this.selectedParam = this.ecoParams.find(p => p.key === this.selectedParam?.key)
            ?? this.ecoParams[0];
          this.ecoValuesLoading = false;
        },
        error: () => { this.ecoValuesLoading = false; }
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
        // Re-observe after project cards are rendered
        setTimeout(() => this.observeFadeElements(), 80);
      });

    // Load featured outputs once projects are available
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
      this.currentTime = new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Tunis', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' TUN';
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
        if (!ok) {
          this.error = 'Invalid username or password';
          return;
        }
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
      error: () => {
        this.error = 'Invalid username or password';
      }
    });
  }

  continueToAdmin(): void {
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      this.router.navigate(['/projectadmin']);
    }
  }

  adminLogout(): void {
    this.authService.logout();
    this.isAdminLoggedIn = false;
    this.showAdminLogin = false;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleParamDropdown(): void { this.showParamDropdown = !this.showParamDropdown; }

  selectEcoParam(p: EcoParam): void {
    this.selectedParam = p;
    this.showParamDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.admin-area'))    this.showAdminLogin    = false;
    if (!target.closest('.esp-dd-wrap'))   this.showParamDropdown = false;
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
    const navHeight = 64;
    const top = el.getBoundingClientRect().top + window.scrollY - navHeight - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  navigateToProject(projectSlug: string): void {
    this.router.navigate(['/portal', projectSlug]);
  }
}
