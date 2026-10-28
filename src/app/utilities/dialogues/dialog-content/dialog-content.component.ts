import { Component, OnInit, HostListener } from '@angular/core';
import { DynamicDialogRef, DialogService, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ProjectGroupService } from 'src/app/services/ProjectGroupService';
import { ThemeService } from 'src/app/services/ThemeService';
import { ProjectService } from 'src/app/services/ProjectService';
import { PROJECT_ROLES, roleLabel, statusLabel, statusTone } from 'src/app/utilities/project-labels';

@Component({
  selector: 'app-dialog-content',
  templateUrl: './dialog-content.component.html',
  styleUrls: ['./dialog-content.component.scss'],
})
export class DialogContentComponent implements OnInit {
  projectGroupTitles: string[] = [];
  readonly roles = PROJECT_ROLES;
  readonly statusLabel = statusLabel;
  readonly statusTone = statusTone;
  partenaireDropdownOpen: boolean = false;
  groupDropdownOpen: boolean = false;
  partenaireMenuStyle: { [key: string]: string } = {};
  groupMenuStyle: { [key: string]: string } = {};
  partenaireOpensUp: boolean = false;
  groupOpensUp: boolean = false;
  isEditMode: boolean = false;
  projectId: number | null = null;
  projectFormData: any = {
    responsable: '',
    partenaire: '',
    thematique: '',
    programme: '',
    titreproj: '',
    acronyme: '',
    startyear: '',
    endyear:'',
    startDate: '',
    endDate: '',
    budget: '',
    title: '',
    applicant: '',
    submissionDate: '',
    totalBudget: '',
  };

  constructor(
    private projectGroupService: ProjectGroupService,
    private projectService: ProjectService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.getProjectGroupTitles();
    // Check if editing existing project
    if (this.config.data && this.config.data.project) {
      this.isEditMode = true;
      this.projectId = this.config.data.project.id;
      this.projectFormData = { ...this.config.data.project };
    }
  }

  getProjectGroupTitles(): void {
    // In the brief's order: Ongoing, Achieved, Submitted, Rejected (others last).
    const rank = ['ONGOING', 'ACHIEVED', 'SUBMITTED', 'REJECTED'];
    const pos = (t: string) => {
      const i = rank.findIndex(r => (t || '').toUpperCase().includes(r));
      return i < 0 ? rank.length : i;
    };
    this.projectGroupService.getProjectGroupTitles().subscribe((titles) => {
      this.projectGroupTitles = [...titles].sort((a, b) => pos(a) - pos(b));
    });
  }

  /**
   * True while a save is in flight. A double-click (or Enter then a click)
   * would otherwise send the request twice: two "updated" toasts, or two
   * copies of a new project.
   */
  saving = false;

  onSubmit() {
    if (this.saving) return;
    this.saving = true;
    if (this.isEditMode && this.projectId) {
      // Update existing project
      const updatedProject = {
        responsable: this.projectFormData.responsable,
        partenaire: this.projectFormData.partenaire,
        thematique: this.projectFormData.thematique,
        programme: this.projectFormData.programme,
        titreproj: this.projectFormData.titreproj,
        acronyme: this.projectFormData.acronyme,
        budget: this.projectFormData.budget,
        title: this.projectFormData.title,
        ...this.datesPayload(),
        applicant: this.projectFormData.applicant || null,
        submissionDate: this.projectFormData.submissionDate || null,
        totalBudget: this.emptyToNull(this.projectFormData.totalBudget),
      };
      this.projectService.updateProject(this.projectId, updatedProject).subscribe(
        (response) => {
          console.log('Project updated successfully:', response);
          this.ref.close('success');
        },
        (error) => {
          console.error('Error updating project:', error);
          this.saving = false;
        }
      );
    } else {
      // Create new project
      // Optional fields left empty go up as null, not '' - the backend cannot
      // read an empty string as a date or a number.
      const created = {
        ...this.projectFormData,
        ...this.datesPayload(),
        applicant: this.projectFormData.applicant || null,
        submissionDate: this.projectFormData.submissionDate || null,
        totalBudget: this.emptyToNull(this.projectFormData.totalBudget),
      };
      this.projectService.createProject(created).subscribe(
        (response) => {
          console.log('Project created successfully:', response);
          this.ref.close('success');
        },
        (error) => {
          console.error('Error creating project:', error);
          this.saving = false;
        }
      );
    }
  }

  onDialogBodyScroll(): void {
    this.partenaireDropdownOpen = false;
    this.groupDropdownOpen = false;
    this.partenaireMenuStyle = {};
    this.groupMenuStyle = {};
  }

