import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
})
export class CarouselComponent implements OnInit, OnDestroy {
  items = [
    { img: 'assets/images/4.png', design: 'design', title: 'Real-Time Ecosystem Monotoring & Evaluation', description: 'BASSIANA database is supported by the United States Agency for Development (USAID, USA) and managed by the National Academy of Sciences (NAS, USA) under the Cycle 8 of the Partnerships for Enhanced Engagement in Research (PEER) Program.' },
    { img: 'assets/images/1.png', design: 'design', title: 'Exchanging Ecosystem Data for Practical Problems Application', description: 'BASSIANA database gathers Biological, Chemical, Physical, Physico-chemical, Sedimentological and Fishery data for a long period at the level of the Mediterranean.' },
    { img: 'assets/images/2.png', design: 'design', title: 'BASSIANA Ecosystems Database', description: 'Carrying out an environmental approach, especially in oceanography, requires reliable data. The Bassiana interactive database responds perfectly to the mentioned need.' },
    { img: 'assets/images/3.png', design: 'design', title: 'BASSIANA Interractive Ecosystems Database', description: 'BASSIANA database is designed as a means of collecting and exchanging ecosystem data for practical application. These data are provided from different sources of national and international projects and initiatives.' },
  ];
  
  thumbnails = [
    { img: 'assets/images/4.png', title: '' },
    { img: 'assets/images/1.png', title: '' },
    { img: 'assets/images/2.png', title: '' },
    { img: 'assets/images/3.png', title: '' },
  ];
  
  countItem = this.items.length;
  itemActive = 0;
  refreshInterval: any;

  ngOnInit(): void {
    this.refreshInterval = setInterval(() => {
      this.next();
    }, 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshInterval);
  }

  next(): void {
    this.itemActive = (this.itemActive + 1) % this.countItem;
    this.showSlider();
  }

  prev(): void {
    this.itemActive = (this.itemActive - 1 + this.countItem) % this.countItem;
    this.showSlider();
  }

  setActive(index: number): void {
    this.itemActive = index;
    this.showSlider();
  }

  showSlider(): void {
    clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      this.next();
    }, 5000);
  }
}
