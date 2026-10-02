import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlideshowCarousel } from './slideshow-carousel';
import { ImageAsset } from '../../../models/image-asset';

// Three test images, so wrapping is distinguishable from stepping.
const IMAGES: ImageAsset[] = [
  { src: 'assets/one.jpg', alt: 'One', width: 400, height: 600 },
  { src: 'assets/two.jpg', alt: 'Two', width: 600, height: 400 },
  { src: 'assets/three.jpg', alt: 'Three', width: 500, height: 500 },
];

// A single image, for the "nothing to slide to" cases.
const ONE_IMAGE: ImageAsset[] = [{ src: 'assets/solo.jpg', alt: 'Solo', width: 400, height: 400 }];

describe('SlideshowCarousel', () => {
  let fixture: ComponentFixture<SlideshowCarousel>;

  function create(images: ImageAsset[] = IMAGES): ComponentFixture<SlideshowCarousel> {
    // Create the carousel with the given images, leaving the first render to each test.
    const f = TestBed.createComponent(SlideshowCarousel);
    f.componentRef.setInput('images', images);
    return f;
  }

  function visibleAlt(f: ComponentFixture<SlideshowCarousel>): string | null {
    // The alt of the one image screen readers can see, i.e. the current slide.
    const imgs: HTMLImageElement[] = Array.from(f.nativeElement.querySelectorAll('img'));
    const visible = imgs.find(
      (img) => img.closest('[aria-hidden="true"]') === null && img.getAttribute('aria-hidden') !== 'true',
    );
    return visible?.alt ?? null;
  }

  beforeEach(async () => {
    // Compile the component once per test.
    await TestBed.configureTestingModule({ imports: [SlideshowCarousel] }).compileComponents();
  });

  afterEach(() => {
    // Some tests switch to fake timers; always switch back.
    vi.useRealTimers();
  });

  it('should create', () => {
    // Act: render.
    fixture = create();
    fixture.detectChanges();
    // Assert: it builds.
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a looping clone before and after the real images, in the same order, for correct-direction wraparound', () => {
    // Act: render.
    fixture = create();
    fixture.detectChanges();

    // Assert: the real images, with a clone of the last before them and of the first after.
    const imgs: HTMLImageElement[] = Array.from(fixture.nativeElement.querySelectorAll('img'));
    expect(imgs.length).toBe(IMAGES.length + 2);
    expect(imgs[0].alt).toBe('Three'); // clone of the last image, leading
    expect(imgs[1].alt).toBe('One');
    expect(imgs[2].alt).toBe('Two');
    expect(imgs[3].alt).toBe('Three');
    expect(imgs[4].alt).toBe('One'); // clone of the first image, trailing
  });

  it('shows only the current slide to assistive tech and hides the rest', () => {
    // Act: render.
    fixture = create();
    fixture.detectChanges();

    // Assert: only the first real slide is exposed.
    expect(visibleAlt(fixture)).toBe('One');
  });

  it("keeps the current slide at full size and shrinks every other slide slightly, to hide the sub-pixel seam, without disturbing any slide's position", () => {
    // Act: render.
    fixture = create();
    fixture.detectChanges();

    // Assert: the current slide (track index 1, offset 0) is full size and exactly in place...
    expect(fixture.componentInstance.scaleFor(1)).toBe(1);
    const current = fixture.componentInstance.transformFor(1);
    expect(current).toBe('translateX(0%) scaleX(1)');

    // ...every other slide (any nonzero offset) is shrunk by the same amount...
    expect(fixture.componentInstance.scaleFor(2)).toBeLessThan(1);
    expect(fixture.componentInstance.scaleFor(0)).toBe(fixture.componentInstance.scaleFor(2));

    // ...and the shrink is applied after the move, so it doesn't change the distance (see transformFor).
    const next = fixture.componentInstance.transformFor(2);
    expect(next.indexOf('translateX')).toBeLessThan(next.indexOf('scaleX'));
    expect(next).toBe(`translateX(100%) scaleX(${fixture.componentInstance.scaleFor(2)})`);
  });

  it('renders no arrows and no clones with only one image', () => {
    // Act: render one image.
    fixture = create(ONE_IMAGE);
    fixture.detectChanges();

    // Assert: no clones and no arrows.
    const imgs = fixture.nativeElement.querySelectorAll('img');
    expect(imgs.length).toBe(1);
    expect(imgs[0].alt).toBe('Solo');
    expect(fixture.nativeElement.querySelectorAll('button').length).toBe(0);
  });

  it('calling next()/previous() on a single-image list is a harmless no-op', () => {
    // Arrange: render one image.
    fixture = create(ONE_IMAGE);
    fixture.detectChanges();

    // Act and assert: stepping either way neither throws nor moves.
    expect(() => fixture.componentInstance.next()).not.toThrow();
    expect(() => fixture.componentInstance.previous()).not.toThrow();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Solo');
  });

  it('next() moves forward and wraps from the last image back to the first', () => {
    // Arrange: render.
    fixture = create();
    fixture.detectChanges();

    // Act and assert: forward to Two, then Three...
    fixture.componentInstance.next();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Two');

    fixture.componentInstance.next();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Three');

    // ...then past the end, back to One.
    fixture.componentInstance.next();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('One');
  });

  it('previous() moves backward and wraps from the first image back to the last', () => {
    // Arrange: render.
    fixture = create();
    fixture.detectChanges();

    // Act and assert: back from the first image wraps to the last.
    fixture.componentInstance.previous();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Three');
  });

  it('a rapid run of next() clicks past a loop point still lands on the correct image, without skipping or losing track', async () => {
    // Arrange: render.
    fixture = create();
    fixture.detectChanges();

    // Act: seven quick clicks (two full loops and one), with real timers so the chained resync retries can run.
    for (let i = 0; i < 7; i++) {
      fixture.componentInstance.next();
    }
    fixture.detectChanges();

    // Let the retries settle.
    await new Promise((resolve) => setTimeout(resolve, 50));
    fixture.detectChanges();

    // Assert: landed on 7 % 3 = image 1, "Two".
    expect(visibleAlt(fixture)).toBe('Two');
  });

  it("a fresh navigate landing before an earlier one's pending loop-boundary resync fires is not later overridden by that stale retry", async () => {
    // Arrange: render.
    fixture = create();
    fixture.detectChanges();

    // Act: four steps forward; the fourth starts on the trailing clone, so it resyncs and leaves a +1 retry pending.
    fixture.componentInstance.next();
    fixture.componentInstance.next();
    fixture.componentInstance.next();
    fixture.componentInstance.next();
    fixture.detectChanges();

    // Before that retry fires, go back instead.
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
    // Arrange: render.
    fixture = create();
    fixture.detectChanges();

    // Assert: both arrows have accessible labels.
    const [prevButton, nextButton]: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    expect(prevButton.getAttribute('aria-label')).toBeTruthy();
    expect(nextButton.getAttribute('aria-label')).toBeTruthy();

    // Act and assert: the next arrow moves forward...
    nextButton.click();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Two');

    // ...and the previous arrow moves back.
    prevButton.click();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('One');
  });

  it('has no card framing of its own -- every slide is a plain image, never wrapped in [appCard]', () => {
    // Act: render.
    fixture = create();
    fixture.detectChanges();

    // Assert: no card wrapper; every image is a plain slide.
    expect(fixture.nativeElement.querySelector('[appCard]')).toBeFalsy();
    const imgs: HTMLImageElement[] = Array.from(fixture.nativeElement.querySelectorAll('img'));
    expect(imgs.length).toBe(IMAGES.length + 2);
    for (const img of imgs) {
      expect(img.classList.contains('slideshow-carousel__slide')).toBe(true);
    }
  });

  it('automatically advances after the interval, defaulting to 4s and overridable via the interval input', () => {
    // Arrange: fake timers, then render.
    vi.useFakeTimers();
    fixture = create();
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('One');

    // Act and assert: after the default 4s it advances...
    vi.advanceTimersByTime(4000);
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Two');

    // ...and a shorter interval takes effect for the next wait.
    fixture.componentRef.setInput('interval', 1000);
    fixture.detectChanges();
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Three');
  });

  it('pauses automatic advance on hover/focus and resumes once the visitor moves away', () => {
    // Arrange: fake timers, then render.
    vi.useFakeTimers();
    fixture = create();
    fixture.detectChanges();

    // The host element itself carries the hover/focus listeners.
    const root: HTMLElement = fixture.nativeElement;
    root.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();

    // Act and assert: even 10s later, no advance while hovered.
    vi.advanceTimersByTime(10_000);
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('One'); // still paused, no advance happened

    // Act and assert: after the mouse leaves, the next 4s wait advances.
    root.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    vi.advanceTimersByTime(4000);
    fixture.detectChanges();
    expect(visibleAlt(fixture)).toBe('Two');
  });

  it('does not keep advancing, or throw, once the component is destroyed', () => {
    // Arrange: fake timers, then render.
    vi.useFakeTimers();
    fixture = create();
    fixture.detectChanges();

    // Act: destroy the component.
    fixture.destroy();
    // Assert: no pending timer fires into it.
    expect(() => vi.advanceTimersByTime(60_000)).not.toThrow();
  });

  it('defaults the pause length to 4s and lets the page override it via the interval input', () => {
    // Act: render.
    fixture = create();
    fixture.detectChanges();
    // Assert: 4s by default...
    expect(fixture.componentInstance.interval()).toBe(4000);

    // ...and the interval input overrides it.
    fixture.componentRef.setInput('interval', 6000);
    expect(fixture.componentInstance.interval()).toBe(6000);
  });
});
