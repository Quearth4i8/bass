import { Component, DestroyRef, HostBinding, OnInit } from '@angular/core';
import { ThemeService } from '../services/ThemeService';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarService } from '../services/sidebarservice';

@Component({
  selector: 'app-wikiadmin',
  templateUrl: 'wikiadmin.component.html',
  styleUrls: ['wikiadmin.component.scss']
})
export class WikiadminComponent implements OnInit {
  @HostBinding('class.theme-light') get isLight() { return this.themeService.isLight; }
  isSidebarVisible = true;

  constructor(
    private sidebarService: SidebarService,
    private destroyRef: DestroyRef,
    public themeService: ThemeService,
  ) { }

  ngOnInit(): void {
    this.sidebarService.sidebarVisibility$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isVisible) => {
        this.isSidebarVisible = isVisible;
      });
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
    this.sidebarService.toggleSidebar();
  }
}
