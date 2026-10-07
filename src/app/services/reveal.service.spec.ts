import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, vi } from 'vitest';
import { RevealService } from './reveal.service';

describe('RevealService', () => {
  let capturedCallback: IntersectionObserverCallback;
  let capturedInstance: unknown;
  let observeSpy: ReturnType<typeof vi.fn>;
  let unobserveSpy: ReturnType<typeof vi.fn>;
  let reducedMotion: boolean;

  beforeEach(() => {
    // Fresh spies per test; motion allowed unless a test says otherwise.
    observeSpy = vi.fn();
    unobserveSpy = vi.fn();
    reducedMotion = false;

    // Replace IntersectionObserver with a fake that captures its callback, so tests can fire "scrolled into view".
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          capturedCallback = callback;
          capturedInstance = this;
        }
        observe = observeSpy;
        unobserve = unobserveSpy;
        disconnect() {}
      },
    );

    // Fake DOCUMENT whose matchMedia answers the per-test reduced-motion setting.
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useValue: {
            defaultView: {
              matchMedia: () => ({ matches: reducedMotion }),
            },
          },
        },
      ],
    });
  });

  afterEach(() => {
    // Undo the IntersectionObserver stub.
    vi.unstubAllGlobals();
  });

  it('observes an element on register', () => {
    // Arrange: a service and an element.
    const service = TestBed.inject(RevealService);
    const element = document.createElement('div');

    // Act: register the element.
    service.register(element);

    // Assert: the observer is now watching it.
    expect(observeSpy).toHaveBeenCalledWith(element);
  });

  it('adds animate-in and unobserves the target when an entry intersects', () => {
    // Arrange: a registered element.
    const service = TestBed.inject(RevealService);
    const element = document.createElement('div');
    service.register(element);

    // Act: the observer reports it scrolled into view.
    capturedCallback(
      [{ target: element, isIntersecting: true } as unknown as IntersectionObserverEntry],
      capturedInstance as IntersectionObserver,
    );

    // Assert: it's revealed, and no longer watched.
    expect(element.classList.contains('animate-in')).toBe(true);
    expect(unobserveSpy).toHaveBeenCalledWith(element);
  });

  it('leaves an entry that is not yet intersecting alone', () => {
    // Arrange: a registered element.
    const service = TestBed.inject(RevealService);
    const element = document.createElement('div');
    service.register(element);

    // Act: the observer reports it's still out of view.
    capturedCallback(
      [{ target: element, isIntersecting: false } as unknown as IntersectionObserverEntry],
      capturedInstance as IntersectionObserver,
    );

    // Assert: nothing changes.
    expect(element.classList.contains('animate-in')).toBe(false);
    expect(unobserveSpy).not.toHaveBeenCalled();
  });

  it('unregister stops observing an element that has not intersected yet', () => {
    // Arrange: a registered element.
    const service = TestBed.inject(RevealService);
    const element = document.createElement('div');
    service.register(element);

    // Act: unregister it before it's revealed.
    service.unregister(element);

    // Assert: the observer stops watching it.
    expect(unobserveSpy).toHaveBeenCalledWith(element);
  });

  it('reveals immediately without observing when prefers-reduced-motion is set', () => {
    // Arrange: the visitor prefers reduced motion.
    reducedMotion = true;
    const service = TestBed.inject(RevealService);
    const element = document.createElement('div');

    // Act: register an element.
    service.register(element);

    // Assert: revealed at once, never observed.
    expect(element.classList.contains('animate-in')).toBe(true);
    expect(observeSpy).not.toHaveBeenCalled();
  });
});
