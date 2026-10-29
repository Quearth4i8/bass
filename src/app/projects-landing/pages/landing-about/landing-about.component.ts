import { Component, AfterViewInit, ChangeDetectorRef, DestroyRef, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { filter, switchMap, take } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

import { ProjectService } from '../../../services/ProjectService';
import { PortalProjectsService } from '../../../portal/services/portal-projects.service';
import { LANDSCAPE_CARDS } from '../../../home/landscape-cards/landscape-cards.component';

interface PieSlice { key: string; label: string; count: number; percent: number; d: string; }
interface ReelVideo { videoUrl: string; title: string; projectSlug: string; }

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

  // Geodatabase rail: the zone whose flyout is pinned open by a click, and
  // the one under the pointer, whose flyout shows while hovered.
  zones = LANDSCAPE_CARDS;
  activeZone: string | null = null;
  hoverZone: string | null = null;

  // Relevant Outputs reel in the Our Mission card: the featured videos, played
  // one after another; reelOpen shows the current one expanded.
  reel: ReelVideo[] = [];
  reelIndex = 0;
  reelOpen = false;
  reelClosing = false;
  @ViewChild('reelThumb') private reelThumb?: ElementRef<HTMLElement>;
  @ViewChild('reelVideo') private reelVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('reelStage') private reelStage?: ElementRef<HTMLElement>;
  @ViewChild('reelBig') private reelBig?: ElementRef<HTMLVideoElement>;

  private io?: IntersectionObserver;

  constructor(
    private projectService: ProjectService,
    private portalProjectsService: PortalProjectsService,
    private destroyRef: DestroyRef,
    private el: ElementRef,
    private cdr: ChangeDetectorRef,
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

    // Same source as the Relevant Outputs page: featured outputs with a video,
    // across the active portal projects.
    this.portalProjectsService.list().pipe(
      filter(projects => projects.length > 0),
      take(1),
      switchMap(projects => {
        const actives = projects.filter(p => p.isActive);
        return actives.length ? forkJoin(actives.map(p => this.portalProjectsService.getBySlug(p.slug))) : of([]);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(fullProjects => {
      const videos: ReelVideo[] = [];
      fullProjects.forEach(full => {
        if (!full) return;
        (full.content?.outputs?.outputs ?? [])
          .filter((o: any) => o.featured && o.videoUrl?.trim())
          .forEach((o: any) => videos.push({ videoUrl: o.videoUrl, title: o.title, projectSlug: full.slug }));
      });
      this.reel = videos;
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

  toggleZone(id: string): void {
    this.activeZone = this.activeZone === id ? null : id;
  }

  /** A click anywhere outside the rail, or Escape, closes the open flyout. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (this.activeZone && !(e.target as HTMLElement).closest('.geo-rail')) this.activeZone = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.activeZone = null; this.closeReel(); }

  nextReel(): void { this.reelIndex = (this.reelIndex + 1) % (this.reel.length || 1); }

  /** Angular sets [muted] too late for autoplay in some browsers, so set it and play here. */
  playMuted(e: Event): void {
    const v = e.target as HTMLVideoElement;
    v.muted = true;
    if (this.reelOpen) v.pause();   // the expanded copy is playing
    else v.play().catch(() => {});
  }

  /** Expands the current video from the card's thumbnail to the centre of the screen. */
  openReel(): void {
    const thumb = this.reelThumb?.nativeElement;
    if (!thumb || this.reelOpen) return;
    const from = thumb.getBoundingClientRect();
    const t = this.reelVideo?.nativeElement.currentTime ?? 0;
    this.reelVideo?.nativeElement.pause();
    this.reelOpen = true;
    this.reelClosing = false;
    this.cdr.detectChanges();

    const big = this.reelBig?.nativeElement;
    if (big) { big.currentTime = t; big.play().catch(() => {}); }
    this.animateStage(from, false);
  }

  closeReel(): void {
    if (!this.reelOpen || this.reelClosing) return;
    const t = this.reelBig?.nativeElement.currentTime ?? 0;
    this.reelClosing = true;
    const to = this.reelThumb?.nativeElement.getBoundingClientRect();
    const done = () => {
      this.reelOpen = false;
      this.reelClosing = false;
      this.cdr.detectChanges();
      const small = this.reelVideo?.nativeElement;
      if (small) { small.currentTime = t; small.play().catch(() => {}); }
    };
    const anim = to ? this.animateStage(to, true) : undefined;
    if (anim) anim.onfinish = done;
    else done();
  }

  /** FLIP: the stage starts (or ends) scaled down over the thumbnail's rect. */
  private animateStage(thumb: DOMRect, reverse: boolean): Animation | undefined {
    const stage = this.reelStage?.nativeElement;
    if (!stage || matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const r = stage.getBoundingClientRect();
    const s = thumb.width / r.width;
    const small = `translate(${thumb.left - r.left}px, ${thumb.top - r.top}px) scale(${s})`;
    const frames = [{ transform: small, opacity: 0.6 }, { transform: 'none', opacity: 1 }];
    return stage.animate(reverse ? frames.reverse() : frames,
      { duration: reverse ? 320 : 420, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
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
