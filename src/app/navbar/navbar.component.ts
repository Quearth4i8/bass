import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  isSticky: boolean = false;

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: any) {
    this.isSticky = window.scrollY > 0;
  }
  
}
