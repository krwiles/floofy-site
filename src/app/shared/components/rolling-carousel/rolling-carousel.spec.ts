import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RollingCarousel } from './rolling-carousel';
import { ImageAsset } from '../../../models/image-asset';

// Two test images of different shapes.
const IMAGES: ImageAsset[] = [
  { src: 'assets/one.jpg', alt: 'One', width: 400, height: 600 },
  { src: 'assets/two.jpg', alt: 'Two', width: 600, height: 400 },
];

describe('RollingCarousel', () => {
  let fixture: ComponentFixture<RollingCarousel>;

  function create(): ComponentFixture<RollingCarousel> {
    // Create the carousel with the test images, leaving the first render to each test.
    const f = TestBed.createComponent(RollingCarousel);
    f.componentRef.setInput('images', IMAGES);
    return f;
  }

  beforeEach(async () => {
    // Compile the component once per test.
    await TestBed.configureTestingModule({ imports: [RollingCarousel] }).compileComponents();
  });

  it('should create', () => {
    // Act: render.
    fixture = create();
    fixture.detectChanges();
    // Assert: it builds.
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the image list twice, back to back, for a seamless loop', () => {
    // Act: render.
    fixture = create();
    fixture.detectChanges();

    // Assert: each image appears twice, in order.
    const imgs = fixture.nativeElement.querySelectorAll('img');
    expect(imgs.length).toBe(IMAGES.length * 2);
    // First copy, in order.
    expect(imgs[0].alt).toBe('One');
    expect(imgs[1].alt).toBe('Two');
    // Second (duplicate) copy, same order.
    expect(imgs[2].alt).toBe('One');
    expect(imgs[3].alt).toBe('Two');
  });

  it('hides the whole strip from assistive tech -- a purely decorative, ambient preview', () => {
    // Act: render.
    fixture = create();
    fixture.detectChanges();

    // Assert: the whole strip is hidden from screen readers.
    const root = fixture.nativeElement.querySelector('.rolling-carousel');
    expect(root.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders plain images with no card wrapper when cardTone is not set', () => {
    // Act: render without cardTone.
    fixture = create();
    fixture.detectChanges();

    // Assert: no card frames.
    expect(fixture.nativeElement.querySelector('[appCard]')).toBeFalsy();
  });

  it('wraps every image in an [appCard][noBackground] frame for the given tone when cardTone is set', () => {
    // Act: render with a dark cardTone.
    fixture = create();
    fixture.componentRef.setInput('cardTone', 'dark');
    fixture.detectChanges();

    // Assert: every image (both copies) sits in a dark shadow frame.
    const frames = fixture.nativeElement.querySelectorAll('.card-shadow-dark');
    expect(frames.length).toBe(IMAGES.length * 2);
    for (const frame of Array.from(frames)) {
      expect((frame as HTMLElement).querySelector('img')).toBeTruthy();
    }
  });

  it('adds the --framed class (extra padding for the card shadow to fully render) only when cardTone is set', () => {
    // Act and assert: no --framed class without a cardTone...
    fixture = create();
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.rolling-carousel');
    expect(root.classList.contains('rolling-carousel--framed')).toBe(false);

    // ...and it's added once one is set.
    fixture.componentRef.setInput('cardTone', 'dark');
    fixture.detectChanges();
    expect(root.classList.contains('rolling-carousel--framed')).toBe(true);
  });

  it('defaults the loop duration to 30s and lets the page override it via the speed input', () => {
    // Act and assert: 30s by default...
    fixture = create();
    fixture.detectChanges();
    const defaultTrack = fixture.nativeElement.querySelector('.rolling-carousel__track');
    expect(defaultTrack.style.animationDuration).toBe('30s');

    // ...and the speed input overrides it.
    fixture.componentRef.setInput('speed', 12);
    fixture.detectChanges();
    expect(defaultTrack.style.animationDuration).toBe('12s');
  });

  it('defaults height to 16rem and lets the page override it', () => {
    // Act and assert: 16rem by default...
    fixture = create();
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.rolling-carousel');
    expect(root.style.height).toBe('16rem');

    // ...and the height input overrides it.
    fixture.componentRef.setInput('height', '24rem');
    fixture.detectChanges();
    expect(root.style.height).toBe('24rem');
  });
});
