import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, input, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ImageAsset } from '../../models/image-asset';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * One image at a time, auto-advancing, looping endlessly forward and backward, usable by mouse,
 * keyboard, or touch -- see docs/refactor/specs/app-slideshow-carousel.md. Every instance on a page
 * runs fully independently (its own timer, its own position); nothing here is shared/global.
 *
 * No card framing of its own (deliberately -- see the spec): every slide is a plain rectangular image,
 * so nothing here casts a shadow onto its sliding neighbor. A page that wants the whole carousel framed
 * applies `[appCard]` directly to this component's own host tag, exactly like it would for any other
 * element -- `card-on-section-{tone}`'s own `overflow: hidden` + `border-radius` then clips the image
 * to match, no extra plumbing needed here.
 *
 * Looping technique: `images()` is rendered with one extra clone of the last image prepended and one
 * clone of the first image appended (`trackSlides`), so there's always a real slide immediately either
 * side of the current one to slide to -- without that, "wrapping" from the last image back to the first
 * would have to jump the wrong way (backward) to land on it, which fails the "always in the correct
 * direction" requirement. `position` indexes into that padded track and drives every slide's transform
 * (`offsetFor`); landing exactly on a clone slot (0 or `len+1`) is expected and harmless to sit at
 * indefinitely (a clone is pixel-identical to the real slide it stands in for) -- see `navigate` for how
 * it gets silently resynced the next time a move is actually requested.
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

  readonly hasMultipleImages = computed(() => this.images().length > 1);

  readonly trackSlides = computed<ImageAsset[]>(() => {
    const imgs = this.images();
    return imgs.length > 1 ? [imgs[imgs.length - 1], ...imgs, imgs[0]] : imgs;
  });

  /** Index into `trackSlides()`. -1 is a placeholder meaning "not yet settled onto a real starting
      slot" -- corrected to the first real slide (once clones exist to start between) by the effect
      below, as soon as `images()` is actually readable. A required input can't be read from a field
      initializer or the constructor body directly, only from reactive contexts like this. */
  readonly position = signal(-1);
  /** True only for the one silent, un-transitioned frame that resyncs off a clone slot -- see `navigate`. */
  readonly instant = signal(false);

  private readonly paused = signal(false);
  private autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  private resyncTimer: ReturnType<typeof setTimeout> | null = null;

  private touchStartX: number | null = null;
  private touchStartY: number | null = null;
  private touchDeltaX = 0;
  private readonly swipeThresholdPx = 40;
  /** How far a touch has to move before its direction (horizontal vs. vertical scroll) is trusted. */
  private readonly swipeIntentPx = 10;

  constructor() {
    effect(() => {
      if (this.position() === -1) {
        this.position.set(this.hasMultipleImages() ? 1 : 0);
      }
    });

    effect(() => {
      // Re-read position() purely to make every navigation (manual or automatic) restart the wait --
      // its value isn't otherwise needed here. Skip while instant() is true: a loop-boundary resync
      // touches position() twice in quick succession (the silent jump, then the retried move on the
      // next tick) and only the second of those is a real, settled navigation worth timing from --
      // restarting the wait for the first one too would just be discarded a moment later anyway.
      this.position();
      const shouldRun = this.hasMultipleImages() && !this.paused() && !this.instant();

      this.clearAutoAdvanceTimer();
      if (shouldRun) {
        this.autoAdvanceTimer = setTimeout(() => this.navigate(1), this.interval());
      }
    });
  }

  ngOnDestroy(): void {
    this.clearAutoAdvanceTimer();
    if (this.resyncTimer !== null) {
      clearTimeout(this.resyncTimer);
      this.resyncTimer = null;
    }
  }

  next(): void {
    this.navigate(1);
  }

  previous(): void {
    this.navigate(-1);
  }

  pause(): void {
    this.paused.set(true);
  }

  resume(): void {
    this.paused.set(false);
  }

  /** Position of the slide at `trackIndex`, in track-widths, relative to the one currently shown. */
  offsetFor(trackIndex: number): number {
    return trackIndex - this.position();
  }

  onTouchStart(event: TouchEvent): void {
    this.pause();
    this.touchStartX = event.touches[0]?.clientX ?? null;
    this.touchStartY = event.touches[0]?.clientY ?? null;
    this.touchDeltaX = 0;
  }

  onTouchMove(event: TouchEvent): void {
    if (this.touchStartX === null || this.touchStartY === null) {
      return;
    }
    const touch = event.touches[0];
    if (touch === undefined) {
      return;
    }
    this.touchDeltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    // Once the drag is clearly more horizontal than vertical, claim the gesture as the carousel's own
    // swipe -- otherwise the browser is free to treat it as a page scroll, or (nearer the screen edge,
    // on mobile Safari/Chrome) its own swipe-to-go-back navigation, either of which would fight this
    // component's own transform or navigate the visitor away entirely. Left alone below that
    // threshold so an actually-vertical drag still scrolls the page normally.
    if (Math.abs(this.touchDeltaX) > this.swipeIntentPx && Math.abs(this.touchDeltaX) > Math.abs(deltaY)) {
      event.preventDefault();
    }
  }

  onTouchEnd(): void {
    if (Math.abs(this.touchDeltaX) >= this.swipeThresholdPx) {
      this.navigate(this.touchDeltaX < 0 ? 1 : -1);
    }
    this.touchStartX = null;
    this.touchStartY = null;
    this.touchDeltaX = 0;
    this.resume();
  }

  private navigate(delta: 1 | -1): void {
    if (!this.hasMultipleImages()) {
      // Only one image: no transition is possible, so there's nothing to move to (matches the spec's
      // "only one image to show" edge case -- the template also hides the arrows in this case).
      return;
    }

    const len = this.images().length;
    const pos = this.position();

    if (pos === 0 || pos === len + 1) {
      // Sitting on a clone slot from a previous loop-around: silently resync to its real equivalent
      // with no transition, then retry this exact move next tick, once the browser has had a chance to
      // paint that resync. Re-entering `navigate` (rather than just applying `delta` here) matters for
      // a burst of rapid clicks/swipes that lands back on a clone slot again before the retry fires --
      // it re-checks the same bounds instead of blindly stepping past the track's edge. The resync
      // itself never changes what's actually showing (a clone is pixel-identical to the real slide it
      // stands in for), so nothing is visually lost, only delayed by a tick.
      this.instant.set(true);
      this.position.set(pos === 0 ? len : 1);

      if (this.resyncTimer !== null) {
        clearTimeout(this.resyncTimer);
      }
      // A plain 0ms timeout, not double-rAF: this is a deliberate simplicity/testability trade-off --
      // browsers paint between macrotasks under normal load, so in practice this is enough for the
      // resync above to actually be invisible; under heavy main-thread contention it could in theory
      // fire before that paint and show as a brief flicker instead, which is a low-severity cosmetic
      // risk worth accepting here rather than pulling in rAF-based scheduling (and the fake-timer
      // gymnastics that would need in the spec) for it.
      this.resyncTimer = setTimeout(() => {
        this.resyncTimer = null;
        this.instant.set(false);
        this.navigate(delta);
      }, 0);
      return;
    }

    this.position.update((p) => p + delta);
  }

  private clearAutoAdvanceTimer(): void {
    if (this.autoAdvanceTimer !== null) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }
}
