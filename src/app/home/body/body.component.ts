import { Component, AfterViewInit, ElementRef, ViewChild, QueryList, ViewChildren, ChangeDetectorRef, HostListener } from '@angular/core';
import { EmailService } from 'src/app/services/EmailService';
import { BackgroundMusicService } from 'src/app/services/background-music.service';

@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent implements AfterViewInit {

  @ViewChild('mainVideo') mainVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('videoWrapper') videoWrapper!: ElementRef<HTMLDivElement>;

  contentItems = [
    {
      title: 'BASSIANA Ecosystems Database with real-time ecosystem monitoring and evaluation',
      description:
        'Accessing Ecosystems Database allows users to manage their own data to run any of dedicated geospatial analysis chains.',
      image: 'assets/images/5.png'
    },
    {
      title: 'Key element',
      description:
        'The main keys for sustainable development in Ichkeul region are management of water budget for Lake. Controlling water level in lake will help to safeguard biodiversity in this ecosystem.',
      image: 'assets/images/6.jpg'
    },
    {
      title: 'Initiative of BASSIANA Ecosystems Database',
      description: 'The website and Ecosystems Database are result of capstone project of team "IMAS-Ichkeul".',
      image: 'assets/images/7.jpg'
    },
    {
      title: 'IMAS-Ichkeul',
      description:
        'The IMAS-Ichkeul is a project funded under Partnerships for Enhanced Engagement in Research (PEER), Cycle 8 program.',
      image: 'assets/images/8.jpg'
    }
  ];

  videoData = [
    {
      title: 'Sea Surface Circulation Patterns',
      description: 'Advanced monitoring of coastal water circulation patterns along Tunisian areas',
      src: 'assets/videos/current.mp4'
    },
    {
      title: 'Sea Surface Temperature Analysis',
      description: 'Real-time temperature monitoring and spatial variation analysis',
      src: 'assets/videos/temp.mp4'
    },
    {
      title: 'Chlorophyll-a Detection',
      description: 'Satellite-based chlorophyll monitoring for ecosystem health assessment',
      src: 'assets/videos/chla.mp4'
    },
    {
      title: 'Salinity Patterns',
      description: 'Comprehensive salinity mapping in the Bizerte Lagoon system',
      src: 'assets/videos/salinity.mp4'
    },
    {
      title: 'Lagoon Circulation',
      description: 'Detailed current intensity analysis in lagoon environments',
      src: 'assets/videos/circulation bizerte.mp4'
    }
  ];

  isEmailStored: boolean = false;
  userCount: number = 0;
  isVideoPlaying: boolean = false;
  manuallyPaused: boolean = false;

  @ViewChildren('contentWrapper') contentWrappers!: QueryList<ElementRef>;

  
  constructor(private emailService: EmailService, private backgroundMusicService: BackgroundMusicService) {}

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

    // Intersection Observer for main video - play/pause based on visibility
    if (this.videoWrapper && this.mainVideo) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = this.mainVideo.nativeElement;
          if (entry.isIntersecting) {
            // Video is visible - play if not manually paused
            if (!this.manuallyPaused) {
              video.play().then(() => {
                this.isVideoPlaying = true;
                // Stop background music when video starts playing
                this.backgroundMusicService.stopForVideo();
              }).catch(() => {
                // Autoplay was prevented
              });
            }
          } else {
            // Video is not visible - pause
            video.pause();
            this.isVideoPlaying = false;
            // Resume background music when video stops playing
            this.backgroundMusicService.resumeAfterVideo();
          }
        });
      }, { 
        threshold: 0.5, // Video is considered visible when 50% is in view
        rootMargin: '0px'
      });

      videoObserver.observe(this.videoWrapper.nativeElement);
    }

    // Pause offscreen videos and only play when visible
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          if (video.paused && video.autoplay) {
            video.play().catch(() => {});
          }
        } else {
          if (!video.paused) {
            video.pause();
          }
        }
      });
    }, { threshold: 0.25 });

    document.querySelectorAll('video.observe-video').forEach(v => videoObserver.observe(v));

    this.emailService.getUserCount().subscribe(
      (count) => {
        this.userCount = count;
      },
      (error) => {
        console.error('Error fetching user count:', error);
      }
    );
  }

  // Video control methods
  toggleVideo(): void {
    const video = this.mainVideo.nativeElement;
    if (video) {
      if (video.paused) {
        video.play();
        this.isVideoPlaying = true;
        this.manuallyPaused = false; // User manually resumed
        // Stop background music when video starts playing
        this.backgroundMusicService.stopForVideo();
      } else {
        video.pause();
        this.isVideoPlaying = false;
        this.manuallyPaused = true; // User manually paused
        // Resume background music when video stops playing
        this.backgroundMusicService.resumeAfterVideo();
      }
    }
  }

  toggleMute(): void {
    const video = this.mainVideo.nativeElement;
    if (video) {
      video.muted = !video.muted;
    }
  }

  toggleFullscreen(): void {
    const video = this.mainVideo.nativeElement;
    if (video) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if ((video as any).webkitRequestFullscreen) {
        (video as any).webkitRequestFullscreen();
      } else if ((video as any).mozRequestFullScreen) {
        (video as any).mozRequestFullScreen();
      } else if ((video as any).msRequestFullscreen) {
        (video as any).msRequestFullscreen();
      }
    }
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
      console.log('Please enter a valid email address.');
    }
  }

  validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // Card styling methods
  getCardColor(index: number): string {
    const colors = ['#0ea5e9', '#3b82f6', '#10b981', '#f59e0b'];
    return colors[index % colors.length];
  }

  getCardColorDark(index: number): string {
    const colors = ['#0284c7', '#1e40af', '#059669', '#d97706'];
    return colors[index % colors.length];
  }

  getCardIcon(index: number): string {
    const icons = ['🌊', '🔑', '🌍', '🚀'];
    return icons[index % icons.length];
  }
}