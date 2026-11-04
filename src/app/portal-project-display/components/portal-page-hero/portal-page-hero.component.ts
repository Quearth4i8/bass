import { Component, DestroyRef, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PortalProjectContextService } from '../../../portal/services/portal-project-context.service';

/**
 * Title shared by every portal page except Home, which has its own carousel.
 * Styled as the landing pages' section head; the project's name is read from
 * the context here, so a page only has to say what it is.
 */
@Component({
  selector: 'app-portal-page-hero',
  templateUrl: './portal-page-hero.component.html',
  styleUrls: ['./portal-page-hero.component.scss'],
})
export class PortalPageHeroComponent {
  @Input() title = '';

  projectTitle = '';

  constructor(
    private readonly context: PortalProjectContextService,
    private readonly destroyRef: DestroyRef,
  ) {
    this.context.project$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((project) => {
        this.projectTitle = project?.title ?? '';
      });
  }
}
