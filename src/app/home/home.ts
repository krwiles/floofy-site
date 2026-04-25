import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Carousel } from '../components/carousel/carousel';
import { NgOptimizedImage } from '@angular/common';
import { I18nService } from '../services/i18n.service';
import { CarouselImage } from '../models/carousel-image.model';
import { RouterLink } from '@angular/router';
import { ParallaxSection } from '../components/parallax-section/parallax-section';

@Component({
  selector: 'app-home',
  imports: [Carousel, NgOptimizedImage, RouterLink, ParallaxSection],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  readonly i18n = inject(I18nService);
  readonly images: CarouselImage[] = [
    { src: 'assets/G_CQjK1XkAALluE.jpeg', alt: 'Image 1', width: 1200, height: 1800 },
    { src: 'assets/G-Ewq9pagAA7Z-b.jpeg', alt: 'Image 2', width: 1442, height: 2048 },
    { src: 'assets/G8oM0YEasAAWxIg.jpeg', alt: 'Image 3', width: 999, height: 1332 },
    { src: 'assets/G-lXyxKbQAMHkV_.jpeg', alt: 'Image 4', width: 1080, height: 1350 },
    { src: 'assets/G8s5y4ZakAA0XN9.jpeg', alt: 'Image 5', width: 1080, height: 1350 },
  ];

  readonly svgPattern = "data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 0C6.716 0 0 6.716 0 15c8.284 0 15-6.716 15-15zM0 15c0 8.284 6.716 15 15 15 0-8.284-6.716-15-15-15zm30 0c0-8.284-6.716-15-15-15 0 8.284 6.716 15 15 15zm0 0c0 8.284-6.716 15-15 15 0-8.284 6.716-15 15-15z' fill='%23ffffff' fill-opacity='0.09' fill-rule='evenodd'/%3E%3C/svg%3E";
}
