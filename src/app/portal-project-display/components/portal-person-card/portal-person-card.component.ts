import { Component, Input } from '@angular/core';

import { PortalPerson } from '../../../portal/models/portal-project.model';

/**
 * One person, on the Team and Participants pages alike. Both used to carry
 * their own copy of this card's markup and styles, which is why they had drifted
 * apart; the pages now own only their grid.
 *
 * Reads three lines in a fixed order - name, role, institute - and prints only
 * the ones that are filled in, so a person with no institute simply ends after
 * their role rather than leaving a gap where the line would be.
 */
@Component({
  selector: 'app-portal-person-card',
  templateUrl: './portal-person-card.component.html',
  styleUrls: ['./portal-person-card.component.scss'],
})
export class PortalPersonCardComponent {
  @Input({ required: true }) person!: PortalPerson;

  /**
   * Separators the existing entries use to pack a role and an institute into
   * the single `role` field they had before `institute` existed - "Researcher -
   * INSTM", "Senior Program Officer, The National Academies of Sciences".
   */
  private static readonly ROLE_SPLIT = /\s+[-–—]\s+|,\s*/;

  /** Falls back to the placeholder rather than rendering a broken image. */
  get photo(): string {
    return this.person?.image?.trim() || 'assets/images/avatar-placeholder.png';
  }

  get role(): string {
    return this.person?.institute?.trim()
      ? this.person.role?.trim() ?? ''
      : this.splitLegacyRole()[0];
  }

  /**
   * The stored institute when there is one. Otherwise the tail of a role that
   * was typed as "<role> - <institute>": display-only, so filling the Institute
   * field in admin always wins, and nothing here rewrites what is stored.
   */
  get institute(): string {
    return this.person?.institute?.trim() || this.splitLegacyRole()[1];
  }

  /** `[role, institute]`, either of which may be empty. */
  private splitLegacyRole(): [string, string] {
    const raw = this.person?.role?.trim() ?? '';
    if (!raw) return ['', ''];

    const at = raw.search(PortalPersonCardComponent.ROLE_SPLIT);
    if (at < 0) return [raw, ''];

    const match = raw.slice(at).match(PortalPersonCardComponent.ROLE_SPLIT);
    const tail = raw.slice(at + (match?.[0].length ?? 0)).trim();
    return [raw.slice(0, at).trim(), tail];
  }
}
