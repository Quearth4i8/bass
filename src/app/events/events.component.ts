import { Component } from '@angular/core';

@Component({
  selector: 'app-events',
  templateUrl: 'events.component.html',
  styleUrls: ['events.component.scss'],
})
export class EventsComponent {
  events = [
    {
      date: '22',
      month: 'NOV',
      year: '2020',
      day: 'Friday',
      time: '9:00 AM - 3:30 PM',
      location: 'INSTM',
      title: 'OFFICIAL LAUNCH OF THE PROJECT',
      description: 'Presenting working methodology and discussing it with all patterns.',
      type: 'launch',
      color: '#34db7f'
    },
    {
      date: '09',
      month: 'DEC',
      year: '2020',
      day: 'Tuesday',
      time: '5:00 PM - 7:00 PM',
      location: 'Online',
      title: 'OPERATIONS MEETING',
      description: 'Meeting of steering committee to discuss progress of various activities of project as well as future plans for work, with participation of main partners of project, Pr. Hamidreza Norouzi and Pr. Reginald A. Blake from New York College of Technology, USA. Each partner\'s representative provided a short presentation on work in progress. At the end of meeting, discussion included an additional topical point on Sustainable Development: it incorporated an evaluation of pertinent targets and suggestions related to the achievement of Sustainable Development Goals for the study area.',
      type: 'meeting',
      color: '#e40046'
    },
    {
      date: '23',
      month: 'JUN',
      year: '2021',
      day: 'Tuesday',
      time: '5:00 PM - 7:00 PM',
      location: 'Online',
      title: 'OPERATIONS MEETING',
      description: 'The process of work on project.',
      type: 'meeting',
      color: '#e40046'
    },
    {
      date: '21',
      month: 'OCT',
      year: '2021',
      day: 'Thursday',
      time: '9:00 AM - 15:00 PM',
      location: 'INSTM',
      title: 'WORKSHOP',
      description: 'Several presentations were given during this workshop to provide a substantive and policy analysis of area\'s climate change adaptation and mitigation measures. Furthermore, at the end of the meeting, discussion included an additional topical point on the development of database, data collection, and data sharing with company.',
      type: 'workshop',
      color: '#34db7f'
    },
    {
      date: '29',
      month: 'JUN',
      year: '2022',
      day: 'Wednesday',
      time: '9:00 PM - 17:00 PM',
      location: 'Hotel in Tunisia (Carthage Thalasso Resort)',
      title: 'WORKSHOP: OFFICIAL KICK-OFF OF THE PROJECT',
      description: 'Two goals: hosting the USG-supported partners, Pr. Hamidreza Norouzi (online) and Ms. Kelly Robins from NAS with the presence of General Director of the INSTM and Minister of the MARH, and presenting the progress of the work on the project.',
      type: 'workshop',
      color: '#e40046'
    },
    {
      date: '01',
      month: 'JUL',
      year: '2022',
      day: 'Friday',
      time: '9:00 AM - 15:00 PM',
      location: 'Ichkeul',
      title: 'WORKSHOP: OFFICIAL KICK-OFF OF THE PROJECT',
      description: 'Visit to Lake Ichkeul by Tunisian partners and the NAS partner, Mrs. Kelly Robins, to assess the lake\'s situation.',
      type: 'workshop',
      color: '#34db7f'
    },
    {
      date: '06',
      month: 'JUN',
      year: '2023',
      day: 'Thursday',
      time: '9:00 AM - 15:00 PM',
      location: 'The City of Culture Tunis',
      title: 'INTERNATIONAL CONFERENCE "SUSTAINABLE WATER RESOURCES MANAGEMENT UNDER CLIMATE CHANGE"',
      description: 'Hard-hitting presentations covering various aspects of sustainable water resource management influenced by climate change were given by Professor Hamidreza Norouzi, Reginald Blake and Amir Aghakouchak.',
      type: 'conference',
      color: '#34db7f'
    },
    {
      date: '10',
      month: 'JUN',
      year: '2023',
      day: 'Saturday',
      time: '10:00 AM - 18:00 PM',
      location: 'United States Agency for International Development (USAID)',
      title: 'INTERNATIONAL VISIT',
      description: 'Dr. Béchir Béjaoui, and Dr. Sihem Benabdallah visited the US Agency for International Development (USAID), where they gave presentations on the complex relationships between climate change, adaptation, and migration measures.',
      type: 'visit',
      color: '#34db7f'
    }
  ];

  expandedEvents: boolean[] = new Array(this.events.length).fill(false);

  get eventsColumns() {
    const columns: any[][] = [[], []];
    this.events.forEach((event, index) => {
      columns[index % 2].push(event);
    });
    return columns;
  }

  getEventIndex(colIndex: number, itemIndex: number) {
    return colIndex * 4 + itemIndex;
  }

  toggleEvent(index: number) {
    this.expandedEvents[index] = !this.expandedEvents[index];
  }
}
