import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Hero } from '../../shared/components/hero/hero';
import { SectionDivider } from '../../shared/components/section-divider/section-divider';
import { Section } from '../../shared/components/section/section';

@Component({
  selector: 'app-streaming',
  imports: [Hero, SectionDivider, Section],
  templateUrl: './streaming.html',
  styleUrl: './streaming.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onWindowResize()',
  },
})
export class Streaming implements AfterViewInit {
  private document = inject(DOCUMENT);

  // The channel link, and the time zones the schedule is shown in (the visitor's own, the streamer's, and Japan's).
  readonly twitchUrl = 'https://www.twitch.tv/summerfloofy';
  readonly localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time';
  readonly easternTimeZone = 'America/New_York';
  readonly japanTimeZone = 'Asia/Tokyo';

  get streamScheduleSummary(): string {
    // The weekly schedule line, e.g. "Saturdays at 11:00 AM EDT".
    return `Saturdays at ${this.easternStreamTimeLabel}`;
  }

  get easternStreamTimeLabel(): string {
    // The Eastern start time, labelled EDT or EST depending on today's daylight saving.
    return this.isEasternDaylightSavingTime() ? '11:00 AM EDT' : '11:00 AM EST';
  }

  get japanStreamTimeLabel(): string {
    // The next stream's start, formatted in Japan time.
    const streamInstant = this.getNextStreamInstant();
    return `${new Intl.DateTimeFormat('en-US', {
      timeZone: this.japanTimeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(streamInstant)} JST`;
  }

  get localStreamTime(): string {
    // The next stream's start, as a full date and time in the visitor's own time zone.
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
    // Just the date of the next stream, in the visitor's own time zone.
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
    // Twitch's embed script isn't loaded yet: add it, and build the player once it arrives.
    if (!(window as any).Twitch) {
      const script = this.document.createElement('script');
      script.src = 'https://embed.twitch.tv/embed/v1.js';
      script.onload = () => {
        this.loadEmbed();
      };
      this.document.body.appendChild(script);
      return;
    }

    // Already loaded (e.g. returning to this page): build the player straight away.
    this.loadEmbed();
  }

  loadEmbed() {
    // Nothing to do if the placeholder element isn't on the page.
    const embedHost = this.document.getElementById('twitch-embed');
    if (!embedHost) {
      return;
    }

    // Clear any previous player before building a new one.
    embedHost.innerHTML = '';

    // The script failed to load (or hasn't finished): leave the placeholder empty.
    if (!(window as any).Twitch?.Embed) {
      return;
    }

    // Build the player, sized to the window; Twitch only allows embedding on the listed domains.
    return new (window as any).Twitch.Embed('twitch-embed', {
      width: this.calculateWidth(),
      height: this.calculateHeight(),
      channel: 'summerfloofy',
      parent: [
        'localhost',
        '127.0.0.1',
        'summerfloofy.com',
        'www.summerfloofy.com',
        'floofy-site.vercel.app',
        'www.floofy.site',
      ],
    });
  }

  onWindowResize() {
    // Rebuild the player at the new size once the embed script is available.
    if ((window as any).Twitch?.Embed) {
      this.loadEmbed();
    }
  }

  calculateHeight() {
    // 80% of the window's height.
    return Math.round(window.innerHeight * 0.8);
  }

  calculateWidth() {
    // The window's width, capped at 1280px.
    return Math.min(window.innerWidth, 1280);
  }

  private getNextStreamInstant(): Date {
    // Midnight UTC today, and the number of days until the next Saturday (a full week if today is Saturday).
    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const saturdayUtc = new Date(todayUtc);
    const daysUntilSaturday = (6 - todayUtc.getUTCDay() + 7) % 7 || 7;
    saturdayUtc.setUTCDate(todayUtc.getUTCDate() + daysUntilSaturday);

    // If that Saturday's start has already passed, use the following one.
    if (saturdayUtc.getTime() <= now.getTime()) {
      saturdayUtc.setUTCDate(saturdayUtc.getUTCDate() + 7);
    }

    // 11:00 AM Eastern is 15:00 UTC in daylight saving time, 16:00 UTC otherwise.
    const usesDst = this.isEasternDaylightSavingTime(saturdayUtc);
    saturdayUtc.setUTCHours(usesDst ? 15 : 16, 0, 0, 0);

    return saturdayUtc;
  }

  private isEasternDaylightSavingTime(date: Date = new Date()): boolean {
    // Ask Intl for the Eastern offset on that date, e.g. "GMT-4".
    const testTime = new Date(date);
    const offsetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: this.easternTimeZone,
      timeZoneName: 'shortOffset',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // GMT-4 means daylight saving time; GMT-5 (the fallback) means standard time.
    const offsetValue =
      offsetFormatter.formatToParts(testTime).find((part) => part.type === 'timeZoneName')?.value ?? 'GMT-5';
    return offsetValue.includes('-4') || offsetValue.includes('GMT-4');
  }
}
