import { Component, Renderer2, ElementRef } from '@angular/core';

@Component({
  selector: 'app-landscape-cards',
  templateUrl: 'landscape_cards.component.html',
  styleUrls: ['landscape_cards.component.scss']
})
export class LandscapeCardsComponent {
  modalOpen = false;
  modalTitle = '';
  modalDescription = '';

  cardData = [
    {
      title: 'ATMOSPHERIC',
      category: 'Climate Analysis',
      description: 'Advanced meteorological monitoring and atmospheric conditions',
      image: 'assets/images/atm.jpg'
    },
    {
      title: 'WATER',
      category: 'Aquatic Systems',
      description: 'Comprehensive water quality and ecosystem assessment',
      image: 'assets/images/water.jpg'
    },
    {
      title: 'SEDIMENT',
      category: 'Environmental Impact',
      description: 'Sediment analysis and pollution tracking',
      image: 'assets/images/sediment.jpg'
    }
  ];

  private readonly descriptions: Record<string, string> = {
    ATMOSPHERIC: 'Studies have shown that meteorological conditions in general and ambient temperature in particular can have an important impact on various aspects of the functioning of modern human societies such as health, agriculture, water, infrastructures and economic productivity. Key parameters such as air temperature, humidity, and wind direction provide essential information for understanding weather patterns, climate variability, and their potential impacts on ecosystems and societies. Air temperature reflects the thermal state of the atmosphere, while humidity indicates the amount of moisture present, both of which influence comfort, precipitation, and energy balance. Wind direction and speed, on the other hand, govern the transport of heat, moisture, and pollutants, shaping local and regional atmospheric dynamics.',
    WATER: 'Aquatic conditions are determined by a combination of physical, chemical, and biological parameters that interact to shape the dynamics of marine and freshwater systems. Physical factors such as tides, waves, and currents regulate water movement, mixing, and sediment transport, directly influencing habitat structure and nutrient availability. Chemical parameters, including major elements, trace elements, salinity and nutrient concentrations, are essential indicators of water quality and ecosystem health. In parallel, microorganisms, ranging from bacteria to phytoplankton, play a vital role in nutrient cycling, primary production, and the overall functioning of aquatic ecosystems.',
    SEDIMENT: 'Sediment conditions reflect a complex interplay of physical, chemical, and biological characteristics that provide critical insights into aquatic environments. Hydrocarbon parameters are key indicators of contamination and pollution sources, often linked to anthropogenic activities and their long-term impacts on ecosystems. Chemical parameters, including major elements and trace elements influence sediment quality and its role as both a sink and source of substances within aquatic systems. In addition, microorganisms inhabiting sediments play an essential role in biogeochemical cycles, driving processes such as organic matter decomposition and pollutant degradation.'
  };

  constructor(private renderer: Renderer2, private el: ElementRef) {
    // Accessibility: close on ESC
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.modalOpen && (e.key === 'Escape' || e.key === 'Esc')) {
        this.closeModal();
      }
    });
  }

  onReadMore(title: string) {
    console.log('onReadMore called with title:', title);
    
    // Set modal data and open
    this.modalTitle = title;
    this.modalDescription = this.descriptions[title] || 'More information will be available soon.';
    this.modalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    console.log('closeModal called, modalOpen was:', this.modalOpen);
    
    // Add closing animation classes
    const modalElement = this.el.nativeElement.querySelector('.cards-modal');
    const backdropElement = this.el.nativeElement.querySelector('.cards-modal-backdrop');
    
    if (modalElement) {
      this.renderer.addClass(modalElement, 'closing');
    }
    
    if (backdropElement) {
      this.renderer.addClass(backdropElement, 'closing');
    }
    
    // Wait for animation to complete before hiding modal
    setTimeout(() => {
      this.modalOpen = false;
      document.body.style.overflow = '';
      
      // Remove closing classes for next time
      if (modalElement) {
        this.renderer.removeClass(modalElement, 'closing');
      }
      if (backdropElement) {
        this.renderer.removeClass(backdropElement, 'closing');
      }
    }, 300); // Match the expandOut animation duration
  }
}
