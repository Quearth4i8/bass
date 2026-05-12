import { Component } from '@angular/core';

@Component({
  selector: 'app-landscape-cards',
  templateUrl: 'landscape_cards.component.html',
  styleUrls: ['landscape_cards.component.scss']
})
export class LandscapeCardsComponent {
  modalOpen = false;
  modalTitle = '';
  modalDescription = '';

  private readonly descriptions: Record<string, string> = {
    ATMOSPHERIC: 'Studies have shown that meteorological conditions in general and ambient temperature in particular can have an important impact on various aspects of the functioning of modern human societies such as health, agriculture, water, infrastructures and economic productivity. Key parameters such as air temperature, humidity, and wind direction provide essential information for understanding weather patterns, climate variability, and their potential impacts on ecosystems and societies. Air temperature reflects the thermal state of the atmosphere, while humidity indicates the amount of moisture present, both of which influence comfort, precipitation, and energy balance. Wind direction and speed, on the other hand, govern the transport of heat, moisture, and pollutants, shaping local and regional atmospheric dynamics.',
    WATER: 'Aquatic conditions are determined by a combination of physical, chemical, and biological parameters that interact to shape the dynamics of marine and freshwater systems. Physical factors such as tides, waves, and currents regulate water movement, mixing, and sediment transport, directly influencing habitat structure and nutrient availability. Chemical parameters, including major elements, trace elements, salinity and nutrient concentrations, are essential indicators of water quality and ecosystem health. In parallel, microorganisms, ranging from bacteria to phytoplankton, play a vital role in nutrient cycling, primary production, and the overall functioning of aquatic ecosystems.',
    SEDIMENT: 'Sediment conditions reflect a complex interplay of physical, chemical, and biological characteristics that provide critical insights into aquatic environments. Hydrocarbon parameters are key indicators of contamination and pollution sources, often linked to anthropogenic activities and their long-term impacts on ecosystems. Chemical parameters, including major elements and trace elements influence sediment quality and its role as both a sink and source of substances within aquatic systems. In addition, microorganisms inhabiting sediments play an essential role in biogeochemical cycles, driving processes such as organic matter decomposition and pollutant degradation.',
    BIOTA: 'Biota refers to the living components of an ecosystem, including microorganisms, plants, and animals, and the interactions that connect them. Biota structure and function are shaped by environmental conditions and in turn influence nutrient cycling, productivity, food-web dynamics, and ecosystem services. Tracking biota helps evaluate ecological status, detect change over time, and support evidence-based environmental management.'
  };

  onReadMore(title: string) {
    this.modalTitle = title;
    this.modalDescription = this.descriptions[title] || 'More information will be available soon.';
    this.modalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.modalOpen = false;
    document.body.style.overflow = '';
  }

  // Accessibility: close on ESC
  constructor() {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.modalOpen && (e.key === 'Escape' || e.key === 'Esc')) {
        this.closeModal();
      }
    });
  }
}
