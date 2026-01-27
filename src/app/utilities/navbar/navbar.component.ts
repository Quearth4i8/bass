import { Component, HostListener, Renderer2, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { BackgroundMusicService } from 'src/app/services/background-music.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isSticky: boolean = false;
  isMenuOpen: boolean = false;
  openDropdown: string | null = null;
  isMobile: boolean = false;
  private routerSubscription: Subscription | null = null;
  private musicSubscription: Subscription | null = null;
  currentRoute: string = '';
  isMusicPlaying: boolean = false;

  constructor(private renderer: Renderer2, private el: ElementRef, private router: Router, private activatedRoute: ActivatedRoute, private backgroundMusicService: BackgroundMusicService) {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
  }

  ngOnInit(): void {
    // Get current route for highlighting - use router events for more reliable detection
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = this.router.url.split('?')[0].replace('/', '');
        console.log('Route updated to:', this.currentRoute);
      }
    });
    
    // Also try to get initial route
    this.currentRoute = this.router.url.split('?')[0].replace('/', '');
    
    // Subscribe to background music state
    this.musicSubscription = this.backgroundMusicService.getMusicState().subscribe(state => {
      this.isMusicPlaying = state.isPlaying;
    });
    
    // Get initial music state
    const initialState = this.backgroundMusicService.getCurrentState();
    this.isMusicPlaying = initialState.isPlaying;
    
    // Close mobile menu when navigating to a new page
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.isMenuOpen) {
        this.closeMenu();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.musicSubscription) {
      this.musicSubscription.unsubscribe();
    }
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth <= 992;
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: any) {
    this.isSticky = window.scrollY > 0;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (!this.isMenuOpen) {
      this.openDropdown = null;
    }
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    this.openDropdown = null;
  }

  handleDropdownItemClick(event: Event): void {
    console.log('Dropdown item clicked!', event);
    // On mobile, close the menu after clicking a dropdown item
    if (this.isMobile) {
      this.closeMenu();
    }
  }

  toggleDropdown(key: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // On mobile, toggle dropdown visibility
    if (this.isMobile) {
      this.openDropdown = this.openDropdown === key ? null : key;
    } else {
      // On desktop, keep existing behavior or disable
      this.openDropdown = null;
    }
    
    console.log('Dropdown toggled:', key, 'Current state:', this.openDropdown, 'Mobile:', this.isMobile);
  }

  isActiveRoute(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.includes(route);
  }

  toggleMusic(): void {
    this.backgroundMusicService.toggleMusic();
  }

  getNavbarTextColor(): string {
    // Debug logging
    console.log('Current route:', this.currentRoute);
    
    // Light background pages (need dark text)
    const lightBackgroundPages = ['gallery', 'events', 'team', 'projects'];
    
    // Check if current route contains any of the light background pages
    const isLightBackground = lightBackgroundPages.some(page => this.currentRoute.includes(page));
    
    console.log('Is light background page:', isLightBackground);
    
    if (isLightBackground) {
      return 'dark'; // Use dark text for light backgrounds
    } else {
      return 'light'; // Use light text for dark backgrounds (all other pages)
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Only close dropdowns if clicking outside the navbar on mobile
    if (this.isMobile) {
      const navbarElement = this.el.nativeElement.querySelector('.navbar-menu');
      if (navbarElement && !navbarElement.contains(target)) {
        // Check if we're clicking on a dropdown item
        const dropdownItem = target.closest('.dropdown-item');
        if (!dropdownItem) {
          this.openDropdown = null;
        }
      }
    } else {
      // Desktop behavior - close if clicking outside dropdown
      const dropdownElement = this.el.nativeElement.querySelector('.nav-dropdown');
      if (dropdownElement && !dropdownElement.contains(target)) {
        this.openDropdown = null;
      }
    }
  }
}
