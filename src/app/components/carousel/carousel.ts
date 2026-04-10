import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { CarouselImage } from '../../models/carousel-image.model';

@Component({
  selector: 'app-carousel',
  imports: [NgOptimizedImage],
  templateUrl: './carousel.html',
  styleUrl: './carousel.css',
})
export class Carousel {
  readonly images = input.required<CarouselImage[]>();
}
