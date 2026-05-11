import { Component, HostListener, OnInit } from '@angular/core';
import { SidebarService } from '../../services/sidebarservice';
import { AuthService } from '../../services/AuthService';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-portal-projects-list',
  templateUrl: 'portal-projects-list.component.html',
  styleUrls: ['portal-projects-list.component.scss']
})
export class PortalProjectsListComponent implements OnInit {
  isSidebarVisible = true;
  isUserMenuOpen = false;
  logoutModalVisible = false;

  projectName: string = 'IMAS-ICHKEUL'; // Default for now, should be dynamic
  activeTab: string = 'home';
  
  homeImages: any[] = [
    { id: 1, url: '', title: '', subtitle: '', order: 1, expanded: true }
  ];

  homePartnerLogos: any[] = [
    { id: 1, url: '', order: 1 }
  ];

  homeGeoSections: any[] = [
    { id: 1, title: '', text: '' },
    { id: 2, title: '', text: '' },
    { id: 3, title: '', text: '' }
  ];

  homeVideoFile: any = {
    url: '',
    name: ''
  };

  homeInfoBlocks: any[] = [
    { id: 1, imageUrl: '', title: '', text: '', order: 1 }
  ];

  scientificMeritParagraphs: any[] = [
    { id: 1, content: '', order: 1 }
  ];

  objectivesParagraphs: any[] = [
    { id: 1, content: '', order: 1 }
  ];

  partnersLogos: any[] = [
    { id: 1, url: '', order: 1 }
  ];

  funderTextLines: any[] = [
    { id: 1, text: 'NAS: The National Academy of Sciences', order: 1 },
    { id: 2, text: 'USAID: United States Agency for International Development, USA', order: 2 },
    { id: 3, text: 'AID-OAA-A-11-00012', order: 3 }
  ];

  funderLogos: any[] = [
    { id: 1, url: '', order: 1 }
  ];

  specialCharPickerOpen: number = -1;
  specialCharPickerTab: string = '';
  specialCharPickerStyle: { [key: string]: string } = {};
  private lastFocusedEditor: HTMLElement | null = null;

  specialCharCategories: { label: string; chars: string[] }[] = [
    { label: 'Greek Lowercase', chars: ['α','β','γ','δ','ε','ζ','η','θ','ι','κ','λ','μ','ν','ξ','π','ρ','σ','τ','υ','φ','χ','ψ','ω'] },
    { label: 'Greek Uppercase', chars: ['Α','Β','Γ','Δ','Ε','Ζ','Η','Θ','Ι','Κ','Λ','Μ','Ν','Ξ','Π','Ρ','Σ','Τ','Υ','Φ','Χ','Ψ','Ω'] },
    { label: 'Math Symbols', chars: ['±','×','÷','≠','≈','≤','≥','∞','∑','∏','√','∫','∂','∇','≡','∝','∈','∉','⊂','⊃','∪','∩','∠','⊥','∥'] },
    { label: 'Arrows', chars: ['→','←','↑','↓','⇒','⇐','⇑','⇓','↔','⇔','⟶','⟵'] },
    { label: 'Superscript / Subscript', chars: ['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹','₀','₁','₂','₃','₄','₅','₆','₇','₈','₉','⁺','⁻','₊','₋'] },
    { label: 'Scientific Units', chars: ['Å','μm','nm','mm','cm','m','km','μg','mg','g','kg','μL','mL','L','ms','μs','s','min','h','°C','K','°F','Pa','kPa','MPa','bar','atm','Hz','kHz','MHz','GHz','J','kJ','cal','kcal','eV','W','kW','MW','A','mA','μA','V','mV','kV','Ω','F','H','mol','M','N','Bq','Gy','Sv'] },
    { label: 'Other', chars: ['%','@','#','&','*','_','~','^','`','|','\\','/','+','=','<','>','[',']','{','}','(',')',':',';','?','!','"','\'','°','‰','℃','℉','′','″','•','…','–','—','©','®','™','§','¶','†','‡','⊕','⊗','⊙','≤','≥','≪','≫'] }
  ];

