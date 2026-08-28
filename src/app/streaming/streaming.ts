import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ParallaxSection } from '../components/parallax-section/parallax-section';

@Component({
  selector: 'app-streaming',
  imports: [ParallaxSection],
  templateUrl: './streaming.html',
  styleUrl: './streaming.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onWindowResize()',
  },
})
export class Streaming implements AfterViewInit {
  private document = inject(DOCUMENT);

  readonly twitchUrl = 'https://www.twitch.tv/summerfloofy';
  readonly localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time';
  readonly easternTimeZone = 'America/New_York';
  readonly japanTimeZone = 'Asia/Tokyo';

  get streamScheduleSummary(): string {
    return `Saturdays at ${this.easternStreamTimeLabel}`;
  }

  get easternStreamTimeLabel(): string {
    return this.isEasternDaylightSavingTime() ? '11:00 AM EDT' : '11:00 AM EST';
  }

  get japanStreamTimeLabel(): string {
    const streamInstant = this.getNextStreamInstant();
    return `${new Intl.DateTimeFormat('en-US', {
      timeZone: this.japanTimeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(streamInstant)} JST`;
  }

  get localStreamTime(): string {
    const streamInstant = this.getNextStreamInstant();
    return new Intl.DateTimeFormat(undefined, {
      timeZone: this.localTimeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).format(streamInstant);
  }

  get localStreamDescription(): string {
    const streamInstant = this.getNextStreamInstant();
    const dateText = new Intl.DateTimeFormat(undefined, {
      timeZone: this.localTimeZone,
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(streamInstant);

    return `${dateText}`;
  }

  ngAfterViewInit() {
    if (!(window as any).Twitch) {
      const script = this.document.createElement('script');
      script.src = 'https://embed.twitch.tv/embed/v1.js';
      script.onload = () => {
        this.loadEmbed();
      };
      this.document.body.appendChild(script);
      return;
    }

    this.loadEmbed();
  }

  loadEmbed() {
    const embedHost = this.document.getElementById('twitch-embed');
    if (!embedHost) {
      return;
    }

    embedHost.innerHTML = '';

    if (!(window as any).Twitch?.Embed) {
      return;
    }

    return new (window as any).Twitch.Embed('twitch-embed', {
      width: this.calculateWidth(),
      height: this.calculateHeight(),
      channel: 'summerfloofy',
      parent: ['localhost', '127.0.0.1', 'floofy-site.vercel.app', 'www.floofy.site'],
    });
  }

  onWindowResize() {
    if ((window as any).Twitch?.Embed) {
      this.loadEmbed();
    }
  }

  calculateHeight() {
    return Math.round(window.innerHeight * 0.8);
  }

  calculateWidth() {
    return Math.min(window.innerWidth, 1280);
  }

  private getNextStreamInstant(): Date {
    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const saturdayUtc = new Date(todayUtc);
    const daysUntilSaturday = (6 - todayUtc.getUTCDay() + 7) % 7 || 7;
    saturdayUtc.setUTCDate(todayUtc.getUTCDate() + daysUntilSaturday);

    if (saturdayUtc.getTime() <= now.getTime()) {
      saturdayUtc.setUTCDate(saturdayUtc.getUTCDate() + 7);
    }

    const usesDst = this.isEasternDaylightSavingTime(saturdayUtc);
    saturdayUtc.setUTCHours(usesDst ? 15 : 16, 0, 0, 0);

    return saturdayUtc;
  }

  private isEasternDaylightSavingTime(date: Date = new Date()): boolean {
    const testTime = new Date(date);
    const offsetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: this.easternTimeZone,
      timeZoneName: 'shortOffset',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const offsetValue =
      offsetFormatter.formatToParts(testTime).find((part) => part.type === 'timeZoneName')?.value ?? 'GMT-5';
    return offsetValue.includes('-4') || offsetValue.includes('GMT-4');
  }
}
