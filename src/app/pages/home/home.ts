import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RollingCarousel } from '../../shared/components/rolling-carousel/rolling-carousel';
import { NgOptimizedImage } from '@angular/common';
import { ImageAsset } from '../../models/image-asset';
import { RouterLink } from '@angular/router';
import { Hero } from '../../shared/components/hero/hero';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { Reveal } from '../../shared/directives/reveal';
import { Flourish } from '../../shared/components/flourish/flourish';
import { SectionDivider } from '../../shared/components/section-divider/section-divider';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { Section } from '../../shared/components/section/section';
import { Card } from '../../shared/directives/card';
import { Button } from '../../shared/directives/button';

@Component({
  selector: 'app-home',
  imports: [
    RollingCarousel,
    NgOptimizedImage,
    RouterLink,
    Hero,
    TranslatePipe,
    Reveal,
    Flourish,
    SectionDivider,
    SectionHeader,
    Section,
    Card,
    Button,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  // Flat list -- app-rolling-carousel flows every image individually, it doesn't group them into
  // fixed "slides" the way the old Flowbite-wrapped app-carousel did.
  readonly images: ImageAsset[] = [
    { src: 'assets/artwork/kiara-01.jpeg', alt: 'Image 1', width: 1200, height: 1800 },
    { src: 'assets/artwork/fauna-01.jpeg', alt: 'Image 2', width: 1442, height: 2048 },
    { src: 'assets/artwork/fauna-02.jpeg', alt: 'Image 3', width: 999, height: 1332 },
    { src: 'assets/artwork/kronii-01.jpeg', alt: 'Image 4', width: 1080, height: 1350 },
    { src: 'assets/artwork/nimi-01.jpeg', alt: 'Image 5', width: 1080, height: 1350 },
    { src: 'assets/artwork/cecilia-01.jpg', alt: 'Image 6', width: 1500, height: 2000 },
    { src: 'assets/artwork/roka-01.jpeg', alt: 'Image 7', width: 900, height: 1200 },
    { src: 'assets/artwork/nimi-05.jpeg', alt: 'Image 8', width: 1500, height: 2000 },
    { src: 'assets/artwork/nimi-04.jpeg', alt: 'Image 9', width: 900, height: 1200 },
    { src: 'assets/artwork/shiori-01.jfif', alt: 'Image 10', width: 1200, height: 1600 },
    { src: 'assets/artwork/nimi-03.jfif', alt: 'Image 11', width: 900, height: 1200 },
    { src: 'assets/artwork/nimi-06.jfif', alt: 'Image 12', width: 1090, height: 1600 },
  ];
}
