import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
})
export class CarouselComponent implements OnInit, OnDestroy {
  items = [
    { img: 'assets/images/4.png', design: 'design', title: 'Real-Time Ecosystem Monotoring & Evaluation', description: 'BASSIANA database is supported by United States Agency for Development (USAID, USA) and managed by National Academy of Sciences (NAS, USA) under Cycle 8 of Partnerships for Enhanced Engagement in Research (PEER) Program.' },
    { img: 'assets/images/1.png', design: 'design', title: 'Exchanging Ecosystem Data for Practical Problems Application', description: 'BASSIANA database gathers Biological, Chemical, Physical, Physico-chemical, Sedimentological and Fishery data for a long period at the level of Mediterranean.' },
    { img: 'assets/images/2.png', design: 'design', title: 'BASSIANA Ecosystems Database', description: 'Carrying out an environmental approach, especially in oceanography, requires reliable data. The Bassiana interactive database responds perfectly to the mentioned need.' },
    { img: 'assets/images/3.png', design: 'design', title: 'BASSIANA Interractive Ecosystems Database', description: 'BASSIANA database is designed as a means of collecting and exchanging ecosystem data for practical application. These data are provided from different sources of national and international projects and initiatives.' },
  ];
  
  countItem = this.items.length;
  itemActive = 0;
  refreshInterval: any;
  progressInterval: any;
  progressLinesArray = Array(4).fill(0); // Create array with 4 elements for 4 slides
  currentProgressLine = 0;
  slideDuration = 5000; // 5 seconds per slide
  progressUpdateInterval = 1250; // Update every 1.25 seconds (5 seconds / 4 lines)

  ngOnInit(): void {
    this.startProgress();
    this.refreshInterval = setInterval(() => {
      this.next();
    }, this.slideDuration);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshInterval);
    clearInterval(this.progressInterval);
  }

  startProgress(): void {
    this.currentProgressLine = 0;
    clearInterval(this.progressInterval);
    
    this.progressInterval = setInterval(() => {
      // Fill current line completely before moving to next
      if (this.currentProgressLine <= this.itemActive) {
        this.currentProgressLine++;
      }
      
      // When current line is filled, reset and move to next
      if (this.currentProgressLine > this.itemActive) {
        this.currentProgressLine = this.itemActive + 1; // Move to next line
        if (this.currentProgressLine >= this.progressLinesArray.length) {
          this.currentProgressLine = 0; // Reset to first line
        }
      }
    }, this.progressUpdateInterval);
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
    clearInterval(this.progressInterval);
    this.startProgress();
    this.refreshInterval = setInterval(() => {
      this.next();
    }, this.slideDuration);
  }
}
