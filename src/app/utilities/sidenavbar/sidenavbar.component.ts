import { Component } from '@angular/core';
import { SidebarService } from 'src/app/services/sidebarservice';

@Component({
  selector: 'app-sidenavbar',
  templateUrl: 'sidenavbar.component.html',
  styleUrls: ['sidenavbar.component.scss'],
  
})
export class SidenavbarComponent {
  isSidebarVisible = true;
  isSubmenuOpen = false;
  isDashboardSelected = false;


  constructor(private sidebarService: SidebarService) {}

  ngOnInit() {
    this.sidebarService.sidebarVisibility$.subscribe((isVisible) => {
      console.log(isVisible)
      this.isSidebarVisible = isVisible;
    });
  }

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
    this.sidebarService.toggleSidebar(); // Toggle sidebar state
  }


  toggleSubmenu() {
    this.isSubmenuOpen = !this.isSubmenuOpen;
  }


  selectDashboard() {
    this.isDashboardSelected = true;
  }
}
