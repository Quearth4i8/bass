import { Component, OnInit, HostListener } from '@angular/core';
import { DynamicDialogRef, DialogService, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ProjectGroupService } from 'src/app/services/ProjectGroupService';
import { ThemeService } from 'src/app/services/ThemeService';
import { ProjectService } from 'src/app/services/ProjectService';
import { PROJECT_ROLES, STAGES, STAGE_DATE_FIELD, StatusStage, laterStages, previousStage, roleLabel, stagePath, stageTitle, statusLabel, statusStage, statusTone } from 'src/app/utilities/project-labels';

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
  partenaireMenuStyle: { [key: string]: string } = {};
  partenaireOpensUp: boolean = false;
  isEditMode: boolean = false;
  projectId: number | null = null;
  /** The status the project had when the dialog opened. */
  originalTitle = '';
  /**
   * A status counted as reached without its date: an older project's status
   * when the dialog opened undated, or the one picked in the status dropdown.
   * Still counted until it is dated or taken off.
   */
  undatedStage: StatusStage | null = null;
  statusDropdownOpen = false;
  statusMenuStyle: { [key: string]: string } = {};
  statusOpensUp = false;
  /** One row per status, each with the date the project took it. */
  readonly stageRows = STAGES.map(stage => ({ stage, field: STAGE_DATE_FIELD[stage], label: statusLabel(stage) }));
  /** Why the last save was refused, from the checks below or the backend. */
  errorMessage = '';
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
    ongoingDate: '',
    rejectedDate: '',
    achievedDate: '',
    canceledDate: '',
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
      this.originalTitle = this.config.data.project.title || '';
      const stage = statusStage(this.originalTitle);
      if (stage && !this.projectFormData[STAGE_DATE_FIELD[stage]]) this.undatedStage = stage;
    }
  }

  getProjectGroupTitles(): void {
    // In the brief's order: Ongoing, Achieved, Submitted, Rejected, Canceled (others last).
    const rank = ['ONGOING', 'ACHIEVED', 'SUBMITTED', 'REJECTED', 'CANCEL'];
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

  /** The status dropdown's options, in workflow order. */
  readonly stageOptions = STAGES;

  toggleStatusDropdown(event: MouseEvent): void {
    this.statusDropdownOpen = !this.statusDropdownOpen;
    if (this.statusDropdownOpen) {
      const result = this.computeMenuStyleFromEvent(event);
      this.statusMenuStyle = result.style;
      this.statusOpensUp = result.opensUp;
    }
  }

  /**
   * Pre-selects the status: it and the statuses before it count as reached
   * (dates left empty), the others are greyed out. Dates off its path go.
   */
  selectStage(stage: StatusStage): void {
    this.statusDropdownOpen = false;
    const path = stagePath(stage);
    STAGES.filter(s => !path.includes(s)).forEach(s => this.projectFormData[STAGE_DATE_FIELD[s]] = '');
    this.undatedStage = stage;
    this.fillStageDatesFromPeriod();
    this.syncStatus();
  }

  /** Stage dates filled in from the start/end date (and not changed by hand since). */
  private autoFilled = new Set<StatusStage>();

  /**
   * Start date -> Ongoing date, end date -> Achieved date, for statuses the
   * project has reached, while that date is empty or still the filled-in one.
   * Editing the stage date by hand stops it following.
   */
  fillStageDatesFromPeriod(): void {
    const sources: [StatusStage, string][] = [['ONGOING', 'startDate'], ['ACHIEVED', 'endDate']];
    const reached = this.reachedStages;
    for (const [stage, source] of sources) {
      const field = STAGE_DATE_FIELD[stage];
      if (!reached.has(stage) || (this.projectFormData[field] && !this.autoFilled.has(stage))) continue;
      this.projectFormData[field] = this.projectFormData[source] || '';
      this.autoFilled.add(stage);
    }
  }

  /** The stages the project has reached: each dated one and the ones before it. */
  get reachedStages(): Set<StatusStage> {
    const reached = new Set<StatusStage>();
    for (const stage of STAGES) {
      if (this.projectFormData[STAGE_DATE_FIELD[stage]] || stage === this.undatedStage) stagePath(stage).forEach(s => reached.add(s));
    }
    return reached;
  }

  /** The project's status: the furthest stage it has reached; null before it has a submission date. */
  get currentStage(): StatusStage | null {
    let current: StatusStage | null = null;
    this.reachedStages.forEach(s => {
      if (!current || stagePath(s).length > stagePath(current).length) current = s;
    });
    return current;
  }

  /** A stage already reached, or one the current status can move on to (Submitted first). */
  canSet(stage: StatusStage): boolean {
    const current = this.currentStage;
    return this.reachedStages.has(stage) || (current ? previousStage(stage) === current : stage === 'SUBMITTED');
  }

  /** Why a greyed-out stage can't be set yet. */
  blockedReason(stage: StatusStage): string {
    const current = this.currentStage;
    if (current && !stagePath(stage).includes(current)) {
      return `A ${statusLabel(current).toLowerCase()} project can't become ${statusLabel(stage).toLowerCase()}. Clear the ${statusLabel(current).toLowerCase()} date to step back.`;
    }
    return `Give the ${statusLabel(previousStage(stage) || 'SUBMITTED').toLowerCase()} date first.`;
  }

  /** Reached without a date of its own (an older project, or a stage skipped over). */
  isUndated(stage: StatusStage): boolean {
    return this.reachedStages.has(stage) && !this.projectFormData[STAGE_DATE_FIELD[stage]];
  }

  onStageDate(stage: StatusStage, value: string): void {
    if (value !== this.projectFormData[STAGE_DATE_FIELD[stage]]) this.autoFilled.delete(stage);
    this.projectFormData[STAGE_DATE_FIELD[stage]] = value;
    this.syncStatus();
  }

  /**
   * Taking a stage's date off means the project never got there: the stages
   * after it go too, and the status steps back to the one before.
   */
  clearStage(stage: StatusStage): void {
    const dropped = [stage, ...laterStages(stage)];
    dropped.forEach(s => { this.projectFormData[STAGE_DATE_FIELD[s]] = ''; this.autoFilled.delete(s); });
    if (this.undatedStage && dropped.includes(this.undatedStage)) this.undatedStage = null;
    this.syncStatus();
  }

  /** The status follows the dates. */
  private syncStatus(): void {
    const current = this.currentStage;
    this.errorMessage = '';
    this.projectFormData.title = !current ? ''
      : current === statusStage(this.originalTitle) ? this.originalTitle
      : stageTitle(current, this.projectGroupTitles);
  }

  /** The rows never change, but keep each date field by its stage all the same. */
  trackStage(_: number, d: { stage: StatusStage }): StatusStage {
    return d.stage;
  }

  /**
   * A status is needed, and its dates must be in order, the same as the
   * backend checks, so the admin hears about it before the round trip.
   */
  private validate(): string {
    const current = this.currentStage;
    if (!current) return "Pick the project's status.";
    // Dates are "YYYY-MM-DD", so comparing the strings compares the days.
    let last: StatusStage | null = null;
    for (const stage of stagePath(current)) {
      const date = this.projectFormData[STAGE_DATE_FIELD[stage]];
      if (!date) continue;
      if (last && date < this.projectFormData[STAGE_DATE_FIELD[last]]) {
        return `The ${statusLabel(stage)} date can't be before the ${statusLabel(last)} date.`;
      }
      last = stage;
    }
    return '';
  }

  /** The status dates to send, empty ones as null. The backend drops those off the project's path. */
  private statusDatesPayload(): Record<string, any> {
    return Object.fromEntries(Object.values(STAGE_DATE_FIELD)
      .map(field => [field, this.emptyToNull(this.projectFormData[field])]));
  }

  private saveFailed(error: any): void {
    console.error('Error saving project:', error);
    // A refused status or date comes back as 400 with the reason as text.
    this.errorMessage = error?.status === 400 && typeof error.error === 'string'
      ? error.error
      : 'The project could not be saved. Please try again.';
    this.saving = false;
  }

  onSubmit() {
    if (this.saving) return;
    this.errorMessage = this.validate();
    if (this.errorMessage) return;
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
        ...this.statusDatesPayload(),
        totalBudget: this.emptyToNull(this.projectFormData.totalBudget),
      };
      this.projectService.updateProject(this.projectId, updatedProject).subscribe(
        (response) => {
          console.log('Project updated successfully:', response);
          this.ref.close('success');
        },
        (error) => this.saveFailed(error)
      );
    } else {
      // Create new project
      // Optional fields left empty go up as null, not '' - the backend cannot
      // read an empty string as a date or a number.
      const created = {
        ...this.projectFormData,
        ...this.datesPayload(),
        applicant: this.projectFormData.applicant || null,
        ...this.statusDatesPayload(),
        totalBudget: this.emptyToNull(this.projectFormData.totalBudget),
      };
      this.projectService.createProject(created).subscribe(
        (response) => {
          console.log('Project created successfully:', response);
          this.ref.close('success');
        },
        (error) => this.saveFailed(error)
      );
    }
  }

  onDialogBodyScroll(): void {
    this.partenaireDropdownOpen = false;
    this.statusDropdownOpen = false;
    this.partenaireMenuStyle = {};
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
    // No stopPropagation: the click must reach the document so other open dropdowns close.
    this.partenaireDropdownOpen = !this.partenaireDropdownOpen;
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const clickedOnDropdown = target.closest('.custom-dropdown') !== null;
    const clickedOnMenu = target.closest('.dropdown-menu') !== null;
    if (!clickedOnDropdown && !clickedOnMenu) {
      this.partenaireDropdownOpen = false;
      this.partenaireMenuStyle = {};
      this.partenaireOpensUp = false;
      this.statusDropdownOpen = false;
    }
  }
}
