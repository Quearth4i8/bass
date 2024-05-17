import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface Slide {
  subText: any;
  mainText: any;
  imgSrc: string;
  imgAlt: string;
  bgColor: string;
}

@Component({
  selector: 'carousel',
  templateUrl: 'carousel.component.html',
  styleUrls: ['carousel.component.scss'],
})
export class CarouselComponent {
  @Input() images: Slide[] = [];
  @Output() imageChange = new EventEmitter<number>();
  selectedIndex = 0;
  interval: any;

  ngOnInit() {
    this.startAutoSlide();
    this.imageChange.emit(this.selectedIndex);
  }

  startAutoSlide() {
    this.interval = setInterval(() => {
      this.showNext();
    }, 17000);
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
    this.imageChange.emit(this.selectedIndex); 
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  showNext() {
    if (this.selectedIndex < this.images.length - 1) {
      this.selectedIndex++;
    } else {
      this.selectedIndex = 0;
    }
    this.imageChange.emit(this.selectedIndex);
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  getPrevIndex(index: number): number {
    if (index === 0) {
      return this.images.length - 1;
    } else {
      return index - 1;
    }
  }

  getNextIndex(index: number): number {
    if (index === this.images.length - 1) {
      return 0;
    } else {
      return index + 1;
    }
  }
}
