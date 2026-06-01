import { Component } from '@angular/core';

@Component({
  selector: 'app-landscape-cards',
  templateUrl: 'landscape_cards.component.html',
  styleUrls: ['landscape_cards.component.scss']
})
export class LandscapeCardsComponent {
  activeCard: string | null = null;

  cards = [
    {
      id: 'ATMOSPHERIC',
      tag: 'PARAMETERS',
      name: 'Atmospheric',
      image: 'assets/images/atm.jpg',
      description: 'Studies have shown that meteorological conditions in general and ambient temperature in particular can have an important impact on various aspects of the functioning of modern human societies such as health, agriculture, water, infrastructures and economic productivity. Key parameters such as air temperature, humidity, and wind direction provide essential information for understanding weather patterns, climate variability, and their potential impacts on ecosystems and societies.'
    },
    {
      id: 'WATER',
      tag: 'PARAMETERS',
      name: 'Water',
      image: 'assets/images/water.jpg',
      description: 'Aquatic conditions are determined by a combination of physical, chemical, and biological parameters that interact to shape the dynamics of marine and freshwater systems. Physical factors such as tides, waves, and currents regulate water movement, mixing, and sediment transport, directly influencing habitat structure and nutrient availability. Chemical parameters, including major elements, trace elements, salinity and nutrient concentrations, are essential indicators of water quality and ecosystem health.'
    },
    {
      id: 'SEDIMENT',
      tag: 'PARAMETERS',
      name: 'Sediment',
      image: 'assets/images/sediment.jpg',
      description: 'Sediment conditions reflect a complex interplay of physical, chemical, and biological characteristics that provide critical insights into aquatic environments. Hydrocarbon parameters are key indicators of contamination and pollution sources, often linked to anthropogenic activities and their long-term impacts on ecosystems. Chemical parameters, including major elements and trace elements influence sediment quality and its role as both a sink and source of substances within aquatic systems.'
    },
    {
      id: 'BIOTA',
      tag: 'PARAMETERS',
      name: 'Biota',
      image: 'assets/images/6.jpg',
      description: 'Biota refers to the living components of an ecosystem, including microorganisms, plants, and animals, and the interactions that connect them. Biota structure and function are shaped by environmental conditions and in turn influence nutrient cycling, productivity, food-web dynamics, and ecosystem services. Tracking biota helps evaluate ecological status, detect change over time, and support evidence-based environmental management.'
    }
  ];

  toggle(id: string): void {
    this.activeCard = this.activeCard === id ? null : id;
  }
}
