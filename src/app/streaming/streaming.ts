import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-streaming',
  imports: [],
  templateUrl: './streaming.html',
  styleUrl: './streaming.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Streaming implements AfterViewInit {
  private document = inject(DOCUMENT);
  i18n = inject(I18nService);

  // Load the Twitch embed script and initialize the embed after the view has been initialized
  ngAfterViewInit() {
    const script = this.document.createElement('script');
    script.src = 'https://embed.twitch.tv/embed/v1.js';
    script.onload = () => {
      new (window as any).Twitch.Embed('twitch-embed', {
        width: 854,
        height: 480,
        channel: 'summerfloofy',
      });
    };
    this.document.body.appendChild(script);
  }
}
