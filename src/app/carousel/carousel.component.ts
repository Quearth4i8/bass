import { Component, Input } from '@angular/core';

export interface Slide {
subText: any;
mainText: any;
  imgSrc : string;
  imgAlt : string;
}

@Component({
  selector: 'carousel',
  templateUrl: 'carousel.component.html',
  styleUrls: ['carousel.component.scss'],
})
export class CarouselComponent {
  @Input() images: Slide[] = [];
  selectedIndex = 0;
  interval: any;

  ngOnInit() {
    this.startAutoSlide();
  }

  startAutoSlide() {
    this.interval = setInterval(() => {
      this.showNext();
    }, 17000); // Adjust the interval (in milliseconds) as needed
  }

  stopAutoSlide() {
    clearInterval(this.interval);
  }

  showPrev() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
    } else {
      this.selectedIndex = this.images.length - 1;
    }
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  showNext() {
    if (this.selectedIndex < this.images.length - 1) {
      this.selectedIndex++;
    } else {
      this.selectedIndex = 0;
    }
  }

  getPrevIndex(index: number): number {
    if (index === 0) {
      return this.images.length - 1; // Circular, go to last image
    } else {
      return index - 1;
    }
  }

  getNextIndex(index: number): number {
    if (index === this.images.length - 1) {
      return 0; // Circular, go to first image
    } else {
      return index + 1;
    }
  }
}
