import { RouterModule, Routes } from '@angular/router';
import { GalleryComponent } from './gallery/gallery.component';
import { HomeComponent } from './home/home/home.component';
import { EventsComponent } from './events/events.component';
import { IchkeulComponent } from './ichkeul/ichkeul.component';
import { ObjectivesComponent } from './objectives/objectives.component';
import { PartnersComponent } from './partners/partners.component';
import { TeamComponent } from './team/team.component';
import { ProjectsComponent } from './projects/projects.component';
import { ProjectAdminComponent } from './projectsadmin/projectadmin.component';
import { DocsadminComponent } from './docsadmin/docsadmin.component';
import { NgModule } from '@angular/core';
import { DataprovidersComponent } from './dataproviders/dataproviders.component';
import { ProjectsLandingComponent } from './projects-landing/projects-landing.component';
import { BudgetChartsComponent } from './budget-charts/budget-charts.component';
import { EventsadminComponent } from './eventsadmin/eventsadmin.component';
import { ManagementComponent } from './management/management.component';
import { AdminGuard } from './auth/admin.guard';

const routes: Routes = [
  { path: '', component: ProjectsLandingComponent },
  { path: 'imas-ichkeul', component: HomeComponent },
  { path: 'gallery', component: GalleryComponent },
  { path: 'events', component: EventsComponent },
  { path: 'ichkeul', component:IchkeulComponent},
  { path: 'objectives', component:ObjectivesComponent},
  { path: 'partners', component:PartnersComponent},
  { path: 'team', component:TeamComponent},
  { path: 'projects', component:ProjectsComponent},
  { path: 'projectadmin', component:ProjectAdminComponent, canActivate: [AdminGuard] },
  { path: 'docsadmin', component:DocsadminComponent, canActivate: [AdminGuard] },
  { path: 'budget-charts', component:BudgetChartsComponent},
  { path: 'eventsadmin', component:EventsadminComponent, canActivate: [AdminGuard] },
  { path: 'management', component:ManagementComponent, canActivate: [AdminGuard] },
  { path: 'dataproviders', component:DataprovidersComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
