import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RollingCarousel } from '../components/rolling-carousel/rolling-carousel';
import { NgOptimizedImage } from '@angular/common';
import { ImageAsset } from '../models/image-asset';
import { RouterLink } from '@angular/router';
import { Hero } from '../components/hero/hero';
import { TranslatePipe } from '../pipes/translate.pipe';
import { Reveal } from '../directives/reveal';
import { Flourish } from '../components/flourish/flourish';
import { SectionDivider } from '../components/section-divider/section-divider';
import { SectionHeader } from '../components/section-header/section-header';
import { Section } from '../components/section/section';
import { Card } from '../directives/card';
import { Button } from '../directives/button';

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
    { src: 'assets/G_CQjK1XkAALluE.jpeg', alt: 'Image 1', width: 1200, height: 1800 },
    { src: 'assets/G-Ewq9pagAA7Z-b.jpeg', alt: 'Image 2', width: 1442, height: 2048 },
    { src: 'assets/G8oM0YEasAAWxIg.jpeg', alt: 'Image 3', width: 999, height: 1332 },
    { src: 'assets/G-lXyxKbQAMHkV_.jpeg', alt: 'Image 4', width: 1080, height: 1350 },
    { src: 'assets/G8s5y4ZakAA0XN9.jpeg', alt: 'Image 5', width: 1080, height: 1350 },
    { src: 'assets/G0iHCdnaIAA5IDY.jpg', alt: 'Image 6', width: 1500, height: 2000 },
    { src: 'assets/HFImiOIbkAAPgg6.jpeg', alt: 'Image 7', width: 900, height: 1200 },
    { src: 'assets/HGl6r3xbcAAy7uU.jpeg', alt: 'Image 8', width: 1500, height: 2000 },
    { src: 'assets/HFT6u19bsAAQG-z.jpeg', alt: 'Image 9', width: 900, height: 1200 },
    { src: 'assets/G1yNfrpbAAAEPTp.jfif', alt: 'Image 10', width: 1200, height: 1600 },
    { src: 'assets/GyfSzJfaIAAn9qh.jfif', alt: 'Image 11', width: 900, height: 1200 },
    { src: 'assets/HJLDmNTbgAAbNwI.jfif', alt: 'Image 12', width: 1090, height: 1600 },
  ];
}