  tabs = [
    { id: 'home', label: 'Home', icon: 'bx-home-alt' },
    { id: 'scientific-merit', label: 'Scientific Merit', icon: 'bx-analyse' },
    { id: 'objectives', label: 'Objectives', icon: 'bx-target-lock' },
    { id: 'partners-funder', label: 'Partners & Funder', icon: 'bx-building-house' },
    { id: 'gallery', label: 'Gallery', icon: 'bx-images' },
    { id: 'events', label: 'Events', icon: 'bx-calendar' },
    { id: 'team', label: 'Team', icon: 'bx-group' },
    { id: 'data-providers', label: 'Data Providers', icon: 'bx-data' }
  ];

  constructor(
    private sidebarService: SidebarService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.sidebarService.sidebarVisibility$.subscribe((isVisible: boolean) => {
      this.isSidebarVisible = isVisible;
    });

    // Handle dynamic project name and tab from route
    this.route.params.subscribe(params => {
      if (params['name']) {
        // Find the project in a list or just use the parameter
        // For now we keep the parameter, but ensure it's handled for display
        this.projectName = params['name'].toUpperCase();
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      } else {
        // Default to home if no tab is specified
        this.activeTab = 'home';
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
    this.sidebarService.toggleSidebar();
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  showLogoutModal(event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.logoutModalVisible = true;
  }

  closeLogoutModal(): void {
    this.logoutModalVisible = false;
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeLogoutModal();
    }
  }

  confirmLogout(): void {
    this.logoutModalVisible = false;
    this.authService.logout();
    this.router.navigate(['/projects'], { replaceUrl: true });
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
    // Update URL with tab parameter without navigating
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId },
      queryParamsHandling: 'merge'
    });
  }

  getTabLabel(tabId: string): string {
    const tab = this.tabs.find(t => t.id === tabId);
    return tab ? tab.label : tabId;
  }

  onImageSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.homeImages[index].url = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onLogoSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.homePartnerLogos[index].url = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  addLogo(): void {
    if (this.homePartnerLogos.length >= 10) {
      return;
    }
    const newId = this.homePartnerLogos.length > 0
      ? Math.max(...this.homePartnerLogos.map(l => l.id)) + 1
      : 1;
    this.homePartnerLogos.push({ id: newId, url: '', order: this.homePartnerLogos.length + 1 });
  }

  removeLogo(index: number): void {
    if (this.homePartnerLogos.length <= 1) {
      return;
    }
    this.homePartnerLogos.splice(index, 1);
    this.updateLogoOrder();
  }

  moveLogo(index: number, direction: 'left' | 'right'): void {
    if (direction === 'left' && index > 0) {
      [this.homePartnerLogos[index], this.homePartnerLogos[index - 1]] = [this.homePartnerLogos[index - 1], this.homePartnerLogos[index]];
    } else if (direction === 'right' && index < this.homePartnerLogos.length - 1) {
      [this.homePartnerLogos[index], this.homePartnerLogos[index + 1]] = [this.homePartnerLogos[index + 1], this.homePartnerLogos[index]];
    }
    this.updateLogoOrder();
  }

  private updateLogoOrder(): void {
    this.homePartnerLogos.forEach((l, i) => l.order = i + 1);
  }

  onVideoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.homeVideoFile.name = file.name;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.homeVideoFile.url = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeVideo(): void {
    this.homeVideoFile = {
      url: '',
      name: ''
    };
  }

  onInfoImageSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.homeInfoBlocks[index].imageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  addInfoBlock(): void {
    const newId = this.homeInfoBlocks.length > 0
      ? Math.max(...this.homeInfoBlocks.map(b => b.id)) + 1
      : 1;
    this.homeInfoBlocks.push({
      id: newId,
      imageUrl: '',
      title: '',
      text: '',
      order: this.homeInfoBlocks.length + 1
    });
  }

  removeInfoBlock(index: number): void {
    if (this.homeInfoBlocks.length <= 1) {
      return;
    }
    this.homeInfoBlocks.splice(index, 1);
    this.updateInfoBlockOrder();
  }

