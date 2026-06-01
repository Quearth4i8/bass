import { Injectable } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _theme: Theme = 'dark';

  constructor() {
    const saved = localStorage.getItem('bassiana-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') this._theme = saved;
    this.apply();
  }

  get current(): Theme { return this._theme; }
  get isLight(): boolean { return this._theme === 'light'; }

  toggle(): void {
    this._theme = this._theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('bassiana-theme', this._theme);
    this.apply();
  }

  private apply(): void {
    document.body.setAttribute('data-theme', this._theme);
  }
}
