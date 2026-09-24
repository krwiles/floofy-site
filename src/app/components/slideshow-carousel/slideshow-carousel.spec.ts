import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlideshowCarousel } from './slideshow-carousel';
import { ImageAsset } from '../../models/image-asset';

const IMAGES: ImageAsset[] = [
  { src: 'assets/one.jpg', alt: 'One', width: 400, height: 600 },
  { src: 'assets/two.jpg', alt: 'Two', width: 600, height: 400 },
  { src: 'assets/three.jpg', alt: 'Three', width: 500, height: 500 },
];

const ONE_IMAGE: ImageAsset[] = [{ src: 'assets/solo.jpg', alt: 'Solo', width: 400, height: 400 }];

describe('SlideshowCarousel', () => {
  let fixture: ComponentFixture<SlideshowCarousel>;

  function create(images: ImageAsset[] = IMAGES): ComponentFixture<SlideshowCarousel> {
    const f = TestBed.createComponent(SlideshowCarousel);
    f.componentRef.setInput('images', images);
    return f;
  }

  function visibleAlt(f: ComponentFixture<SlideshowCarousel>): string | null {
    const imgs: HTMLImageElement[] = Array.from(f.nativeElement.querySelectorAll('img'));
    const visible = imgs.find(
      (img) => img.closest('[aria-hidden="true"]') === null && img.getAttribute('aria-hidden') !== 'true',
    );
    return visible?.alt ?? null;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SlideshowCarousel] }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    fixture = create();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a looping clone before and after the real images, in the same order, for correct-direction wraparound', () => {
    fixture = create();
    fixture.detectChanges();

    const imgs: HTMLImageElement[] = Array.from(fixture.nativeElement.querySelectorAll('img'));
    expect(imgs.length).toBe(IMAGES.length + 2);
    expect(imgs[0].alt).toBe('Three'); // clone of the last image, leading
    expect(imgs[1].alt).toBe('One');
    expect(imgs[2].alt).toBe('Two');
    expect(imgs[3].alt).toBe('Three');
    expect(imgs[4].alt).toBe('One'); // clone of the first image, trailing
  });

  it('shows only the current slide to assistive tech and hides the rest', () => {
    fixture = create();
    fixture.detectChanges();

    expect(visibleAlt(fixture)).toBe('One');
  });

  it('renders no arrows and no clones with only one image', () => {
    fixture = create(ONE_IMAGE);
    fixture.detectChanges();

    const imgs = fixture.nativeElement.querySelectorAll('img');
    expect(imgs.length).toBe(1);
    expect(imgs[0].alt).toBe('Solo');
    expect(fixture.nativeElement.querySelectorAll('button').length).toBe(0);
  });

  it('calling next()/previous() on a single-image list is a harmless no-op', () => {
    fixture = create(ONE_IMAGE);
    fixture.detectChanges();

    expect(() => fixture.componentInstance.next()).not.toThrow();
    expect(() => fixture.componentInstance.previous()).not.toThrow();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Solo');
  });

  it('next() moves forward and wraps from the last image back to the first', () => {
    fixture = create();
    fixture.detectChanges();

    fixture.componentInstance.next();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Two');

    fixture.componentInstance.next();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Three');

    // Wraps forward past the last image back to the first.
    fixture.componentInstance.next();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('One');
  });

  it('previous() moves backward and wraps from the first image back to the last', () => {
    fixture = create();
    fixture.detectChanges();

    fixture.componentInstance.previous();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Three');
  });

  it('a rapid run of next() clicks past a loop point still lands on the correct image, without skipping or losing track', async () => {
    fixture = create();
    fixture.detectChanges();

    // 3 images: one full loop is 3 clicks. Firing 7 in a row (more than two full loops) before any of
    // the deferred loop-point resyncs get a chance to run, then letting them settle (real timers here
    // -- each resync's retry is itself scheduled from inside the previous one's callback, which fake
    // timers won't chain across separate advance calls the same way a real event loop does), should
    // still land exactly on image index (7 % 3) = 1 -> 'Two'.
    for (let i = 0; i < 7; i++) {
      fixture.componentInstance.next();
    }
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 50));
    fixture.detectChanges();

    expect(visibleAlt(fixture)).toBe('Two');
  });

  it("a fresh navigate landing before an earlier one's pending loop-boundary resync fires is not later overridden by that stale retry", async () => {
    fixture = create();
    fixture.detectChanges();

    // Walk forward past the loop boundary (One -> Two -> Three -> [clone of One]) and one step
    // further -- that 4th click starts on the clone slot, so it's the one that resyncs and leaves a
    // pending +1 retry behind. Its own resync already lands back on 'One' synchronously; the retry is
    // what's still outstanding when the fresher request below arrives.
    fixture.componentInstance.next();
    fixture.componentInstance.next();
    fixture.componentInstance.next();
    fixture.componentInstance.next();
    fixture.detectChanges();

    // Before that pending retry has a chance to fire (real timers, 0ms delay, checked with zero
    // elapsed time on purpose), the visitor changes their mind and goes back instead.
    fixture.componentInstance.previous();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Three'); // correct: one step back from the loop boundary.

    // Let every timer that's going to fire, fire.
    await new Promise((resolve) => setTimeout(resolve, 50));
    fixture.detectChanges();

    // Still 'Three' -- the stale, superseded +1 retry must not have silently resumed forward motion.
    expect(visibleAlt(fixture)).toBe('Three');
  });

  it('clicking the arrow buttons navigates, and they are labeled for assistive tech', () => {
    fixture = create();
    fixture.detectChanges();

    const [prevButton, nextButton]: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    expect(prevButton.getAttribute('aria-label')).toBeTruthy();
    expect(nextButton.getAttribute('aria-label')).toBeTruthy();

    nextButton.click();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Two');

    prevButton.click();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('One');
  });

  it('has no card framing of its own -- every slide is a plain image, never wrapped in [appCard]', () => {
    fixture = create();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[appCard]')).toBeFalsy();
    const imgs: HTMLImageElement[] = Array.from(fixture.nativeElement.querySelectorAll('img'));
    expect(imgs.length).toBe(IMAGES.length + 2);
    for (const img of imgs) {
      expect(img.classList.contains('slideshow-carousel__slide')).toBe(true);
    }
  });

  it('automatically advances after the interval, defaulting to 4s and overridable via the interval input', () => {
    vi.useFakeTimers();
    fixture = create();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('One');

    vi.advanceTimersByTime(4000);
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Two');

    fixture.componentRef.setInput('interval', 1000);
    fixture.detectChanges();
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Three');
  });

  it('pauses automatic advance on hover/focus and resumes once the visitor moves away', () => {
    vi.useFakeTimers();
    fixture = create();
    fixture.detectChanges();

    // `slideshow-carousel` is a host class (applied to the component's own element via `host: {}`,
    // not a child in the template), so the component's root *is* `.slideshow-carousel` already.
    const root: HTMLElement = fixture.nativeElement;
    root.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();

    vi.advanceTimersByTime(10_000);
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('One'); // still paused, no advance happened

    root.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    vi.advanceTimersByTime(4000);
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Two');
  });

  it('does not keep advancing, or throw, once the component is destroyed', () => {
    vi.useFakeTimers();
    fixture = create();
    fixture.detectChanges();

    fixture.destroy();
    expect(() => vi.advanceTimersByTime(60_000)).not.toThrow();
  });

  it('defaults the pause length to 4s and lets the page override it via the interval input', () => {
    fixture = create();
    fixture.detectChanges();
    expect(fixture.componentInstance.interval()).toBe(4000);

    fixture.componentRef.setInput('interval', 6000);
    expect(fixture.componentInstance.interval()).toBe(6000);
  });
});
