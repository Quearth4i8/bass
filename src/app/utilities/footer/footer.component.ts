import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: 'footer.component.html',
  styleUrls: ['footer.component.scss'],
})
export class FooterComponent {
  /* Read once at construction rather than hardcoded, so the copyright line
     cannot fall out of date the way "Copyright © INSTM 2022" had. */
  readonly currentYear = new Date().getFullYear();
}
