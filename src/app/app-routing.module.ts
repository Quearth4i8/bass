import { RouterModule, Routes } from '@angular/router';
import { ProjectsComponent } from './projects/projects.component';
import { ProjectAdminComponent } from './projectsadmin/projectadmin.component';
import { DocsadminComponent } from './docsadmin/docsadmin.component';
import { NgModule } from '@angular/core';
import { ProjectsLandingComponent } from './projects-landing/projects-landing.component';
import { BudgetChartsComponent } from './budget-charts/budget-charts.component';
import { ManagementComponent } from './management/management.component';
import { WikiadminComponent } from './wikiadmin/wikiadmin.component';
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

// Landing pages
import { LandingOverviewComponent } from './projects-landing/pages/landing-overview/landing-overview.component';
import { LandingAboutComponent } from './projects-landing/pages/landing-about/landing-about.component';
import { LandingGeodatabaseComponent } from './projects-landing/pages/landing-geodatabase/landing-geodatabase.component';
import { LandingPortalsComponent } from './projects-landing/pages/landing-portals/landing-portals.component';
import { LandingTeamComponent } from './projects-landing/pages/landing-team/landing-team.component';
import { LandingOutputsComponent } from './projects-landing/pages/landing-outputs/landing-outputs.component';

const routes: Routes = [
  // Specific routes matched before the shell catch-all
  { path: 'projects', component: ProjectsComponent },
  { path: 'projectadmin', component: ProjectAdminComponent, canActivate: [AdminGuard] },
  { path: 'docsadmin', component: DocsadminComponent, canActivate: [AdminGuard] },
  { path: 'budget-charts', component: BudgetChartsComponent },
  { path: 'management', component: ManagementComponent, canActivate: [AdminGuard] },
  { path: 'wikiadmin', component: WikiadminComponent, canActivate: [AdminGuard] },
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
  // Landing shell — catches root and all landing sub-pages
  {
    path: '',
    component: ProjectsLandingComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview',    component: LandingOverviewComponent },
      { path: 'about',       component: LandingAboutComponent },
      { path: 'geodatabase', component: LandingGeodatabaseComponent },
      { path: 'portals',     component: LandingPortalsComponent },
      { path: 'team',        component: LandingTeamComponent },
      { path: 'outputs',     component: LandingOutputsComponent },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
