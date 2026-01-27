import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BackgroundMusicService implements OnDestroy {
  private audio: HTMLAudioElement;
  private isPlaying: boolean = false;
  private isUserPaused: boolean = false;
  private musicState$ = new Subject<{ isPlaying: boolean; isUserPaused: boolean }>();

  constructor() {
    this.audio = new Audio('assets/music/bgmusic.mp3');
    this.audio.loop = true;
    this.audio.volume = 0.3; // Set volume to 30%
    
    // Initialize user preference from localStorage
    const savedUserPaused = localStorage.getItem('bgMusicUserPaused');
    if (savedUserPaused !== 'true') {
      // User hasn't explicitly paused, start with music on by default
      this.isUserPaused = false;
      this.attemptAutoplay();
    } else {
      this.isUserPaused = true;
    }
  }

  private attemptAutoplay(): void {
    // Try to play the music (may be blocked by browser autoplay policies)
    this.audio.play().then(() => {
      this.isPlaying = true;
      this.musicState$.next({ isPlaying: true, isUserPaused: false });
    }).catch(() => {
      // Autoplay was prevented, wait for user interaction
      this.isPlaying = false;
      this.musicState$.next({ isPlaying: false, isUserPaused: false });
    });
  }

  play(): void {
    if (!this.isUserPaused) {
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.musicState$.next({ isPlaying: true, isUserPaused: false });
      }).catch(error => {
        console.error('Error playing background music:', error);
      });
    }
  }

  pause(): void {
    this.audio.pause();
    this.isPlaying = false;
    this.musicState$.next({ isPlaying: false, isUserPaused: this.isUserPaused });
  }

  toggleMusic(): void {
    if (this.isPlaying) {
      this.pause();
      this.isUserPaused = true;
      localStorage.setItem('bgMusicUserPaused', 'true');
    } else {
      this.isUserPaused = false;
      localStorage.removeItem('bgMusicUserPaused');
      this.play();
    }
  }

  stopForVideo(): void {
    if (this.isPlaying) {
      this.pause();
    }
  }

  resumeAfterVideo(): void {
    if (!this.isUserPaused) {
      this.play();
    }
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  getMusicState() {
    return this.musicState$.asObservable();
  }

  getCurrentState(): { isPlaying: boolean; isUserPaused: boolean } {
    return {
      isPlaying: this.isPlaying,
      isUserPaused: this.isUserPaused
    };
  }

  ngOnDestroy(): void {
    this.audio.pause();
    this.audio.src = '';
    this.musicState$.complete();
  }
}
