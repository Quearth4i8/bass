import { Component, HostListener, OnInit, DestroyRef, HostBinding } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarService } from '../../services/sidebarservice';
import { ThemeService } from '../../services/ThemeService';
import { Router, ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

import { PortalProjectsService } from '../../portal/services/portal-projects.service';
import { PortalMediaService } from '../../portal/services/portal-media.service';
import { PortalProjectContent } from '../../portal/models/portal-project.model';

@Component({
  selector: 'app-portal-projects-list',
  templateUrl: 'portal-projects-list.component.html',
  styleUrls: ['portal-projects-list.component.scss']
})
export class PortalProjectsListComponent implements OnInit {
  @HostBinding('class.theme-light') get isLight() { return this.themeService.isLight; }
  isSidebarVisible = true;

  projectSlug: string = '';
  projectName = '';
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

  homeProjectId = '';

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

  associatePartnersLogos: any[] = [];

  funderTextLines: any[] = [
    { id: 1, text: 'NAS: The National Academy of Sciences', order: 1 },
    { id: 2, text: 'USAID: United States Agency for International Development, USA', order: 2 },
    { id: 3, text: 'AID-OAA-A-11-00012', order: 3 }
  ];

  funderLogos: any[] = [
    { id: 1, url: '', order: 1 }
  ];

  galleryImages: any[] = [];

  galleryViewerOpen = false;
  galleryViewerIndex = 0;
  galleryZoom = 1;

  teamSections: any[] = [
    {
      id: 1,
      title: 'Principal Investigators',
      members: [
        { id: 1, name: 'Dr. Jane Smith', role: 'Project Coordinator', image: '', order: 1 }
      ],
      order: 1
    }
  ];

  participants: any[] = [
    { id: 1, name: 'John Doe', role: 'Data Specialist', image: '', order: 1 }
  ];

  outputs: any[] = [];

  totalProjectsCount = 0;
  activeProjectsCount = 0;

  events: any[] = [
    { id: 1, title: 'International Workshop on Wetland Conservation', organiser: 'BASS Team', startDate: '2020-11-22', endDate: '2020-11-23', location: 'Ichkeul National Park, Tunisia', presentation: 'Main presentation on wetland management', speaker: 'Dr. Smith', participants: 'Local experts, researchers', status: 'finished' }
  ];

  uploadingHomeVideo = false;
  uploadingOutputVideo: number = -1;

  openEventStatusDropdown: number = -1;
  openOutputLayoutDropdown: number = -1;
  openFontSizeDropdown: number = -1;
  openFontSizeTab: string = '';
  openLineSpacingDropdown: number = -1;
  openLineSpacingTab: string = '';
  dropdownMenuStyle: { [key: string]: string } = {};
  dropdownOpensUp: boolean = false;

  specialCharPickerOpen: number = -1;
  specialCharPickerTab: string = '';
  specialCharPickerStyle: { [key: string]: string } = {};

  highlightPickerOpen: number = -1;
  highlightPickerTab: string = '';
  highlightPickerStyle: { [key: string]: string } = {};
  highlightColors = [
    { color: '#FFFF00', label: 'Yellow' },
    { color: '#90EE90', label: 'Green' },
    { color: '#ADD8E6', label: 'Light Blue' },
    { color: '#FFB6C1', label: 'Pink' },
    { color: '#FFA500', label: 'Orange' },
    { color: '#D3D3D3', label: 'Gray' },
  ];

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

  outputLayoutOptions = [
    { value: 'text-left', label: 'Text left · video right' },
    { value: 'text-right', label: 'Video left · text right' },
  ];

  tabs = [
    { id: 'home', label: 'Home', icon: 'bx-home-alt' },
    { id: 'scientific-merit', label: 'Scientific Merit', icon: 'bx-analyse' },
    { id: 'objectives', label: 'Objectives', icon: 'bx-target-lock' },
    { id: 'partners-funder', label: 'Partners & Funder', icon: 'bx-building-house' },
    { id: 'gallery', label: 'Gallery', icon: 'bx-images' },
    { id: 'events', label: 'Events', icon: 'bx-calendar' },
    { id: 'team', label: 'Team', icon: 'bx-group' },
    { id: 'participants', label: 'Participants', icon: 'bx-user-voice' },
    { id: 'outputs', label: 'Outputs', icon: 'bx-video' }
  ];

  constructor(
    private sidebarService: SidebarService,
    private router: Router,
    private route: ActivatedRoute,
    private portalProjectsService: PortalProjectsService,
    private portalMediaService: PortalMediaService,
    private destroyRef: DestroyRef,
    private messageService: MessageService,
    public themeService: ThemeService,
  ) { }

  ngOnInit(): void {
    this.sidebarService.sidebarVisibility$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isVisible: boolean) => {
        this.isSidebarVisible = isVisible;
      });

    this.portalProjectsService.allProjects$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projects) => {
        this.totalProjectsCount = projects.length;
        this.activeProjectsCount = projects.filter(p => p.isActive).length;
      });

    combineLatest([
      this.route.paramMap.pipe(
        map((m) => m.get('slug')),
        filter((slug): slug is string => !!slug),
        distinctUntilChanged(),
      ),
      this.portalProjectsService.allProjects$,
    ])
      .pipe(
        switchMap(([slug]) => {
          this.projectSlug = slug;
          return this.portalProjectsService.getBySlug(slug);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((project) => {
        if (!project) {
          return;
        }
        this.projectName = project.title;
        this.applyContent(project.content);
      });

    this.route.queryParamMap
      .pipe(
        map((m) => m.get('tab')),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((tab) => {
        this.activeTab = tab || 'home';
      });
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
    this.sidebarService.toggleSidebar();
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
    const file: File | undefined = event.target.files[0];
    if (!file) return;
    this.uploadingHomeVideo = true;
    this.homeVideoFile.name = file.name;
    this.portalMediaService.uploadFile(file).subscribe({
      next: (url) => {
        this.homeVideoFile.url = url;
        this.uploadingHomeVideo = false;
      },
      error: () => {
        this.uploadingHomeVideo = false;
        this.messageService.add({ severity: 'error', summary: 'Upload failed', detail: 'Could not upload video. Check file size and try again.' });
      },
    });
    event.target.value = '';
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
    this.saveAll();
  }

  execCommand(command: string, value: string = ''): void {
    document.execCommand(command, false, value);
    this.syncActiveRichEditorFromDom();
  }

  /** Keeps paragraph model in sync when execCommand does not fire an `input` event. */
  private syncActiveRichEditorFromDom(): void {
    const el = this.lastFocusedEditor;
    if (!el?.id) {
      return;
    }
    const id = el.id;
    if (id.startsWith('obj-')) {
      const i = +id.slice(4);
      if (!Number.isNaN(i) && this.objectivesParagraphs[i]) {
        this.objectivesParagraphs[i].content = el.innerHTML;
      }
    } else if (id.startsWith('p-')) {
      const i = +id.slice(2);
      if (!Number.isNaN(i) && this.scientificMeritParagraphs[i]) {
        this.scientificMeritParagraphs[i].content = el.innerHTML;
      }
    }
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
    const target = event.target as HTMLElement | null;
    if (!target) {
      this.closeSpecialCharPicker();
      this.closeDropdowns();
      return;
    }

    if (this.specialCharPickerOpen !== -1) {
      if (!target.closest('.special-char-picker') && !target.closest('.special-char-btn')) {
        this.closeSpecialCharPicker();
      }
    }

    if (this.highlightPickerOpen !== -1) {
      if (!target.closest('.highlight-picker') && !target.closest('.highlight-btn')) {
        this.closeHighlightPicker();
      }
    }

    if (
      target.closest('.custom-dropdown-menu') ||
      target.closest('.custom-select-trigger') ||
      target.closest('.output-layout-select')
    ) {
      return;
    }

    this.closeDropdowns();
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.galleryViewerOpen) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeGalleryViewer();
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prevGalleryImage();
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextGalleryImage();
      return;
    }
    if (event.key === '+' || event.key === '=' ) {
      event.preventDefault();
      this.zoomInGallery();
      return;
    }
    if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      this.zoomOutGallery();
      return;
    }
    if (event.key.toLowerCase() === '0') {
      event.preventDefault();
      this.resetGalleryZoom();
      return;
    }
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

  onRichHtmlChange(html: string, index: number, tab: 'scientific' | 'objectives'): void {
    if (tab === 'scientific') {
      this.scientificMeritParagraphs[index].content = html;
    } else {
      this.objectivesParagraphs[index].content = html;
    }
    const id = tab === 'objectives' ? 'obj-' + index : 'p-' + index;
    this.lastFocusedEditor = document.getElementById(id) as HTMLElement;
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
    this.saveAll();
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

  onAssociatePartnersLogoSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => { this.associatePartnersLogos[index].url = e.target.result; };
      reader.readAsDataURL(file);
    }
  }

  addAssociatePartnersLogo(): void {
    const newId = this.associatePartnersLogos.length > 0
      ? Math.max(...this.associatePartnersLogos.map(l => l.id)) + 1
      : 1;
    this.associatePartnersLogos.push({ id: newId, url: '', order: this.associatePartnersLogos.length + 1 });
  }

  removeAssociatePartnersLogo(index: number): void {
    if (this.associatePartnersLogos.length <= 1) {
      this.associatePartnersLogos[0].url = '';
      return;
    }
    this.associatePartnersLogos.splice(index, 1);
    this.updateAssociatePartnersLogoOrder();
  }

  moveAssociatePartnersLogo(index: number, direction: 'left' | 'right'): void {
    if (direction === 'left' && index > 0) {
      [this.associatePartnersLogos[index], this.associatePartnersLogos[index - 1]] = [this.associatePartnersLogos[index - 1], this.associatePartnersLogos[index]];
    } else if (direction === 'right' && index < this.associatePartnersLogos.length - 1) {
      [this.associatePartnersLogos[index], this.associatePartnersLogos[index + 1]] = [this.associatePartnersLogos[index + 1], this.associatePartnersLogos[index]];
    }
    this.updateAssociatePartnersLogoOrder();
  }

  private updateAssociatePartnersLogoOrder(): void {
    this.associatePartnersLogos.forEach((l, i) => l.order = i + 1);
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
    this.saveAll();
  }

  onGalleryImagesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const newId = this.galleryImages.length > 0
          ? Math.max(...this.galleryImages.map(img => img.id)) + 1
          : 1;
        this.galleryImages.push({
          id: newId,
          url: e.target.result,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    });

    // allow selecting the same file again
    event.target.value = '';
  }

  removeGalleryImage(index: number): void {
    this.galleryImages.splice(index, 1);
  }

  openGalleryViewer(index: number): void {
    if (!this.galleryImages || this.galleryImages.length === 0) {
      return;
    }
    this.galleryViewerIndex = Math.max(0, Math.min(index, this.galleryImages.length - 1));
    this.galleryViewerOpen = true;
    this.galleryZoom = 1;
  }

  closeGalleryViewer(): void {
    this.galleryViewerOpen = false;
    this.galleryZoom = 1;
  }

  prevGalleryImage(): void {
    if (!this.galleryImages || this.galleryImages.length === 0) {
      return;
    }
    this.galleryViewerIndex = (this.galleryViewerIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
    this.galleryZoom = 1;
  }

  nextGalleryImage(): void {
    if (!this.galleryImages || this.galleryImages.length === 0) {
      return;
    }
    this.galleryViewerIndex = (this.galleryViewerIndex + 1) % this.galleryImages.length;
    this.galleryZoom = 1;
  }

  zoomInGallery(): void {
    this.galleryZoom = Math.min(3, Math.round((this.galleryZoom + 0.25) * 100) / 100);
  }

  zoomOutGallery(): void {
    this.galleryZoom = Math.max(1, Math.round((this.galleryZoom - 0.25) * 100) / 100);
  }

  resetGalleryZoom(): void {
    this.galleryZoom = 1;
  }

  onGalleryViewerWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomInGallery();
    } else {
      this.zoomOutGallery();
    }
  }

  saveGallery(): void {
    this.saveAll();
  }

  addEvent(): void {
    const newId = this.events.length > 0
      ? Math.max(...this.events.map(e => e.id)) + 1
      : 1;
    this.events.push({
      id: newId,
      title: '',
      organiser: '',
      startDate: '',
      endDate: '',
      location: '',
      presentation: '',
      speaker: '',
      participants: '',
      status: 'ongoing'
    });
  }

  removeEvent(index: number): void {
    this.events.splice(index, 1);
  }

  moveEvent(index: number, direction: 'up' | 'down'): void {
    if (direction === 'up' && index > 0) {
      [this.events[index], this.events[index - 1]] = [this.events[index - 1], this.events[index]];
    } else if (direction === 'down' && index < this.events.length - 1) {
      [this.events[index], this.events[index + 1]] = [this.events[index + 1], this.events[index]];
    }
  }

  getEventDay(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  }

  formatEventDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  saveEvents(): void {
    this.saveAll();
  }

  toggleOutputLayoutDropdown(event: MouseEvent, index: number): void {
    event.stopPropagation();
    if (this.openOutputLayoutDropdown === index) {
      this.closeDropdowns();
      return;
    }
    this.closeDropdowns();
    this.openOutputLayoutDropdown = index;
    this.computeDropdownPosition(event);
  }

  selectOutputLayout(layout: string, index: number): void {
    this.outputs[index].layout = layout;
    this.closeDropdowns();
  }

  getOutputLayoutLabel(layout: string): string {
    return this.outputLayoutOptions.find(o => o.value === layout)?.label ?? 'Text left · video right';
  }

  toggleEventStatusDropdown(event: MouseEvent, index: number): void {
    event.stopPropagation();
    if (this.openEventStatusDropdown === index) {
      this.closeDropdowns();
      return;
    }
    this.closeDropdowns();
    this.openEventStatusDropdown = index;
    this.computeDropdownPosition(event);
  }

  selectEventStatus(status: string, index: number): void {
    this.events[index].status = status;
    this.closeDropdowns();
  }

  toggleLineSpacingDropdown(event: MouseEvent, index: number, tab: string): void {
    event.stopPropagation();
    if (this.openLineSpacingDropdown === index && this.openLineSpacingTab === tab) {
      this.closeDropdowns();
      return;
    }
    this.closeDropdowns();
    this.openLineSpacingDropdown = index;
    this.openLineSpacingTab = tab;
    this.computeDropdownPosition(event);
  }

  selectLineSpacing(spacing: string): void {
    if (this.lastFocusedEditor) {
      this.lastFocusedEditor.focus();
    }
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        const span = document.createElement('span');
        span.style.lineHeight = spacing;
        try {
          range.surroundContents(span);
        } catch {
          const fragment = range.extractContents();
          span.appendChild(fragment);
          range.insertNode(span);
        }
      } else if (this.lastFocusedEditor) {
        this.lastFocusedEditor.style.lineHeight = spacing;
      }
    } else if (this.lastFocusedEditor) {
      this.lastFocusedEditor.style.lineHeight = spacing;
    }
    this.syncActiveRichEditorFromDom();
    this.closeDropdowns();
  }

  toggleHighlightPicker(event: MouseEvent, index: number, tab: string): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.highlightPickerOpen === index && this.highlightPickerTab === tab) {
      this.closeHighlightPicker();
      return;
    }
    this.highlightPickerOpen = index;
    this.highlightPickerTab = tab;
    const target = event.currentTarget as HTMLElement | null;
    if (!target) { this.highlightPickerStyle = {}; return; }
    const rect = target.getBoundingClientRect();
    const pickerWidth = 230;
    const pickerHeight = 110;
    const margin = 8;
    const maxLeft = Math.max(margin, window.innerWidth - pickerWidth - margin);
    const left = Math.min(Math.max(margin, rect.left), maxLeft);
    let top = rect.bottom + margin;
    if (top > window.innerHeight - pickerHeight - margin) {
      top = Math.max(margin, rect.top - pickerHeight - margin);
    }
    this.highlightPickerStyle = { left: `${left}px`, top: `${top}px` };
  }

  applyHighlight(color: string): void {
    if (this.lastFocusedEditor) {
      this.lastFocusedEditor.focus();
    }
    document.execCommand('hiliteColor', false, color);
    this.syncActiveRichEditorFromDom();
    this.closeHighlightPicker();
  }

  removeHighlight(): void {
    if (this.lastFocusedEditor) {
      this.lastFocusedEditor.focus();
    }
    document.execCommand('hiliteColor', false, 'transparent');
    this.syncActiveRichEditorFromDom();
    this.closeHighlightPicker();
  }

  closeHighlightPicker(): void {
    this.highlightPickerOpen = -1;
    this.highlightPickerTab = '';
    this.highlightPickerStyle = {};
  }

  toggleFontSizeDropdown(event: MouseEvent, index: number, tab: string): void {
    event.stopPropagation();
    if (this.openFontSizeDropdown === index && this.openFontSizeTab === tab) {
      this.closeDropdowns();
      return;
    }
    this.closeDropdowns();
    this.openFontSizeDropdown = index;
    this.openFontSizeTab = tab;
    this.computeDropdownPosition(event);
  }

  selectFontSize(size: string): void {
    if (size) {
      if (this.lastFocusedEditor) {
        this.lastFocusedEditor.focus();
      }
      this.execCommand('fontSize', size);
    }
    this.closeDropdowns();
  }

  private computeDropdownPosition(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const dropdownHeight = 150; // Estimated height
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    this.dropdownOpensUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
    
    this.dropdownMenuStyle = {
      position: 'fixed',
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: '10001'
    };

    if (this.dropdownOpensUp) {
      this.dropdownMenuStyle['bottom'] = `${window.innerHeight - rect.top + 5}px`;
    } else {
      this.dropdownMenuStyle['top'] = `${rect.bottom + 5}px`;
    }
  }

  closeDropdowns(): void {
    this.openEventStatusDropdown = -1;
    this.openOutputLayoutDropdown = -1;
    this.openFontSizeDropdown = -1;
    this.openFontSizeTab = '';
    this.openLineSpacingDropdown = -1;
    this.openLineSpacingTab = '';
    this.dropdownMenuStyle = {};
  }

  addTeamSection(): void {
    const newId = this.teamSections.length > 0
      ? Math.max(...this.teamSections.map(s => s.id)) + 1
      : 1;
    this.teamSections.push({
      id: newId,
      title: '',
      members: [],
      order: this.teamSections.length + 1
    });
  }

  removeTeamSection(index: number): void {
    this.teamSections.splice(index, 1);
    this.updateTeamSectionOrder();
  }

  moveTeamSection(index: number, direction: 'up' | 'down'): void {
    if (direction === 'up' && index > 0) {
      [this.teamSections[index], this.teamSections[index - 1]] = [this.teamSections[index - 1], this.teamSections[index]];
    } else if (direction === 'down' && index < this.teamSections.length - 1) {
      [this.teamSections[index], this.teamSections[index + 1]] = [this.teamSections[index + 1], this.teamSections[index]];
    }
    this.updateTeamSectionOrder();
  }

  private updateTeamSectionOrder(): void {
    this.teamSections.forEach((s, i) => s.order = i + 1);
  }

  addTeamMemberToSection(sectionIndex: number): void {
    const section = this.teamSections[sectionIndex];
    const newId = section.members.length > 0
      ? Math.max(...section.members.map((m: any) => m.id)) + 1
      : 1;
    section.members.push({
      id: newId,
      name: '',
      role: '',
      image: '',
      order: section.members.length + 1
    });
  }

  removeTeamMemberFromSection(sectionIndex: number, memberIndex: number): void {
    this.teamSections[sectionIndex].members.splice(memberIndex, 1);
    this.updateTeamMemberOrderInSection(sectionIndex);
  }

  moveTeamMemberInSection(sectionIndex: number, memberIndex: number, direction: 'up' | 'down'): void {
    const members = this.teamSections[sectionIndex].members;
    if (direction === 'up' && memberIndex > 0) {
      [members[memberIndex], members[memberIndex - 1]] = [members[memberIndex - 1], members[memberIndex]];
    } else if (direction === 'down' && memberIndex < members.length - 1) {
      [members[memberIndex], members[memberIndex + 1]] = [members[memberIndex + 1], members[memberIndex]];
    }
    this.updateTeamMemberOrderInSection(sectionIndex);
  }

  private updateTeamMemberOrderInSection(sectionIndex: number): void {
    this.teamSections[sectionIndex].members.forEach((m: any, i: number) => m.order = i + 1);
  }

  onTeamMemberImageSelected(event: any, sectionIndex: number, memberIndex: number): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.teamSections[sectionIndex].members[memberIndex].image = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveTeam(): void {
    this.saveAll();
  }

  addParticipant(): void {
    const newId = this.participants.length > 0
      ? Math.max(...this.participants.map(p => p.id)) + 1
      : 1;
    this.participants.push({
      id: newId,
      name: '',
      role: '',
      image: '',
      order: this.participants.length + 1
    });
  }

  removeParticipant(index: number): void {
    this.participants.splice(index, 1);
    this.updateParticipantOrder();
  }

  moveParticipant(index: number, direction: 'up' | 'down'): void {
    if (direction === 'up' && index > 0) {
      [this.participants[index], this.participants[index - 1]] = [this.participants[index - 1], this.participants[index]];
    } else if (direction === 'down' && index < this.participants.length - 1) {
      [this.participants[index], this.participants[index + 1]] = [this.participants[index + 1], this.participants[index]];
    }
    this.updateParticipantOrder();
  }

  private updateParticipantOrder(): void {
    this.participants.forEach((p, i) => p.order = i + 1);
  }

  onParticipantImageSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.participants[index].image = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveParticipants(): void {
    this.saveAll();
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
    this.saveAll();
  }

  addOutput(): void {
    const newId = this.outputs.length > 0 ? Math.max(...this.outputs.map(o => o.id)) + 1 : 1;
    const layout = this.outputs.length % 2 === 0 ? 'text-left' : 'text-right';
    this.outputs.push({
      id: newId,
      title: '',
      description: '',
      videoUrl: '',
      layout,
      order: this.outputs.length + 1
    });
  }

  removeOutput(index: number): void {
    this.outputs.splice(index, 1);
    this.updateOutputOrder();
  }

  moveOutput(index: number, direction: 'up' | 'down'): void {
    if (direction === 'up' && index > 0) {
      [this.outputs[index], this.outputs[index - 1]] = [this.outputs[index - 1], this.outputs[index]];
    } else if (direction === 'down' && index < this.outputs.length - 1) {
      [this.outputs[index], this.outputs[index + 1]] = [this.outputs[index + 1], this.outputs[index]];
    }
    this.updateOutputOrder();
  }

  private updateOutputOrder(): void {
    this.outputs.forEach((o, i) => o.order = i + 1);
  }

  onOutputVideoSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingOutputVideo = index;
    this.portalMediaService.uploadFile(file).subscribe({
      next: (url) => {
        this.outputs[index].videoUrl = url;
        this.uploadingOutputVideo = -1;
      },
      error: () => {
        this.uploadingOutputVideo = -1;
        this.messageService.add({ severity: 'error', summary: 'Upload failed', detail: 'Could not upload video. Check file size and try again.' });
      },
    });
    input.value = '';
  }

  saveOutputs(): void {
    this.saveAll();
  }

  private applyContent(content: PortalProjectContent): void {
    this.homeImages = content.home.carousel?.length ? content.home.carousel : this.homeImages;
    this.homePartnerLogos = content.home.partnerLogos?.length ? content.home.partnerLogos : this.homePartnerLogos;
    this.homeProjectId = content.home.projectId ?? '';
    this.homeGeoSections = content.home.geoSections?.length ? content.home.geoSections : this.homeGeoSections;
    this.homeVideoFile = content.home.video || this.homeVideoFile;
    this.homeInfoBlocks = content.home.infoBlocks?.length ? content.home.infoBlocks : this.homeInfoBlocks;

    this.scientificMeritParagraphs = content.scientificMerit.paragraphs?.length ? content.scientificMerit.paragraphs : this.scientificMeritParagraphs;
    this.objectivesParagraphs = content.objectives.paragraphs?.length ? content.objectives.paragraphs : this.objectivesParagraphs;

    this.partnersLogos = content.partnersFunders.partnersLogos?.length ? content.partnersFunders.partnersLogos : this.partnersLogos;
    this.associatePartnersLogos = content.partnersFunders.associatePartnersLogos ?? [];
    this.funderTextLines = content.partnersFunders.funderTextLines?.length ? content.partnersFunders.funderTextLines : this.funderTextLines;
    this.funderLogos = content.partnersFunders.funderLogos?.length ? content.partnersFunders.funderLogos : this.funderLogos;

    this.galleryImages = content.gallery.images || [];
    this.events = content.events.events || [];
    this.teamSections = content.team.sections || [];
    this.participants = content.participants.participants || [];
    this.outputs = content.outputs?.outputs || [];
  }

  private buildContent(): PortalProjectContent {
    return {
      home: {
        carousel: this.homeImages,
        partnerLogos: this.homePartnerLogos,
        projectId: this.homeProjectId,
        geoSections: this.homeGeoSections,
        video: this.homeVideoFile,
        infoBlocks: this.homeInfoBlocks,
      },
      scientificMerit: {
        paragraphs: this.scientificMeritParagraphs,
      },
      objectives: {
        paragraphs: this.objectivesParagraphs,
      },
      partnersFunders: {
        partnersLogos: this.partnersLogos,
        associatePartnersLogos: this.associatePartnersLogos,
        funderTextLines: this.funderTextLines,
        funderLogos: this.funderLogos,
      },
      gallery: {
        images: this.galleryImages,
      },
      events: {
        events: this.events,
      },
      team: {
        sections: this.teamSections,
      },
      participants: {
        participants: this.participants,
      },
      outputs: {
        outputs: this.outputs,
      },
    };
  }

  private saveAll(): void {
    if (!this.projectSlug) return;
    this.portalProjectsService.saveContent(this.projectSlug, this.buildContent()).subscribe({
      next: (res) => {
        if (res) {
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Success', 
            detail: 'Changes saved successfully',
            life: 3000
          });
        } else {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Failed to save changes' 
          });
        }
      },
      error: (err) => {
        console.error('Save error:', err);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'An error occurred while saving' 
        });
      }
    });
  }
}
