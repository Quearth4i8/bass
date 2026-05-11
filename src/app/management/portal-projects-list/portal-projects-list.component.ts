import { Component, OnInit } from '@angular/core';
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
