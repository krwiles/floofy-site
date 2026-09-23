import { AfterViewInit, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { initCarousels } from 'flowbite';
import { ImageAsset } from '../../models/image-asset';

@Component({
  selector: 'app-carousel',
  imports: [NgOptimizedImage],
  templateUrl: './carousel.html',
  styleUrl: './carousel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Carousel implements AfterViewInit {
  readonly images = input.required<ImageAsset[][]>();
  readonly controls = input<boolean>();

  ngAfterViewInit(): void {
    // Initialize Flowbite carousels after routing to ensure they work correctly
    initCarousels();
  }
}
