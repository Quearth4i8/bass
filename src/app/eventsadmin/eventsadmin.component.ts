import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarService } from '../services/sidebarservice';
import { AuthService } from '../services/AuthService';
import { MessageService } from 'primeng/api';
import { ProjectService } from '../services/ProjectService';

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  projectId?: number;
  projectName?: string;
}

interface Project {
  id: number;
  title: string;
  acronyme?: string;
}

@Component({
  selector: 'app-eventsadmin',
  templateUrl: 'eventsadmin.component.html',
  styleUrls: ['eventsadmin.component.scss']
})
export class EventsadminComponent implements OnInit {

  isSidebarVisible = true;
  logoutModalVisible = false;
  isUserMenuOpen = false;
  eventDialogVisible = false;
  editingEvent = false;
  showAdvancedFilters = false;
  globalSearchTerm = '';

  // Filter fields
  filterTitle = '';
  filterLocation = '';
  filterDateFrom = '';
  filterDateTo = '';
  sortBy = 'date';

  // Events data
  events: CalendarEvent[] = [];
  filteredEvents: CalendarEvent[] = [];

  // Projects for dropdown
  projects: Project[] = [];

  // Current event for add/edit
  currentEvent: CalendarEvent = {
    id: 0,
    title: '',
    date: '',
    time: '',
    location: '',
    description: ''
  };

  constructor(
    private sidebarService: SidebarService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    private projectService: ProjectService
  ) { }

  ngOnInit(): void {
    // Check authentication
    if (!this.authService.isAuthenticated() || !this.authService.isAdmin()) {
      this.router.navigate(['/projects'], { replaceUrl: true });
      return;
    }

    this.sidebarService.sidebarVisibility$.subscribe((isVisible) => {
      this.isSidebarVisible = isVisible;
    });

    // Load sample events (replace with API call)
    this.loadSampleEvents();
    this.loadProjects();
    this.applyFilters();
  }

  // Sample data - replace with actual API calls
  private loadSampleEvents(): void {
    this.events = [
      {
        id: 1,
        title: 'Annual Conference 2026',
        date: '2026-03-15',
        time: '09:00',
        location: 'Tunis Convention Center',
        description: 'Annual gathering of all stakeholders',
        projectId: 1,
        projectName: 'Bassiana Project'
      },
      {
        id: 2,
        title: 'Workshop: Water Management',
        date: '2026-02-20',
        time: '14:00',
        location: 'Ichkeul National Park',
        description: 'Technical workshop on sustainable water practices',
        projectId: 2,
        projectName: 'Water Conservation'
      },
      {
        id: 3,
        title: 'Project Review Meeting',
        date: '2025-12-10',
        time: '10:00',
        location: 'Virtual Meeting',
        description: 'Quarterly review of ongoing projects',
        projectId: 1,
        projectName: 'Bassiana Project'
      }
    ];
  }

  private loadProjects(): void {
    // Load projects from service
    this.projectService.getAllProjects().subscribe(
      (data: any[]) => {
        this.projects = data.map(p => ({
          id: p.id,
          title: p.titreproj || p.title || 'Unnamed Project',
          acronyme: p.acronyme
        }));
      },
      (error) => {
        console.error('Error loading projects:', error);
        // Fallback sample projects
        this.projects = [
          { id: 1, title: 'Bassiana Project', acronyme: 'BP' },
          { id: 2, title: 'Water Conservation', acronyme: 'WC' },
          { id: 3, title: 'Sustainable Agriculture', acronyme: 'SA' }
        ];
      }
    );
  }

  getProjectName(projectId?: number): string {
    if (!projectId) return 'General';
    const project = this.projects.find(p => p.id === projectId);
    return project ? (project.acronyme || project.title) : 'Unknown';
  }

  get upcomingEvents(): number {
    const today = new Date();
    return this.events.filter(e => new Date(e.date) >= today).length;
  }

  get pastEvents(): number {
    const today = new Date();
    return this.events.filter(e => new Date(e.date) < today).length;
  }

  isUpcoming(date: string): boolean {
    return new Date(date) >= new Date();
  }

  // Search and filter
  onGlobalSearch(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    this.globalSearchTerm = input.value;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.events];

    // Global search
    if (this.globalSearchTerm) {
      const term = this.globalSearchTerm.toLowerCase();
      result = result.filter(e => 
        (e.title?.toLowerCase().includes(term)) ||
        (e.location?.toLowerCase().includes(term)) ||
        (e.description?.toLowerCase().includes(term))
      );
    }

    // Title filter
    if (this.filterTitle) {
      result = result.filter(e => e.title?.toLowerCase().includes(this.filterTitle.toLowerCase()));
    }

    // Location filter
    if (this.filterLocation) {
      result = result.filter(e => e.location?.toLowerCase().includes(this.filterLocation.toLowerCase()));
    }

    // Date range filter
    if (this.filterDateFrom) {
      result = result.filter(e => e.date >= this.filterDateFrom);
    }
    if (this.filterDateTo) {
      result = result.filter(e => e.date <= this.filterDateTo);
    }

    // Sort
    result.sort((a, b) => {
      switch (this.sortBy) {
        case 'date':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'location':
          return (a.location || '').localeCompare(b.location || '');
        default:
          return 0;
      }
    });

    this.filteredEvents = result;
  }

  // Dialog methods
  showAddDialog(): void {
    this.editingEvent = false;
    this.currentEvent = {
      id: 0,
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      location: '',
      description: '',
      projectId: undefined,
      projectName: ''
    };
    this.eventDialogVisible = true;
  }

  onProjectChange(): void {
    const selectedProject = this.projects.find(p => p.id === this.currentEvent.projectId);
    this.currentEvent.projectName = selectedProject ? selectedProject.title : '';
  }

  showEditDialog(calendarEvent: CalendarEvent): void {
    this.editingEvent = true;
    this.currentEvent = { ...calendarEvent };
    this.eventDialogVisible = true;
  }

  closeEventDialog(): void {
    this.eventDialogVisible = false;
  }

  onEventOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeEventDialog();
    }
  }

  saveEvent(): void {
    // Validation
    if (!this.currentEvent.title || !this.currentEvent.date) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Title and date are required'
      });
      return;
    }

    if (this.editingEvent) {
      // Update existing event
      const index = this.events.findIndex(e => e.id === this.currentEvent.id);
      if (index !== -1) {
        this.events[index] = { ...this.currentEvent };
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Event updated successfully'
        });
      }
    } else {
      // Add new event
      const newId = Math.max(...this.events.map(e => e.id), 0) + 1;
      this.events.push({
        ...this.currentEvent,
        id: newId
      });
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Event added successfully'
      });
    }

    this.applyFilters();
    this.closeEventDialog();
  }

  confirmDelete(eventId: number): void {
    if (confirm('Are you sure you want to delete this event?')) {
      this.deleteEvent(eventId);
    }
  }

  deleteEvent(eventId: number): void {
    this.events = this.events.filter(e => e.id !== eventId);
    this.applyFilters();
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Event deleted successfully'
    });
  }

  // Sidebar and menu
  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  // Logout methods
  showLogoutModal(evt?: MouseEvent): void {
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }
    this.logoutModalVisible = true;
    this.isUserMenuOpen = false;
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
}
