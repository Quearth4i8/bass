import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-projects-landing',
  templateUrl: './projects-landing.component.html',
  styleUrls: ['./projects-landing.component.scss']
})
export class ProjectsLandingComponent {
  projects = [
    {
      id: 'imas-ichkeul',
      name: 'IMAS-ICHKEUL',
      description: 'About IMAS-ICHKEUL',
      image: 'assets/images/4.png',
      active: true
    },
    {
      id: 'abcdrybasin',
      name: 'ABCDryBasin',
      description: 'Coming Soon',
      image: 'assets/images/1.png',
      active: false
    },
    {
      id: 'bassiana',
      name: 'BASSIANA',
      description: 'Coming Soon',
      image: 'assets/images/2.png',
      active: false
    },
    {
      id: 'summonehealth',
      name: 'SUMME_One Health',
      description: 'Coming Soon',
      image: 'assets/images/3.png',
      active: false
    }
  ];

  constructor(private router: Router) {}

  navigateToProject(projectId: string): void {
    if (projectId === 'imas-ichkeul') {
      this.router.navigate(['/imas-ichkeul']);
    }
    // Add navigation for other projects when they become active
  }
}
