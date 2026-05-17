import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Carousel } from '../components/carousel/carousel';
import { NgOptimizedImage } from '@angular/common';
import { I18nService } from '../services/i18n.service';
import { CarouselImage } from '../models/carousel-image.model';
import { RouterLink } from '@angular/router';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-home',
  imports: [Carousel, NgOptimizedImage, RouterLink, ParallaxSection, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  readonly i18n = inject(I18nService);
  readonly images: CarouselImage[][] = [
    [
      { src: 'assets/G_CQjK1XkAALluE.jpeg', alt: 'Image 1', width: 1200, height: 1800 },
      { src: 'assets/G-Ewq9pagAA7Z-b.jpeg', alt: 'Image 2', width: 1442, height: 2048 },
      { src: 'assets/G8oM0YEasAAWxIg.jpeg', alt: 'Image 3', width: 999, height: 1332 },
    ],
    [
      { src: 'assets/G-lXyxKbQAMHkV_.jpeg', alt: 'Image 4', width: 1080, height: 1350 },
      { src: 'assets/G8s5y4ZakAA0XN9.jpeg', alt: 'Image 5', width: 1080, height: 1350 },
      { src: 'assets/G0iHCdnaIAA5IDY.jpg', alt: 'Image 6', width: 1500, height: 2000 },
    ],
    [
      { src: 'assets/HFImiOIbkAAPgg6.jpeg', alt: 'Image 7', width: 900, height: 1200 },
      { src: 'assets/HGl6r3xbcAAy7uU.jpeg', alt: 'Image 8', width: 1500, height: 2000 },
      { src: 'assets/HFT6u19bsAAQG-z.jpeg', alt: 'Image 9', width: 900, height: 1200 },
    ],
  ];
}
