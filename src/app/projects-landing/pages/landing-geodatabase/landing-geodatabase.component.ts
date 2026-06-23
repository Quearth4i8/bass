import { Component, AfterViewInit, ElementRef, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-landing-geodatabase',
  templateUrl: './landing-geodatabase.component.html',
})
export class LandingGeodatabaseComponent implements AfterViewInit, OnDestroy {
  private io?: IntersectionObserver;

  constructor(private el: ElementRef) {}

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