  moveInfoBlock(index: number, direction: 'up' | 'down'): void {
    if (direction === 'up' && index > 0) {
      [this.homeInfoBlocks[index], this.homeInfoBlocks[index - 1]] = [this.homeInfoBlocks[index - 1], this.homeInfoBlocks[index]];
    } else if (direction === 'down' && index < this.homeInfoBlocks.length - 1) {
      [this.homeInfoBlocks[index], this.homeInfoBlocks[index + 1]] = [this.homeInfoBlocks[index + 1], this.homeInfoBlocks[index]];
    }
    this.updateInfoBlockOrder();
  }

  private updateInfoBlockOrder(): void {
    this.homeInfoBlocks.forEach((b, i) => b.order = i + 1);
  }

  addScientificParagraph(): void {
    const newId = this.scientificMeritParagraphs.length > 0
      ? Math.max(...this.scientificMeritParagraphs.map(p => p.id)) + 1
      : 1;
    this.scientificMeritParagraphs.push({
      id: newId,
      content: '',
      order: this.scientificMeritParagraphs.length + 1
    });
  }

  removeScientificParagraph(index: number): void {
    if (this.scientificMeritParagraphs.length <= 1) {
      this.scientificMeritParagraphs[0].content = '';
      return;
    }
    this.scientificMeritParagraphs.splice(index, 1);
    this.updateScientificOrder();
  }

  moveScientificParagraph(index: number, direction: 'up' | 'down'): void {
    if (direction === 'up' && index > 0) {
      [this.scientificMeritParagraphs[index], this.scientificMeritParagraphs[index - 1]] = [this.scientificMeritParagraphs[index - 1], this.scientificMeritParagraphs[index]];
    } else if (direction === 'down' && index < this.scientificMeritParagraphs.length - 1) {
      [this.scientificMeritParagraphs[index], this.scientificMeritParagraphs[index + 1]] = [this.scientificMeritParagraphs[index + 1], this.scientificMeritParagraphs[index]];
    }
    this.updateScientificOrder();
  }

  private updateScientificOrder(): void {
    this.scientificMeritParagraphs.forEach((p, i) => p.order = i + 1);
  }

  saveScientificMerit(): void {
    console.log('Saving Scientific Merit:', this.scientificMeritParagraphs);
    // Backend implementation would go here
  }

  execCommand(command: string, value: string = ''): void {
    document.execCommand(command, false, value);
  }

