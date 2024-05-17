import { NgModule } from '@angular/core';
import { BrowserModule, HammerModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { CustomButtonComponent } from './custom_buttons/custom-button/custom-button.component';
import { BodyComponent } from './home/body/body.component';
import { LandscapeCardsComponent } from './home/landscape-cards/landscape-cards.component';
import { CustomFbButtonsComponent } from './custom_buttons/custom-fb-buttons/custom-fb-buttons.component';
import { CarouselComponent } from './home/carousel/carousel.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    CustomButtonComponent,
    BodyComponent,
    LandscapeCardsComponent,
    CustomFbButtonsComponent,
    CarouselComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HammerModule,
    BrowserModule, 
    BrowserAnimationsModule, 
    FormsModule
  ],
  
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
