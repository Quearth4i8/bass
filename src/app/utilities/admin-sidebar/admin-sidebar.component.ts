import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarService } from '../../services/sidebarservice';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss'],
})
export class AdminSidebarComponent {
  @Input() collapsed = false;
  private sidebar = inject(SidebarService);

  /** On phones the sidebar is a drawer over the page: close it once a link is picked. */
  onNavClick(e: Event): void {
    if ((e.target as HTMLElement).closest('a')) this.sidebar.closeIfDrawer();
  }
}
