import { Component } from '@angular/core';

@Component({
  selector: 'app-dataproviders',
  templateUrl: 'dataproviders.component.html',
  styleUrls: ['dataproviders.component.scss'],
})
export class DataprovidersComponent {
  cards = [
    { image: 'assets/team/af.png', name: 'Afef Fathali', text: 'Researcher,INSTM'},
    { image: 'assets/team/bb.jpg', name: 'Béchir Bejaoui', text: 'Researcher,INSTM'},
    { image: 'assets/team/nz.png', name: 'Noureddine Zaaboub ', text: 'Researcher,INSTM'},
    { image: 'assets/team/oula.jpg', name: 'Oula Amrouni', text: 'Researcher,INSTM'},
    { image: 'assets/team/unkown.jpg', name: 'Name', text: 'role,location'},
    { image: 'assets/team/unkown.jpg', name: 'Name', text: 'role,location'},

  ];
}
