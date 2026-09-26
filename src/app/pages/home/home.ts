import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RollingCarousel } from '../../shared/components/rolling-carousel/rolling-carousel';
import { NgOptimizedImage } from '@angular/common';
import { GalleryImageService } from '../../services/gallery-image.service';
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
  readonly images = inject(GalleryImageService).imagesFor('home');
}
