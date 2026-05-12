import { Component, AfterViewInit, ElementRef, ViewChild, QueryList, ViewChildren, ChangeDetectorRef, HostListener } from '@angular/core';
import { EmailService } from 'src/app/services/EmailService';

@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent implements AfterViewInit {

  contentItems = [
    {
      title: 'BASSIANA Ecosystems Database with real-time ecosystem monitoring and evaluation',
      description:
        'Accessing the Ecosystems Database allows users to manage their own data to run any of the dedicated geospatial analysis chains.',
      image: 'assets/images/5.png'
    },
    {
      title: 'Key element',
      description:
        'The main keys for sustainable development in Ichkeul region are the management of water budget for the Lake. Controlling the water level in the lake will help to safeguard biodiversity in this ecosystem.',
      image: 'assets/images/6.jpg'
    },
    {
      title: 'Initiative of BASSIANA Ecosystems Database',
      description: 'The website and the Ecosystems Database are the result of the capstone project of team “IMAS-Ichkeul”.',
      image: 'assets/images/7.jpg'
    },
    {
      title: 'IMAS-Ichkeul',
      description:
        'The IMAS-Ichkeul is a project funded under the Partnerships for Enhanced Engagement in Research (PEER), Cycle 8 program.',
      image: 'assets/images/8.jpg'
    }
  ];

  isEmailStored: boolean = false;
  userCount: number = 0;

  @ViewChildren('contentWrapper') contentWrappers!: QueryList<ElementRef>;

  
  constructor(private emailService: EmailService) {}

  ngOnInit(): void {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      this.emailService.checkEmailExists(storedEmail).subscribe(
        (exists) => {
          this.isEmailStored = exists;
        },
        (error) => {
          console.error('Error checking email existence:', error);
        }
      );
    }
  }
  ngAfterViewInit(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const wrapper = entry.target as HTMLElement;
          wrapper.querySelectorAll('.fade-in-left').forEach(el => el.classList.add('active'));
          wrapper.querySelectorAll('.fade-in-right').forEach(el => el.classList.add('active'));
          observer.unobserve(wrapper);
        }
      });
    }, { threshold: 0.5 });

    this.contentWrappers.forEach(wrapper => observer.observe(wrapper.nativeElement));

    this.emailService.getUserCount().subscribe(
      (count) => {
        this.userCount = count;
      },
      (error) => {
        console.error('Error fetching user count:', error);
      }
    );
  }


  saveEmail() {
    const emailInput = document.getElementById('userEmail') as HTMLInputElement;
    const email = emailInput.value;
    
    if (this.validateEmail(email)) {
      this.emailService.checkEmailExists(email).subscribe(
        (exists) => {
          if (exists) {
            this.isEmailStored = true;
          } else {
            this.emailService.submitEmail(email).subscribe(
              () => {
                this.isEmailStored = true;
                this.emailService.getUserCount().subscribe(
                  (count) => { this.userCount = count; },
                  (error) => { console.error('Error fetching user count:', error); }
                );
              },
              (error) => {
                console.error('Error submitting email:', error);
              }
            );
          }
        },
        (error) => {
          console.error('Error checking email:', error);
        }
      );
    } else {
      alert('Please enter a valid email address.');
    }
  }

  validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}