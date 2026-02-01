import { Component, OnInit } from "@angular/core";
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  title = 'bassiana';
  icon = 'assets/INSTM_logo.png';
  currentRoute: string = '';
  hideNavbarRoutes = ['projectadmin', 'docsadmin'];

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.urlAfterRedirects.split('/')[1] || '';
      window.scrollTo(0, 0);
    });
  }

  shouldShowNavbar(): boolean {
    return !this.hideNavbarRoutes.includes(this.currentRoute);
  }
}
