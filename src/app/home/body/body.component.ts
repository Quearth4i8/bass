import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, } from '@angular/core';

@Component({
  selector: 'app-body',
  templateUrl: 'body.component.html',
  styleUrls: ['body.component.scss'],
  animations: [
    trigger('backgroundChange', [
      state('void', style({ backgroundColor: '{{bgColor}}' }), { params: { bgColor: 'rgba(209, 228, 255, 0.699)' } }),
      state('*', style({ backgroundColor: '{{bgColor}}' }), { params: { bgColor: 'rgba(209, 228, 255, 0.699)' } }),
      transition('void <=> *', animate('1s ease-in-out')),
      transition('* <=> *', animate('1s ease-in-out'))
    ])
  ]
})
export class BodyComponent {
  images = [
    {
      imgSrc : 'assets/images/1.png',
      imgAlt : 'image 1',
      mainText : 'EXCHANGING ECOSYSTEM DATA FOR PRACTICAL PROBLEMS APPLICATION',
      subText : 'BASSIANA database gathers Biological, Chemical, Physical, Physico-chemical, Sedimentological and Fishery data for a long period at the level of the Mediterranean.',
      bgColor: 'rgba(209, 228, 255, 0.699)'
    },
    {
      imgSrc : 'assets/images/2.png',
      imgAlt : 'image 2',
      mainText : 'BASSIANA Ecosystems Database',
      subText : 'Carrying out an environmental approach, especially in oceanography, requires reliable data. The Bassiana interactive database responds perfectly to the mentioned need.',
      bgColor: 'rgba(90, 162, 147, 0.699)'
    },
    {
      imgSrc : 'assets/images/3.png',
      imgAlt : 'image 3',
      mainText : 'BASSIANA INTERACTIVE Ecosystems DB',
      subText : 'BASSIANA database is designed as a means of collecting and exchanging ecosystem data for practical application. These data are provided from different sources of national and international projects and initiatives.',
      bgColor: 'rgba(68, 156, 191, 0.699)'
    },
    {
      imgSrc : 'assets/images/4.png',
      imgAlt : 'image 4',
      mainText : 'REAL-TIME ECOSYSTEM MONITORING AND EVALUATION',
      subText : 'BASSIANA database is supported by the United States Agency for Development (USAID, USA) and managed by the National Academy of Sciences (NAS, USA) under the Cycle 8 of the Partnerships for Enhanced Engagement in Research (PEER) Program.',
      bgColor: 'rgba(214, 177, 152, 0.699)'
    }
  ];
  currentImageIndex = 0;

  getBackgroundColor(index: number): string {
    return this.images[index]?.bgColor || 'rgba(209, 228, 255, 0.699)';
  }

  onImageChange(newIndex: number): void {
    this.currentImageIndex = newIndex;
  }
}
