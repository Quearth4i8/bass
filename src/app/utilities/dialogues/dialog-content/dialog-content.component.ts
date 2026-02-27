import { Component, OnInit, HostListener } from '@angular/core';
import { DynamicDialogRef, DialogService, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ProjectGroupService } from 'src/app/services/ProjectGroupService';
import { ProjectService } from 'src/app/services/ProjectService';

@Component({
  selector: 'app-dialog-content',
  templateUrl: './dialog-content.component.html',
  styleUrls: ['./dialog-content.component.scss'],
})
export class DialogContentComponent implements OnInit {
  projectGroupTitles: string[] = [];
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
    budget: '',
    title: ''
  };

  constructor(
    private projectGroupService: ProjectGroupService,
    private projectService: ProjectService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
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
    this.projectGroupService.getProjectGroupTitles().subscribe((titles) => {
      this.projectGroupTitles = titles;
    });
  }

  onSubmit() {
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
        startyear: this.projectFormData.startyear,
        endyear: this.projectFormData.endyear,
      };
      this.projectService.updateProject(this.projectId, updatedProject).subscribe(
        (response) => {
          console.log('Project updated successfully:', response);
          this.ref.close('success');
        },
        (error) => {
          console.error('Error updating project:', error);
        }
      );
    } else {
      // Create new project
      this.projectService.createProject(this.projectFormData).subscribe(
        (response) => {
          console.log('Project created successfully:', response);
          this.ref.close('success');
        },
        (error) => {
          console.error('Error creating project:', error);
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
    const top = shouldOpenUp
      ? Math.max(0, triggerRect.top - baseTop - desiredMenuHeight - 4)
      : triggerRect.bottom - baseTop + 4;

    return {
      style: {
        top: `${top}px`,
        left: `${left}px`,
        width: `${triggerRect.width}px`,
      },
      opensUp: shouldOpenUp
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
    const labels: any = {
      'beneficiary': 'Beneficiary',
      'partner': 'Partner',
      'principal': 'Principal Investigator'
    };
    return labels[value] || value;
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
