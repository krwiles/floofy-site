import { AfterViewInit, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { initCarousels } from 'flowbite';
import { CarouselImage } from '../../models/carousel-image.model';

@Component({
  selector: 'app-carousel',
  imports: [NgOptimizedImage],
  templateUrl: './carousel.html',
  styleUrl: './carousel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Carousel implements AfterViewInit {
  readonly images = input.required<CarouselImage[]>();

  ngAfterViewInit(): void {
    // Initialize Flowbite carousels after routing to ensure they work correctly
    initCarousels();
  }
}
