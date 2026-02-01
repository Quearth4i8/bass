import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarService } from 'src/app/services/sidebarservice';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidenavbar',
  templateUrl: './sidenavbar.component.html',
  styleUrls: ['./sidenavbar.component.scss']
})
export class SidenavbarComponent implements OnInit, OnDestroy {
  isSidebarVisible = true;
  isSubmenuOpen = false;
  isDashboardSelected = false;
  currentRoute: string = '';
  isMobile = false;
  private routerSubscription: any;

  constructor(private sidebarService: SidebarService, private router: Router) {}

  ngOnInit() {
    // Subscribe to sidebar visibility
    this.sidebarService.sidebarVisibility$.subscribe((isVisible) => {
      this.isSidebarVisible = isVisible;
    });

    // Subscribe to router events for active route detection
    this.routerSubscription = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.urlAfterRedirects.split('/')[1] || '';
    });

    // Check for mobile screen size
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile.bind(this));
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    window.removeEventListener('resize', this.checkMobile.bind(this));
  }

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
    this.sidebarService.toggleSidebar();
  }

  toggleSubmenu() {
    this.isSubmenuOpen = !this.isSubmenuOpen;
  }

  selectDashboard() {
    this.isDashboardSelected = true;
  }

  isActiveRoute(route: string): boolean {
    return this.currentRoute === route;
  }

  private checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }
}
