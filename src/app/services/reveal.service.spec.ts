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
    observeSpy = vi.fn();
    unobserveSpy = vi.fn();
    reducedMotion = false;

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
    vi.unstubAllGlobals();
  });

  it('observes an element on register', () => {
    const service = TestBed.inject(RevealService);
    const element = document.createElement('div');

    service.register(element);

    expect(observeSpy).toHaveBeenCalledWith(element);
  });

  it('adds animate-in and unobserves the target when an entry intersects', () => {
    const service = TestBed.inject(RevealService);
    const element = document.createElement('div');
    service.register(element);

    capturedCallback(
      [{ target: element, isIntersecting: true } as unknown as IntersectionObserverEntry],
      capturedInstance as IntersectionObserver,
    );

    expect(element.classList.contains('animate-in')).toBe(true);
    expect(unobserveSpy).toHaveBeenCalledWith(element);
  });

  it('leaves an entry that is not yet intersecting alone', () => {
    const service = TestBed.inject(RevealService);
    const element = document.createElement('div');
    service.register(element);

    capturedCallback(
      [{ target: element, isIntersecting: false } as unknown as IntersectionObserverEntry],
      capturedInstance as IntersectionObserver,
    );

    expect(element.classList.contains('animate-in')).toBe(false);
    expect(unobserveSpy).not.toHaveBeenCalled();
  });

  it('unregister stops observing an element that has not intersected yet', () => {
    const service = TestBed.inject(RevealService);
    const element = document.createElement('div');
    service.register(element);

    service.unregister(element);

    expect(unobserveSpy).toHaveBeenCalledWith(element);
  });

  it('reveals immediately without observing when prefers-reduced-motion is set', () => {
    reducedMotion = true;
    const service = TestBed.inject(RevealService);
    const element = document.createElement('div');

    service.register(element);

    expect(element.classList.contains('animate-in')).toBe(true);
    expect(observeSpy).not.toHaveBeenCalled();
  });
});
