import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ImageAsset } from '../../../models/image-asset';
import { Tone } from '../../../models/tone';
import { Card } from '../../directives/card';

/**
 * A continuously auto-scrolling horizontal strip of images -- a purely
 * decorative, ambient preview, not a navigable carousel (see
 * docs/refactor/specs/app-rolling-carousel.md). No manual controls, no
 * indicators, no click interactivity by design.
 *
 * The image list is rendered twice, back to back, and the whole track is
 * translated by exactly one copy's width (see rolling-carousel.css) -- since
 * the second copy is identical to the first, the loop point is invisible.
 * The second copy is `aria-hidden` so assistive tech only ever encounters
 * each image once, not twice.
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

  /**
   * When set, every image is framed in `[appCard][noBackground]` for this
   * tone (shadow + rounded corners, no fill -- see cards.css). `null`
   * (default) renders plain images with no frame. One setting for the
   * whole strip, not per image -- [appCard] itself requires a `tone`
   * outside `glass` mode, so this can't be a plain boolean without also
   * knowing which tone's shadow to use.
   */
  readonly cardTone = input<Tone | null>(null);

  /**
   * Seconds for one full loop of the image list -- lower is faster. A
   * component input for the page author to tune, not a visitor-facing
   * control (see the spec's Non-goals).
   */
  readonly speed = input(30);
}
