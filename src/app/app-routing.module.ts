import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GalleryComponent } from './gallery/gallery.component';
import { HomeComponent } from './home/home/home.component';
import { EventsComponent } from './events/events.component';
import { AboutBassianaComponent } from './about-bassiana/about-bassiana.component';
import { MissionComponent } from './mission/mission.component';
import { IchkeulComponent } from './ichkeul/ichkeul.component';
import { ObjectivesComponent } from './objectives/objectives.component';
import { PartnersComponent } from './partners/partners.component';
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'gallery', component: GalleryComponent },
  { path: 'events', component: EventsComponent },
  { path: 'about-bassiana', component: AboutBassianaComponent},
  { path: 'mission', component:MissionComponent},
  { path: 'ichkeul', component:IchkeulComponent},
  { path: 'objectives', component:ObjectivesComponent},
  { path: 'partners', component:PartnersComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
