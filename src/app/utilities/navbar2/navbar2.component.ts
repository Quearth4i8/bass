import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-navbar2',
  templateUrl: './navbar2.component.html',
  styleUrls: ['./navbar2.component.scss']
})
export class Navbar2Component {
  isSticky: boolean = false;

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: any) {
    this.isSticky = window.scrollY > 0;
  }
  
}
