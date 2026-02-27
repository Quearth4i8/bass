import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-navbar2',
  templateUrl: './navbar2.component.html',
  styleUrls: ['./navbar2.component.scss']
})
export class Navbar2Component {
  isSticky: boolean = true;

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: any) {
    // Always keep sticky true
    this.isSticky = true;
  }
  
}
