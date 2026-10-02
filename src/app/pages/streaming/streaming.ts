import { AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Hero } from '../../shared/components/hero/hero';
import { SectionDivider } from '../../shared/components/section-divider/section-divider';
import { Section } from '../../shared/components/section/section';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { SocialLinks } from '../../shared/components/social-links/social-links';
import { Card } from '../../shared/directives/card';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../services/i18n.service';
import { ScriptLoader } from '../../services/script-loader.service';
import { StreamScheduleService } from '../../services/stream-schedule.service';

// Twitch's embed script, the channel it plays, and the only sites Twitch lets it play on.
const TWITCH_EMBED_SRC = 'https://embed.twitch.tv/embed/v1.js';
const TWITCH_CHANNEL = 'summerfloofy';
const TWITCH_PARENTS = ['localhost', '127.0.0.1', 'summerfloofy.com', 'www.summerfloofy.com'];

// How long resizing must pause before the player is rebuilt, so one drag or rotation rebuilds it only once.
const RESIZE_SETTLE_MS = 300;

@Component({
  selector: 'app-streaming',
  imports: [Hero, SectionDivider, Section, SectionHeader, SocialLinks, Card, TranslatePipe],
  templateUrl: './streaming.html',
  styleUrl: './streaming.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onWindowResize()',
  },
})
export class Streaming implements AfterViewInit {
  private readonly document = inject(DOCUMENT);
  private readonly i18n = inject(I18nService);
  private readonly scriptLoader = inject(ScriptLoader);
  private readonly schedule = inject(StreamScheduleService);

  // The schedule cards for the next stream, re-worded whenever the site's language changes.
  readonly slots = computed(() => this.schedule.slots(this.i18n.locale()));

  // The width the current player was built at, and the pending rebuild after a resize.
  private builtWidth: number | null = null;
  private resizeTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Drop a pending rebuild if the visitor leaves the page mid-resize.
    inject(DestroyRef).onDestroy(() => clearTimeout(this.resizeTimer));
  }

  async ngAfterViewInit() {
    // Load Twitch's script (once per visit); if it can't load, leave the player area empty.
    try {
      await this.scriptLoader.load(TWITCH_EMBED_SRC);
    } catch {
      return;
    }

    // Build the player now that Twitch.Embed exists.
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

    // Build the player, sized to the window, and remember the width it was built for.
    this.builtWidth = this.calculateWidth();
    return new (window as any).Twitch.Embed('twitch-embed', {
      width: this.builtWidth,
      height: this.calculateHeight(),
      channel: TWITCH_CHANNEL,
      parent: TWITCH_PARENTS,
    });
  }

  onWindowResize() {
    // Twitch's player can't change size once built, so rebuild it once resizing has settled...
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      // ...but only for a new width: a phone's toolbar sliding away changes just the height, and mustn't restart it.
      if (this.calculateWidth() !== this.builtWidth) {
        this.loadEmbed();
      }
    }, RESIZE_SETTLE_MS);
  }

  calculateHeight() {
    // 80% of the window's height.
    return Math.round(window.innerHeight * 0.8);
  }

  calculateWidth() {
    // The window's width, capped at 1280px.
    return Math.min(window.innerWidth, 1280);
  }
}
