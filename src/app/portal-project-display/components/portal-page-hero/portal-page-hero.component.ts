import { Component, DestroyRef, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PortalProjectContextService } from '../../../portal/services/portal-project-context.service';

/**
 * Banner shared by every portal page except Home, which has its own carousel.
 *
 * The backdrop is the project's first home-carousel slide, read from the
 * context here rather than passed in, so a page only has to say what it is.
 */
@Component({
  selector: 'app-portal-page-hero',
  templateUrl: './portal-page-hero.component.html',
  styleUrls: ['./portal-page-hero.component.scss'],
})
export class PortalPageHeroComponent {
  @Input() title = '';

  heroImage = '';

  constructor(
    private readonly context: PortalProjectContextService,
    private readonly destroyRef: DestroyRef,
  ) {
    this.context.project$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((project) => {
        this.heroImage = project?.content?.home?.carousel?.[0]?.url ?? '';
      });
  }
}
