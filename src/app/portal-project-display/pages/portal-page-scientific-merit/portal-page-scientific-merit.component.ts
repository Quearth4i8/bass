import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PortalProjectContextService } from '../../../portal/services/portal-project-context.service';
import { PortalProject } from '../../../portal/models/portal-project.model';
import { RichTextParagraph } from '../../../portal/models/portal-project.model';

@Component({
  selector: 'app-portal-page-scientific-merit',
  templateUrl: './portal-page-scientific-merit.component.html',
  styleUrls: ['./portal-page-scientific-merit.component.scss'],
})
export class PortalPageScientificMeritComponent implements OnInit {
  project: PortalProject | null = null;
  loading = true;

  nonEmptyParagraphs(paragraphs: RichTextParagraph[] | null | undefined): RichTextParagraph[] {
    if (!paragraphs?.length) return [];
    return paragraphs.filter((p) => (p?.content ?? '').replace(/<[^>]*>/g, '').trim().length > 0);
  }

  constructor(
    private readonly context: PortalProjectContextService,
    private readonly destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.context.project$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((project) => {
        this.project = project;
        this.loading = false;
      });
  }
}
