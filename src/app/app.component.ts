import { Component, OnInit } from "@angular/core";

import { AuthService } from "./services/AuthService";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  title = 'bassiana';
  icon = 'assets/INSTM_logo.png';

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.bootstrapFromToken().subscribe();
  }
}
