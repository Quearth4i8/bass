import { BrowserModule, HammerModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './utilities/navbar/navbar.component';
import { CustomButtonComponent } from './custom_buttons/custom-button/custom-button.component';
import { CustomFbButtonsComponent } from './custom_buttons/custom-fb-buttons/custom-fb-buttons.component';
import { LandscapeCardsComponent } from './home/landscape-cards/landscape-cards.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { FooterComponent } from './utilities/footer/footer.component';
import {MatExpansionModule} from '@angular/material/expansion';
import { ProjectsComponent } from './projects/projects.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoginComponent } from './custom_buttons/login/login.component';
import { Navbar2Component } from './utilities/navbar2/navbar2.component';
import { ProjectAdminComponent } from './projectsadmin/projectadmin.component';
import { SidenavbarComponent } from './utilities/sidenavbar/sidenavbar.component';
import {MatButtonModule} from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { HeaderComponent } from './utilities/header/header.component';
import { DocsadminComponent } from './docsadmin/docsadmin.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ConfirmDialogComponent } from './utilities/dialogues/confirm-dialog/confirm-dialog.component';
import { NgModule } from '@angular/core';
import {FileUploadModule} from 'primeng/fileupload';
import {DynamicDialogModule} from 'primeng/dynamicdialog';
import { DialogService } from 'primeng/dynamicdialog';
import { DialogContentComponent } from './utilities/dialogues/dialog-content/dialog-content.component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { ProjectGroupDialogComponent } from './utilities/dialogues/project-group-dialog/project-group-dialog.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { ConfirmDeleteGroupDialogComponent } from './utilities/dialogues/confirm-delete-group-dialog/confirm-delete-group-dialog.component';
import { UpbuttonComponent } from "./utilities/Upbutton/upbutton.component";
import { ProjectsLandingComponent } from './projects-landing/projects-landing.component';
import { ManagementComponent } from './management/management.component';
import { PortalProjectsListComponent } from './management/portal-projects-list/portal-projects-list.component';
import { ContentEditableHtmlDirective } from './management/portal-projects-list/content-editable-html.directive';
import { AuthInterceptor } from './auth/auth.interceptor';

// Portal public display components
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
import { SafeHtmlPipe } from './shared/safe-html.pipe';
import { AdminNavbarComponent } from './utilities/admin-navbar/admin-navbar.component';
import { AdminSidebarComponent } from './utilities/admin-sidebar/admin-sidebar.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    CustomButtonComponent,
    CustomFbButtonsComponent,
    LandscapeCardsComponent,
    FooterComponent,
    ProjectsComponent,
    LoginComponent,
    Navbar2Component,
    ProjectAdminComponent,
    SidenavbarComponent,
    HeaderComponent,
    DocsadminComponent,
    ConfirmDialogComponent,
    DialogContentComponent,
    ProjectGroupDialogComponent,
    ConfirmDeleteGroupDialogComponent,
    UpbuttonComponent,
    ProjectsLandingComponent,
    ManagementComponent,
    PortalProjectsListComponent,
    ContentEditableHtmlDirective,
    // Portal public display
    PortalProjectDisplayComponent,
    PortalPageHomeComponent,
    PortalPageScientificMeritComponent,
    PortalPageObjectivesComponent,
    PortalPagePartnersComponent,
    PortalPageFundersComponent,
    PortalPageGalleryComponent,
    PortalPageEventsComponent,
    PortalPageTeamComponent,
    PortalPageParticipantsComponent,
    PortalPageOutputsComponent,
    SafeHtmlPipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HammerModule,
    BrowserAnimationsModule,
    FormsModule,
    MatExpansionModule,
    HttpClientModule,
    MatSidenavModule,
    MatToolbarModule,
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    FileUploadModule,
    DynamicDialogModule,
    MessagesModule,
    MessageModule,
    DropdownModule,
    ToastModule,
    AdminNavbarComponent,
    AdminSidebarComponent,
  ],
  providers: [
    DialogService,
    ConfirmationService,
    MessageService,
    provideAnimationsAsync(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
