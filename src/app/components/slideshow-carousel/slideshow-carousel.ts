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
  /** Which direction the in-flight `resyncTimer`'s retry (if any) is going to move once it fires. */
  private pendingResyncDelta: 1 | -1 | null = null;

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
      this.pendingResyncDelta = null;
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

  /** How much to shrink the slide at `trackIndex` horizontally: 1 (full size) for the one currently
      shown, slightly less for every other slide. Every slide's *position* (`translateX`) is already
      exact -- `translateX(0%)` for the current slide has no rounding to go wrong in the first place --
      but an *adjacent* slide's `translateX(+-100%)`, `+-200%`, etc. is a percentage of the viewport's
      own (rarely whole-number) pixel width, and the browser's sub-pixel rounding of that can leave a
      hairline of the adjacent slide creeping into view at the seam. On an opaque image that's
      invisible; on one with a transparent background (the emote/chibi art), the visible artwork of
      that sliver of the *neighboring* image shows through. Pulling every non-current slide in by a
      safety margin (its own box, not the seam) that's far bigger than any possible rounding error
      means there's nothing left at the seam for a neighbor to creep into -- rather than trying to grow
      the current slide to cover a creeping neighbor, which was tried first and made things worse: it
      shrinks or grows every slide the *same* amount, so adjacent (still 100%-apart) slides end up
      overlapping *each other*, and plain DOM order (not which one is actually current) decides which
      one's edge wins that overlap. Shrinking instead of growing has no equivalent failure mode --
      there's no "growing into the neighbor" to get backward, since nothing here ever grows. */
  scaleFor(trackIndex: number): number {
    return this.offsetFor(trackIndex) === 0 ? 1 : 0.99;
  }

  /** The full inline `transform` for the slide at `trackIndex`: its slide position, plus `scaleFor`'s
      horizontal-only shrink. `scaleX()` comes *after* `translateX()`, not before: composed right-to-
      left, that means the scale applies first (in the slide's own local space) and the translate
      second, so the translate's percentage keeps resolving against the slide's real, unscaled width --
      moving each slide by exactly one slide-width regardless of the cosmetic shrink. Reversing the
      order would scale the translate distance too, drifting every slide's position by that same small
      factor. Horizontal-only (`scaleX`, not `scale`): slides are never offset vertically, so there's no
      equivalent vertical rounding error to guard against, and shrinking the height too would just add
      pointless letterboxing above/below every inactive slide. */
  transformFor(trackIndex: number): string {
    return `translateX(${this.offsetFor(trackIndex) * 100}%) scaleX(${this.scaleFor(trackIndex)})`;
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

    if (this.resyncTimer !== null && this.pendingResyncDelta !== delta) {
      // A resync is in flight, but its retry (still a 0ms timeout away, not literally synchronous)
      // was going to move in the *other* direction -- the visitor has changed their mind since that
      // retry was scheduled, so it no longer reflects what should happen and gets dropped. Left alone
      // when the direction matches (the common case: a burst of same-direction clicks/auto-advance
      // ticks) -- that retry still correctly finishes the earlier move once it fires; dropping it
      // unconditionally here would silently swallow one legitimate step every time a burst happens to
      // land on a loop boundary. This was a real bug -- found via the owner noticing the carousel
      // occasionally reversing direction/jumping back after using the arrows -- and the fix needs to
      // be this narrow: the original, cruder attempt (clearing on *every* fresh call, regardless of
      // direction) broke same-direction bursts instead.
      clearTimeout(this.resyncTimer);
      this.resyncTimer = null;
      this.pendingResyncDelta = null;
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
      this.pendingResyncDelta = delta;

      // A plain 0ms timeout, not double-rAF: this is a deliberate simplicity/testability trade-off --
      // browsers paint between macrotasks under normal load, so in practice this is enough for the
      // resync above to actually be invisible; under heavy main-thread contention it could in theory
      // fire before that paint and show as a brief flicker instead, which is a low-severity cosmetic
      // risk worth accepting here rather than pulling in rAF-based scheduling (and the fake-timer
      // gymnastics that would need in the spec) for it.
      this.resyncTimer = setTimeout(() => {
        this.resyncTimer = null;
        this.pendingResyncDelta = null;
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
