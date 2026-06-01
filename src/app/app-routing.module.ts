import { RouterModule, Routes } from '@angular/router';
import { ProjectsComponent } from './projects/projects.component';
import { ProjectAdminComponent } from './projectsadmin/projectadmin.component';
import { DocsadminComponent } from './docsadmin/docsadmin.component';
import { NgModule } from '@angular/core';
import { ProjectsLandingComponent } from './projects-landing/projects-landing.component';
import { BudgetChartsComponent } from './budget-charts/budget-charts.component';
import { ManagementComponent } from './management/management.component';
import { PortalProjectsListComponent } from './management/portal-projects-list/portal-projects-list.component';
import { AdminGuard } from './auth/admin.guard';

// Portal public display
import { PortalProjectDisplayComponent } from './portal-project-display/portal-project-display.component';
import { PortalPageHomeComponent } from './portal-project-display/pages/portal-page-home/portal-page-home.component';
import { PortalPageScientificMeritComponent } from './portal-project-display/pages/portal-page-scientific-merit/portal-page-scientific-merit.component';
import { PortalPageObjectivesComponent } from './portal-project-display/pages/portal-page-objectives/portal-page-objectives.component';
import { PortalPagePartnersComponent } from './portal-project-display/pages/portal-page-partners/portal-page-partners.component';
import { PortalPageFundersComponent } from './portal-project-display/pages/portal-page-funders/portal-page-funders.component';
import { PortalPageGalleryComponent } from './portal-project-display/pages/portal-page-gallery/portal-page-gallery.component';
import { PortalPageEventsComponent } from './portal-project-display/pages/portal-page-events/portal-page-events.component';
import { PortalPageTeamComponent } from './portal-project-display/pages/portal-page-team/portal-page-team.component';
import { PortalPageParticipantsComponent } from './portal-project-display/pages/portal-page-participants/portal-page-participants.component';
import { PortalPageOutputsComponent } from './portal-project-display/pages/portal-page-outputs/portal-page-outputs.component';

const routes: Routes = [
  { path: '', component: ProjectsLandingComponent },
  { path: 'projects', component: ProjectsComponent },
  { path: 'projectadmin', component: ProjectAdminComponent, canActivate: [AdminGuard] },
  { path: 'docsadmin', component: DocsadminComponent, canActivate: [AdminGuard] },
  { path: 'budget-charts', component: BudgetChartsComponent },
  { path: 'management', component: ManagementComponent, canActivate: [AdminGuard] },
  { path: 'management/portal-projects/:slug', component: PortalProjectsListComponent, canActivate: [AdminGuard] },
  {
    path: 'portal/:slug',
    component: PortalProjectDisplayComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home',             component: PortalPageHomeComponent },
      { path: 'scientific-merit', component: PortalPageScientificMeritComponent },
      { path: 'objectives',       component: PortalPageObjectivesComponent },
      { path: 'partners',          component: PortalPagePartnersComponent },
      { path: 'funders',           component: PortalPageFundersComponent },
      { path: 'gallery',          component: PortalPageGalleryComponent },
      { path: 'events',           component: PortalPageEventsComponent },
      { path: 'team',             component: PortalPageTeamComponent },
      { path: 'participants',     component: PortalPageParticipantsComponent },
      { path: 'outputs',          component: PortalPageOutputsComponent },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
