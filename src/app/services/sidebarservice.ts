import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/** Below this width the sidebar is an overlay drawer, not a column. */
export const SIDEBAR_DRAWER_MAX = 1024;

const isDrawer = () => typeof window !== 'undefined' && window.innerWidth <= SIDEBAR_DRAWER_MAX;

@Injectable({
  providedIn: 'root',
})
export class SidebarService {

  // Open on desktop; closed on phones/tablets, where it would cover the page.
  private sidebarVisibilitySubject = new BehaviorSubject<boolean>(!isDrawer());
  sidebarVisibility$ = this.sidebarVisibilitySubject.asObservable();

  toggleSidebar() {
    this.sidebarVisibilitySubject.next(!this.sidebarVisibilitySubject.value);
  }

  /** After picking a page from the drawer, get it out of the way. */
  closeIfDrawer() {
    if (isDrawer() && this.sidebarVisibilitySubject.value) this.sidebarVisibilitySubject.next(false);
  }
}