  private computeMenuStyleFromEvent(event: MouseEvent): { style: { [key: string]: string }, opensUp: boolean } {
    const eventTarget = event.target as HTMLElement | null;
    const trigger = (eventTarget?.closest('.dropdown-trigger') as HTMLElement | null) ?? (event.currentTarget as HTMLElement | null);
    if (!trigger) {
      return { style: {}, opensUp: false };
    }

    const triggerRect = trigger.getBoundingClientRect();
    const dialogEl = trigger.closest('.p-dialog') as HTMLElement | null;
    const dialogRect = dialogEl?.getBoundingClientRect();
    const dialogTransform = dialogEl ? getComputedStyle(dialogEl).transform : 'none';
    const isDialogTransformed = !!dialogEl && dialogTransform !== 'none';

    // If the dialog is transformed, `position: fixed` becomes relative to that element.
    // Otherwise it's relative to the viewport.
    const baseTop = isDialogTransformed && dialogRect ? dialogRect.top : 0;
    const baseLeft = isDialogTransformed && dialogRect ? dialogRect.left : 0;

    const left = triggerRect.left - baseLeft;

    const menuMaxHeight = 200;
    const containerTop = isDialogTransformed && dialogRect ? dialogRect.top : 0;
    const containerBottom = isDialogTransformed && dialogRect ? dialogRect.bottom : window.innerHeight;

    const spaceBelow = containerBottom - triggerRect.bottom;
    const spaceAbove = triggerRect.top - containerTop;

    const desiredMenuHeight = Math.min(menuMaxHeight, 44 * 5); // up to 5 items visible before scrolling
    const shouldOpenUp = spaceBelow < Math.min(desiredMenuHeight, 140) && spaceAbove > spaceBelow;
    // Opening upward, anchor the menu's bottom edge to the trigger's top rather
    // than placing its top at an assumed height: the real menu is usually
    // shorter than that guess, which left a gap and covered the fields above.
    if (shouldOpenUp) {
      const containerHeight = isDialogTransformed && dialogRect ? dialogRect.height : window.innerHeight;
      const bottom = containerHeight - (triggerRect.top - baseTop) + 4;
      return {
        style: {
          top: 'auto',
          bottom: `${bottom}px`,
          left: `${left}px`,
          width: `${triggerRect.width}px`,
        },
        opensUp: true
      };
    }

    return {
      style: {
        top: `${triggerRect.bottom - baseTop + 4}px`,
        left: `${left}px`,
        width: `${triggerRect.width}px`,
      },
      opensUp: false
    };
  }

  togglePartenaireDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.partenaireDropdownOpen = !this.partenaireDropdownOpen;
    this.groupDropdownOpen = false;
    if (this.partenaireDropdownOpen) {
      const result = this.computeMenuStyleFromEvent(event);
      this.partenaireMenuStyle = result.style;
      this.partenaireOpensUp = result.opensUp;
    } else {
      this.partenaireOpensUp = false;
    }
  }

  selectPartenaire(value: string): void {
    this.projectFormData.partenaire = value;
    this.partenaireDropdownOpen = false;
    this.partenaireMenuStyle = {};
    this.partenaireOpensUp = false;
  }

  getPartenaireLabel(value: string): string {
    return roleLabel(value);
  }

  /** Start/end as exact dates, with the year columns kept in step (older rows keep their year until a date is picked). */
  private datesPayload(): Record<string, any> {
    const yearOf = (date: string, year: any) => (date ? Number(String(date).slice(0, 4)) : this.emptyToNull(year));
    return {
      startDate: this.emptyToNull(this.projectFormData.startDate),
      endDate: this.emptyToNull(this.projectFormData.endDate),
      startyear: yearOf(this.projectFormData.startDate, this.projectFormData.startyear),
      endyear: yearOf(this.projectFormData.endDate, this.projectFormData.endyear),
    };
  }

  private emptyToNull(v: any): any {
    return v === '' || v === undefined ? null : v;
  }

  toggleGroupDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.groupDropdownOpen = !this.groupDropdownOpen;
    this.partenaireDropdownOpen = false;
    if (this.groupDropdownOpen) {
      const result = this.computeMenuStyleFromEvent(event);
      this.groupMenuStyle = result.style;
      this.groupOpensUp = result.opensUp;
    } else {
      this.groupOpensUp = false;
    }
  }

  selectGroup(value: string): void {
    this.projectFormData.title = value;
    this.groupDropdownOpen = false;
    this.groupMenuStyle = {};
    this.groupOpensUp = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const clickedOnDropdown = target.closest('.custom-dropdown') !== null;
    const clickedOnMenu = target.closest('.dropdown-menu') !== null;
    if (!clickedOnDropdown && !clickedOnMenu) {
      this.partenaireDropdownOpen = false;
      this.groupDropdownOpen = false;
      this.partenaireMenuStyle = {};
      this.groupMenuStyle = {};
      this.partenaireOpensUp = false;
      this.groupOpensUp = false;
    }
  }
}
