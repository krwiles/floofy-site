import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-streaming',
  imports: [ParallaxSection, TranslatePipe],
  templateUrl: './streaming.html',
  styleUrl: './streaming.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onWindowResize()',
  },
})
export class Streaming implements AfterViewInit {
  private document = inject(DOCUMENT);

  // Load the Twitch embed script and initialize the embed after the view has been initialized
  ngAfterViewInit() {
    const script = this.document.createElement('script');
    script.src = 'https://embed.twitch.tv/embed/v1.js';
    script.onload = () => {
      this.loadEmbed();
    };
    this.document.body.appendChild(script);
  }

  loadEmbed() {
    const embedHost = this.document.getElementById('twitch-embed');
    if (embedHost) {
      embedHost.innerHTML = '';
    }

    return new (window as any).Twitch.Embed('twitch-embed', {
      width: this.calculateWidth(),
      height: this.calculateHeight(),
      channel: 'summerfloofy',
    });
  }

  onWindowResize() {
    this.loadEmbed();
  }

  calculateHeight() {
    return Math.round(window.innerHeight * 0.8);
  }

  calculateWidth() {
    return Math.min(window.innerWidth, 1280);
  }
}
