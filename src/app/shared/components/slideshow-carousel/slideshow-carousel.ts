import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, input, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ImageAsset } from '../../../models/image-asset';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * One image at a time, auto-advancing and looping endlessly in both directions, usable by mouse, keyboard or touch
 * -- see docs/refactor/specs/app-slideshow-carousel.md. Each instance runs independently. It has no frame of its
 * own; put `[appCard]` on the host to frame it.
 *
 * Looping: the track has a clone of the last image before the list and of the first after it, so there's always a
 * slide on the correct side to move to. Landing on a clone is fine (it looks identical); `navigate` silently resyncs
 * off it before the next move.
 *
 * Known unresolved bug: after the arrows are used, it occasionally reverses or jumps back -- see the "Known issue"
 * in docs/refactor/05-roadmap.md.
 */
@Component({
  selector: 'app-slideshow-carousel',
  imports: [NgOptimizedImage, TranslatePipe],
  host: {
    class: 'slideshow-carousel',
    '(mouseenter)': 'pause()',
    '(mouseleave)': 'resume()',
    '(focusin)': 'pause()',
    '(focusout)': 'resume()',
    '(touchstart)': 'onTouchStart($event)',
    '(touchmove)': 'onTouchMove($event)',
    '(touchend)': 'onTouchEnd()',
    '(touchcancel)': 'onTouchEnd()',
  },
  templateUrl: './slideshow-carousel.html',
  styleUrl: './slideshow-carousel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlideshowCarousel implements OnDestroy {
  readonly images = input.required<ImageAsset[]>();
  /** How long to pause on each image before automatically advancing, in ms. */
  readonly interval = input(4000);

  // Arrows, swiping and auto-advance only make sense with more than one image.
  readonly hasMultipleImages = computed(() => this.images().length > 1);

  // The track the slides move along: one clone of the last image before the list, one of the first after it.
  readonly trackSlides = computed<ImageAsset[]>(() => {
    const imgs = this.images();
    return imgs.length > 1 ? [imgs[imgs.length - 1], ...imgs, imgs[0]] : imgs;
  });

  /** Index into `trackSlides()`; -1 until the first effect can read the required `images` input and pick a start. */
  readonly position = signal(-1);
  /** True only for the one silent, un-transitioned frame that resyncs off a clone slot -- see `navigate`. */
  readonly instant = signal(false);

  private readonly paused = signal(false);
  private autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  private resyncTimer: ReturnType<typeof setTimeout> | null = null;
  /** Which direction the in-flight `resyncTimer`'s retry (if any) is going to move once it fires. */
  private pendingResyncDelta: 1 | -1 | null = null;

  private touchStartX: number | null = null;
  private touchStartY: number | null = null;
  private touchDeltaX = 0;
  private readonly swipeThresholdPx = 40;
  /** How far a touch has to move before its direction (horizontal vs. vertical scroll) is trusted. */
  private readonly swipeIntentPx = 10;

  constructor() {
    // Start on the first real slide once images() is readable (slot 1 when clones exist, else slot 0).
    effect(() => {
      if (this.position() === -1) {
        this.position.set(this.hasMultipleImages() ? 1 : 0);
      }
    });

    effect(() => {
      // Restart the auto-advance wait after every move (position() is read only to subscribe); skip the silent
      // resync frame, which is followed a tick later by the real move.
      this.position();
      const shouldRun = this.hasMultipleImages() && !this.paused() && !this.instant();

      this.clearAutoAdvanceTimer();
      if (shouldRun) {
        this.autoAdvanceTimer = setTimeout(() => this.navigate(1), this.interval());
      }
    });
  }

  ngOnDestroy(): void {
    // Stop both timers so nothing fires after the component is gone.
    this.clearAutoAdvanceTimer();
    if (this.resyncTimer !== null) {
      clearTimeout(this.resyncTimer);
      this.resyncTimer = null;
      this.pendingResyncDelta = null;
    }
  }

  next(): void {
    // Arrow / auto-advance: one slide forward.
    this.navigate(1);
  }

  previous(): void {
    // Arrow: one slide back.
    this.navigate(-1);
  }

  pause(): void {
    // Hovering, focusing or touching stops auto-advance...
    this.paused.set(true);
  }

  resume(): void {
    // ...and leaving resumes it.
    this.paused.set(false);
  }

  /** Position of the slide at `trackIndex`, in track-widths, relative to the one currently shown. */
  offsetFor(trackIndex: number): number {
    // 0 is the current slide; -1 the one before; +1 the one after.
    return trackIndex - this.position();
  }

  /**
   * Horizontal scale for the slide at `trackIndex`: 1 for the current slide, slightly less for the rest. Sub-pixel
   * rounding of a neighbor's `translateX(±100%)` can leave a sliver of it visible at the seam, which shows through
   * transparent art; shrinking non-current slides leaves nothing at the seam to creep in. (Growing the current slide
   * instead made neighbors overlap each other.)
   */
  scaleFor(trackIndex: number): number {
    // Full size for the current slide; 99% wide for the rest, so no neighbor sliver can show at the seam.
    return this.offsetFor(trackIndex) === 0 ? 1 : 0.99;
  }

  /**
   * The slide's inline `transform`. `scaleX()` comes after `translateX()`, so the shrink doesn't change how far each
   * slide moves; it's horizontal only because slides never move vertically.
   */
  transformFor(trackIndex: number): string {
    // Slide into place, then apply the small horizontal shrink.
    return `translateX(${this.offsetFor(trackIndex) * 100}%) scaleX(${this.scaleFor(trackIndex)})`;
  }

  onTouchStart(event: TouchEvent): void {
    // Hold auto-advance while the finger is down, and remember where the touch began.
    this.pause();
    this.touchStartX = event.touches[0]?.clientX ?? null;
    this.touchStartY = event.touches[0]?.clientY ?? null;
    this.touchDeltaX = 0;
  }

  onTouchMove(event: TouchEvent): void {
    // Ignore moves that didn't start with a tracked touch.
    if (this.touchStartX === null || this.touchStartY === null) {
      return;
    }
    const touch = event.touches[0];
    if (touch === undefined) {
      return;
    }
    // How far the finger has moved each way.
    this.touchDeltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    // Once the drag is clearly sideways, claim it as a swipe, so the browser doesn't scroll or swipe-navigate;
    // a mostly vertical drag still scrolls the page.
    if (Math.abs(this.touchDeltaX) > this.swipeIntentPx && Math.abs(this.touchDeltaX) > Math.abs(deltaY)) {
      event.preventDefault();
    }
  }

  onTouchEnd(): void {
    // A long enough swipe moves one slide: left goes forward, right goes back.
    if (Math.abs(this.touchDeltaX) >= this.swipeThresholdPx) {
      this.navigate(this.touchDeltaX < 0 ? 1 : -1);
    }
    // Reset the touch, and let auto-advance continue.
    this.touchStartX = null;
    this.touchStartY = null;
    this.touchDeltaX = 0;
    this.resume();
  }

  private navigate(delta: 1 | -1): void {
    if (!this.hasMultipleImages()) {
      // One image: nothing to move to (the template hides the arrows too).
      return;
    }

    if (this.resyncTimer !== null && this.pendingResyncDelta !== delta) {
      // A pending resync retry going the other way is stale (the visitor changed direction), so drop it; a
      // same-direction retry is left alone so bursts don't lose a step.
      clearTimeout(this.resyncTimer);
      this.resyncTimer = null;
      this.pendingResyncDelta = null;
    }

    // Where we are along the padded track.
    const len = this.images().length;
    const pos = this.position();

    if (pos === 0 || pos === len + 1) {
      // On a clone slot after a loop-around: jump silently to the real slide it mirrors, then retry this move next
      // tick, once that jump has painted (the clone looks identical, so nothing visibly changes).
      this.instant.set(true);
      this.position.set(pos === 0 ? len : 1);
      this.pendingResyncDelta = delta;

      // A 0ms timeout rather than requestAnimationFrame: simpler and testable; a rare flicker under heavy load
      // is an accepted cosmetic risk.
      this.resyncTimer = setTimeout(() => {
        this.resyncTimer = null;
        this.pendingResyncDelta = null;
        this.instant.set(false);
        this.navigate(delta);
      }, 0);
      return;
    }

    // Normal case: slide one step that way.
    this.position.update((p) => p + delta);
  }

  private clearAutoAdvanceTimer(): void {
    // Cancel the pending auto-advance, if any.
    if (this.autoAdvanceTimer !== null) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }
}
