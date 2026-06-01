import { Component, DestroyRef, HostBinding, HostListener, OnInit, AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/AuthService';
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.admin-area')) {
      this.showAdminLogin = false;
    }
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
