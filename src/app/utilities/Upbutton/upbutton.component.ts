import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-upbutton',
  templateUrl: './upbutton.component.html',
  styleUrls: ['./upbutton.component.scss']
})
export class UpbuttonComponent {


  showBackToTop = false;
  
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showBackToTop = (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop) > 100;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