  toggleSpecialCharPicker(event: MouseEvent, index: number, tab: string): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.specialCharPickerOpen === index && this.specialCharPickerTab === tab) {
      this.closeSpecialCharPicker();
      return;
    }

    this.specialCharPickerOpen = index;
    this.specialCharPickerTab = tab;

    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      this.specialCharPickerStyle = {};
      return;
    }

    const rect = target.getBoundingClientRect();

    const pickerWidth = 420;
    const pickerHeight = 380;
    const margin = 8;

    const maxLeft = Math.max(margin, window.innerWidth - pickerWidth - margin);
    const left = Math.min(Math.max(margin, rect.left), maxLeft);

    const maxTop = Math.max(margin, window.innerHeight - pickerHeight - margin);
    let top = rect.bottom + margin;
    if (top > maxTop) {
      top = Math.max(margin, rect.top - pickerHeight - margin);
    }

    this.specialCharPickerStyle = {
      left: `${left}px`,
      top: `${top}px`
    };
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.specialCharPickerOpen === -1) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (!target) {
      this.closeSpecialCharPicker();
      return;
    }
    if (target.closest('.special-char-picker') || target.closest('.special-char-btn')) {
      return;
    }
    this.closeSpecialCharPicker();
  }

  insertSpecialChar(char: string): void {
    if (this.lastFocusedEditor) {
      this.lastFocusedEditor.focus();
      document.execCommand('insertText', false, char);
    } else {
      // Fallback: insert into the currently open picker's editor
      const prefix = this.specialCharPickerTab === 'objectives' ? 'obj-' : 'p-';
      const editor = document.getElementById(prefix + this.specialCharPickerOpen);
      if (editor) {
        editor.focus();
        document.execCommand('insertText', false, char);
      }
    }
    // Sync content
    this.syncEditorContent(this.specialCharPickerOpen, this.specialCharPickerTab);
  }

  onEditorFocus(event: FocusEvent): void {
    this.lastFocusedEditor = event.target as HTMLElement;
  }

  private syncEditorContent(index: number, tab: string): void {
    const prefix = tab === 'objectives' ? 'obj-' : 'p-';
    const editor = document.getElementById(prefix + index);
    if (editor) {
      if (tab === 'objectives') {
        this.objectivesParagraphs[index].content = editor.innerHTML;
      } else {
        this.scientificMeritParagraphs[index].content = editor.innerHTML;
      }
    }
  }

  closeSpecialCharPicker(): void {
    this.specialCharPickerOpen = -1;
    this.specialCharPickerTab = '';
    this.specialCharPickerStyle = {};
  }

  onFontSizeChange(event: any): void {
    const size = event.target.value;
    if (size) {
      this.execCommand('fontSize', size);
    }
  }

  onContentInput(event: any, index: number, tab: string = 'scientific'): void {
    if (tab === 'scientific') {
      this.scientificMeritParagraphs[index].content = event.target.innerHTML;
    } else if (tab === 'objectives') {
      this.objectivesParagraphs[index].content = event.target.innerHTML;
    }
    this.lastFocusedEditor = event.target as HTMLElement;
  }

  addObjectivesParagraph(): void {
    const newId = this.objectivesParagraphs.length > 0
      ? Math.max(...this.objectivesParagraphs.map(p => p.id)) + 1
      : 1;
    this.objectivesParagraphs.push({
      id: newId,
      content: '',
      order: this.objectivesParagraphs.length + 1
    });
  }

  removeObjectivesParagraph(index: number): void {
    if (this.objectivesParagraphs.length <= 1) {
      this.objectivesParagraphs[0].content = '';
      return;
    }
    this.objectivesParagraphs.splice(index, 1);
    this.updateObjectivesOrder();
  }

  moveObjectivesParagraph(index: number, direction: 'up' | 'down'): void {
    if (direction === 'up' && index > 0) {
      [this.objectivesParagraphs[index], this.objectivesParagraphs[index - 1]] = [this.objectivesParagraphs[index - 1], this.objectivesParagraphs[index]];
    } else if (direction === 'down' && index < this.objectivesParagraphs.length - 1) {
      [this.objectivesParagraphs[index], this.objectivesParagraphs[index + 1]] = [this.objectivesParagraphs[index + 1], this.objectivesParagraphs[index]];
    }
    this.updateObjectivesOrder();
  }

  private updateObjectivesOrder(): void {
    this.objectivesParagraphs.forEach((p, i) => p.order = i + 1);
  }

  saveObjectives(): void {
    console.log('Saving Objectives:', this.objectivesParagraphs);
  }

  onPartnersLogoSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.partnersLogos[index].url = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  addPartnersLogo(): void {
    const newId = this.partnersLogos.length > 0
      ? Math.max(...this.partnersLogos.map(l => l.id)) + 1
      : 1;
    this.partnersLogos.push({ id: newId, url: '', order: this.partnersLogos.length + 1 });
  }

  removePartnersLogo(index: number): void {
    if (this.partnersLogos.length <= 1) {
      this.partnersLogos[0].url = '';
      return;
    }
    this.partnersLogos.splice(index, 1);
    this.updatePartnersLogoOrder();
  }

  movePartnersLogo(index: number, direction: 'left' | 'right'): void {
    if (direction === 'left' && index > 0) {
      [this.partnersLogos[index], this.partnersLogos[index - 1]] = [this.partnersLogos[index - 1], this.partnersLogos[index]];
    } else if (direction === 'right' && index < this.partnersLogos.length - 1) {
      [this.partnersLogos[index], this.partnersLogos[index + 1]] = [this.partnersLogos[index + 1], this.partnersLogos[index]];
    }
    this.updatePartnersLogoOrder();
  }

  private updatePartnersLogoOrder(): void {
    this.partnersLogos.forEach((l, i) => l.order = i + 1);
  }

  addFunderLine(): void {
    const newId = this.funderTextLines.length > 0
      ? Math.max(...this.funderTextLines.map(l => l.id)) + 1
      : 1;
    this.funderTextLines.push({ id: newId, text: '', order: this.funderTextLines.length + 1 });
  }

  removeFunderLine(index: number): void {
    if (this.funderTextLines.length <= 1) {
      this.funderTextLines[0].text = '';
      return;
    }
    this.funderTextLines.splice(index, 1);
    this.updateFunderLineOrder();
  }

  moveFunderLine(index: number, direction: 'up' | 'down'): void {
    if (direction === 'up' && index > 0) {
      [this.funderTextLines[index], this.funderTextLines[index - 1]] = [this.funderTextLines[index - 1], this.funderTextLines[index]];
    } else if (direction === 'down' && index < this.funderTextLines.length - 1) {
      [this.funderTextLines[index], this.funderTextLines[index + 1]] = [this.funderTextLines[index + 1], this.funderTextLines[index]];
    }
    this.updateFunderLineOrder();
  }

  private updateFunderLineOrder(): void {
    this.funderTextLines.forEach((l, i) => l.order = i + 1);
  }

  onFunderLogoSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.funderLogos[index].url = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  addFunderLogo(): void {
    const newId = this.funderLogos.length > 0
      ? Math.max(...this.funderLogos.map(l => l.id)) + 1
      : 1;
    this.funderLogos.push({ id: newId, url: '', order: this.funderLogos.length + 1 });
  }

  removeFunderLogo(index: number): void {
    if (this.funderLogos.length <= 1) {
      this.funderLogos[0].url = '';
      return;
    }
    this.funderLogos.splice(index, 1);
    this.updateFunderLogoOrder();
  }

  moveFunderLogo(index: number, direction: 'left' | 'right'): void {
    if (direction === 'left' && index > 0) {
      [this.funderLogos[index], this.funderLogos[index - 1]] = [this.funderLogos[index - 1], this.funderLogos[index]];
    } else if (direction === 'right' && index < this.funderLogos.length - 1) {
      [this.funderLogos[index], this.funderLogos[index + 1]] = [this.funderLogos[index + 1], this.funderLogos[index]];
    }
    this.updateFunderLogoOrder();
  }

  private updateFunderLogoOrder(): void {
    this.funderLogos.forEach((l, i) => l.order = i + 1);
  }

  savePartnersFunders(): void {
    console.log('Saving Partners & Funders:', {
      partnersLogos: this.partnersLogos,
      funderTextLines: this.funderTextLines,
      funderLogos: this.funderLogos
    });
  }

  addImage(): void {
    const newId = this.homeImages.length > 0 
      ? Math.max(...this.homeImages.map(img => img.id)) + 1 
      : 1;
    this.homeImages.push({
      id: newId,
      url: '',
      title: '',
      subtitle: '',
      order: this.homeImages.length + 1,
      expanded: true
    });
  }

  toggleExpand(index: number): void {
    this.homeImages[index].expanded = !this.homeImages[index].expanded;
  }

  removeImage(index: number): void {
    this.homeImages.splice(index, 1);
    this.updateImageOrder();
  }

  moveImage(index: number, direction: 'up' | 'down'): void {
    if (direction === 'up' && index > 0) {
      [this.homeImages[index], this.homeImages[index - 1]] = [this.homeImages[index - 1], this.homeImages[index]];
    } else if (direction === 'down' && index < this.homeImages.length - 1) {
      [this.homeImages[index], this.homeImages[index + 1]] = [this.homeImages[index + 1], this.homeImages[index]];
    }
    this.updateImageOrder();
  }

  private updateImageOrder(): void {
    this.homeImages.forEach((img, i) => img.order = i + 1);
  }

  saveHomeConfig(): void {
    console.log('Saving home configuration:', {
      carousel: this.homeImages,
      partnerLogos: this.homePartnerLogos,
      geoAnalysis: this.homeGeoSections,
      video: this.homeVideoFile,
      infoBlocks: this.homeInfoBlocks
    });
    // Implementation for saving to backend would go here
  }
}
