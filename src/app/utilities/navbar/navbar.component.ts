import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  isSticky: boolean = false;
  isMenuOpen: boolean = false;
  openDropdown: string | null = null;

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

  toggleDropdown(key: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.openDropdown = this.openDropdown === key ? null : key;
  }
}
