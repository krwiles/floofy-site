import { AfterViewInit, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Carousel } from '../components/carousel/carousel';
import { NgOptimizedImage } from '@angular/common';
import { I18nService } from '../services/i18n.service';
import { CarouselImage } from '../models/carousel-image.model';
import { RouterLink } from '@angular/router';

// Declare the Twitter widgets object to avoid TypeScript errors
declare const twttr: { widgets: { load: () => void } };

@Component({
  selector: 'app-home',
  imports: [Carousel, NgOptimizedImage, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onWindowScroll()',
  },
})
export class Home implements AfterViewInit {
  readonly i18n = inject(I18nService);
  readonly parallaxY = signal(0);
  readonly parallaxStrength = 0.35; // Adjust this value to increase/decrease the parallax effect
  readonly images: CarouselImage[] = [
    { src: 'assets/G_CQjK1XkAALluE.jpeg', alt: 'Image 1', width: 1200, height: 1800 },
    { src: 'assets/G-Ewq9pagAA7Z-b.jpeg', alt: 'Image 2', width: 1442, height: 2048 },
    { src: 'assets/G8oM0YEasAAWxIg.jpeg', alt: 'Image 3', width: 999, height: 1332 },
    { src: 'assets/G-lXyxKbQAMHkV_.jpeg', alt: 'Image 4', width: 1080, height: 1350 },
    { src: 'assets/G8s5y4ZakAA0XN9.jpeg', alt: 'Image 5', width: 1080, height: 1350 },
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
}
