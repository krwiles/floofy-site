import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ImageAsset } from '../../../models/image-asset';
import { Tone } from '../../../models/tone';
import { Card } from '../../directives/card';

/**
 * A decorative, continuously scrolling strip of images, with no controls by design -- see
 * docs/refactor/specs/app-rolling-carousel.md. The list renders twice back to back and the track slides by one copy's
 * width, so the loop is seamless. The whole strip is `aria-hidden`, being decoration.
 */
@Component({
  selector: 'app-rolling-carousel',
  imports: [NgOptimizedImage, Card],
  templateUrl: './rolling-carousel.html',
  styleUrl: './rolling-carousel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RollingCarousel {
  readonly images = input.required<ImageAsset[]>();

  /** CSS height every image scales to (its width follows its own aspect ratio). */
  readonly height = input('16rem');

  /** Frames every image as an `[appCard][noBackground]` for this tone (shadow, rounded corners); `null` means plain. */
  readonly cardTone = input<Tone | null>(null);

  /** Seconds for one full loop of the images (lower is faster); set by the page, not the visitor. */
  readonly speed = input(30);
}
