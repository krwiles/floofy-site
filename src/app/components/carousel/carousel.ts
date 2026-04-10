import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-carousel',
  imports: [NgOptimizedImage],
  templateUrl: './carousel.html',
  styleUrl: './carousel.css',
})
export class Carousel {
  images = [
    { src: '/G_CQjK1XkAALluE.jpeg', alt: 'Image 1' },
    { src: '/G-Ewq9pagAA7Z-b.jpeg', alt: 'Image 2' },
    { src: '/G8oM0YEasAAWxIg.jpeg', alt: 'Image 3' },
    { src: '/G-lXyxKbQAMHkV_.jpeg', alt: 'Image 4' },
    { src: '/G8s5y4ZakAA0XN9.jpeg', alt: 'Image 5' },
  ];
}
