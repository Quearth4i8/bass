import { Component } from '@angular/core';

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
      description: 'Interactive Geodatabase for Ecosystem Monitoring and Research',
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
      id: 'imas',
      name: 'IMAS',
      description: 'Coming Soon',
      image: 'assets/images/3.png',
      active: false
    }
  ];
}
