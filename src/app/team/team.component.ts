import { Component } from '@angular/core';

@Component({
  selector: 'app-team',
  templateUrl: 'team.component.html',
  styleUrls: ['team.component.scss'],
})
export class TeamComponent {
  activeCategory = 'all';

  teamData = {
    legalEntity: [
      {
        name: 'Hechmi Missaoui',
        role: 'General Director',
        image: 'assets/team/hem.jfif',
        description: ''
      },
      {
        name: 'Saloua Sadok',
        role: 'General Director',
        image: 'assets/team/ss.webp',
        description: ''
      },
      {
        name: '',
        role: 'General Director',
        image: 'assets/team/unkown.jpg',
        description: ''
      }
    ],
    marineDirectors: [
      {
        name: 'Ali Harzallah',
        role: 'Head Of Laboratory-LMM',
        image: 'assets/team/ali.png',
        description: ''
      },
      {
        name: '',
        role: 'Director',
        image: 'assets/team/unkown.jpg',
        description: 'Head Of Laboratory-LMM'
      },
      {
        name: '',
        role: 'Director',
        image: 'assets/team/unkown.jpg',
        description: 'Head Of Laboratory-LMM'
      }
    ],
    investigators: [
      {
        name: 'Béchir Béjaoui',
        role: 'Project Coordinator',
        image: 'assets/team/bb.jpg',
        organization: 'National Institute of Marine Sciences and Technologies',
        hasModal: true
      },
      {
        name: 'Sihem Benabdallah',
        role: 'Team member',
        image: 'assets/team/sa.png',
        organization: 'Water Research and Technology Center',
        hasModal: false
      }
    ],
    supporters: [
      {
        name: 'Hamidreza Norouzi',
        role: 'Professor and Director of Undergraduate Research',
        organization: 'New York City College of Technology',
        image: 'assets/team/hn.jpg'
      },
      {
        name: 'Reginald A. Blake',
        role: 'Professor',
        organization: 'New York City College of Technology',
        image: 'assets/team/bl.jpg'
      },
      {
        name: 'Kelly Robbins',
        role: 'Senior Program Officer',
        organization: 'The National Academies of Sciences',
        image: 'assets/team/kr.png'
      }
    ],
    collaborators: [
      {
        name: 'Nabiha Ben Mbarek',
        role: '',
        organization: 'National Agency for Environmental Protection',
        image: 'assets/team/nbm.png'
      },
      {
        name: 'Rachid Toujani',
        role: '',
        organization: 'National Institute of Marine Sciences and Technologies',
        image: 'assets/team/rt.png'
      },
      {
        name: 'Noureddine Zaaboub',
        role: '',
        organization: 'National Institute of Marine Sciences and Technologies',
        image: 'assets/team/nz.png'
      },
      {
        name: 'Afef Fathali',
        role: '',
        organization: 'National Institute of Marine Sciences and Technologies',
        image: 'assets/team/af.png'
      },
      {
        name: 'Dorra Baccouche',
        role: '',
        organization: 'National Institute of Marine Sciences and Technologies',
        image: 'assets/team/db.png'
      },
      {
        name: 'Jalel Aouissi',
        role: '',
        organization: 'National Agronomic Institute of Tunisia',
        image: 'assets/team/ja.png'
      },
      {
        name: 'Mekki Ben Jemaa',
        role: '',
        organization: 'University of Carthage',
        image: 'assets/team/mj.png'
      }
    ],
    admins: [
      {
        name: 'Béchir Béjaoui',
        role: 'Project Coordinator',
        image: 'assets/team/bb.jpg',
        hasModal: true
      },
      {
        name: 'Houaïda Bouali',
        role: 'Hydraulic Engineer',
        image: 'assets/team/h.jpg',
        hasModal: false
      }
    ],
    developers: [
      {
        name: 'Hatem Salem',
        role: 'Hydraulic Engineer',
        image: 'assets/team/0.jpg'
      },
      {
        name: 'Jasser Fetoui',
        role: 'Big Data Engineer',
        image: 'assets/team/jf.jpg'
      },
      {
        name: 'Ala Din Weslati',
        role: 'DATA Sciences Engineer',
        image: 'assets/team/aw.jpg'
      },
      {
        name: 'Mohamed Aziz Bjaoui',
        role: 'DATA Sciences Engineer',
        image: 'assets/team/aziz.jpg'
      }
    ]
  };

  getTotalMembers(): number {
    let total = 0;
    Object.values(this.teamData).forEach(category => {
      total += (category as any[]).length;
    });
    return total;
  }
}
