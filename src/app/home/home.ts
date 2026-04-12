import { AfterViewInit, ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Carousel } from "../components/carousel/carousel";
import { I18nService } from '../core/i18n.service';
import { CarouselImage } from '../models/carousel-image.model';

// Declare the Twitter widgets object to avoid TypeScript errors
declare const twttr: { widgets: { load: () => void } };

@Component({
  selector: 'app-home',
  imports: [Carousel],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onWindowScroll()',
  },
})
export class Home implements OnInit, AfterViewInit {
  readonly i18n = inject(I18nService);
  readonly heroImageLoaded = signal(false);
  readonly parallaxY = signal(0);
  readonly parallaxStrength = 0.30; // Adjust this value to increase/decrease the parallax effect
  readonly images: CarouselImage[] = [
    { src: '/G_CQjK1XkAALluE.jpeg', alt: 'Image 1' },
    { src: '/G-Ewq9pagAA7Z-b.jpeg', alt: 'Image 2' },
    { src: '/G8oM0YEasAAWxIg.jpeg', alt: 'Image 3' },
    { src: '/G-lXyxKbQAMHkV_.jpeg', alt: 'Image 4' },
    { src: '/G8s5y4ZakAA0XN9.jpeg', alt: 'Image 5' },
  ];

  onWindowScroll(): void {
    this.parallaxY.set(window.scrollY * this.parallaxStrength);
  }

  ngAfterViewInit(): void {
    // Load Twitter widgets after the view has initialized
    // This is needed to ensure that any embedded tweets are properly rendered after routing
    if (typeof twttr !== 'undefined') {
      twttr.widgets.load();
    }
  }

  ngOnInit(): void {
    // Preload the hero image and set the loaded state when it's ready
    const image = new Image();
    image.src = '/G8s5y4ZakAA0XN9.jpeg';

    if (image.decode) {
      image
        .decode()
        .then(() => this.heroImageLoaded.set(true))
        .catch(() => this.heroImageLoaded.set(true));
      return;
    }

    image.onload = () => this.heroImageLoaded.set(true);
    image.onerror = () => this.heroImageLoaded.set(true);
  }
}
