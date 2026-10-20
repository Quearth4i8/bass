import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';
import { CrewCvService, CvCardLink, cvCardKey } from '../../../services/CrewCvService';

/**
 * Drop into any person card: renders a "View CV" pill only when the admin
 * linked this card to a crew CV (Crew CVs > Linked cards). Its link also
 * stretches over the whole card, so clicking anywhere on the card opens the
 * CV; the card must be `position: relative`.
 */
@Component({
  selector: 'app-cv-link',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a *ngIf="link$ | async as link" class="cv-link" [routerLink]="['/cv', link.slug]"
       [attr.aria-label]="'Open the CV of ' + link.fullName" (click)="$event.stopPropagation()">
      <i class='bx bx-id-card'></i><span>View CV</span>
    </a>
  `,
  styles: [`
    :host { display: contents; }
    .cv-link {
      display: inline-flex; align-items: center; gap: 5px; width: fit-content;
      margin: var(--cv-link-margin, 8px 0 0); padding: 3px 10px; border-radius: 999px;
      font: 600 11px/1.6 var(--font-sans, system-ui, sans-serif); text-decoration: none;
      color: var(--cv-link-color, #1a8f7f); background: var(--cv-link-bg, rgba(26, 143, 127, 0.1));
      border: 1px solid var(--cv-link-border, rgba(26, 143, 127, 0.3));
      transition: background .15s;
    }
    .cv-link i { font-size: 14px; }
    .cv-link:hover { background: var(--cv-link-hover, rgba(26, 143, 127, 0.18)); }
    /* The whole card is the click target. */
    .cv-link::after { content: ''; position: absolute; inset: 0; z-index: 1; cursor: pointer; }
  `],
})
export class CvLinkComponent implements OnChanges {
  /** Where the card lives: "team" or "portal:<project slug>". */
  @Input({ required: true }) scope!: string;
  @Input({ required: true }) name!: string;

  link$?: Observable<CvCardLink | undefined>;

  constructor(private crewCvService: CrewCvService) {}

  ngOnChanges(): void {
    const key = cvCardKey(this.scope, this.name);
    this.link$ = this.crewCvService.cardLinks().pipe(map(links => links.get(key)));
  }
}
