import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ParallaxScrollService } from './parallax-scroll.service';

describe('ParallaxScrollService', () => {
  let addEventListenerSpy: ReturnType<typeof vi.fn>;
  let removeEventListenerSpy: ReturnType<typeof vi.fn>;
  let capturedHandler: () => void;
  let defaultView: {
    addEventListener: typeof addEventListenerSpy;
    removeEventListener: typeof removeEventListenerSpy;
  } | null;

  beforeEach(() => {
    addEventListenerSpy = vi.fn((_event: string, handler: () => void) => {
      capturedHandler = handler;
    });
    removeEventListenerSpy = vi.fn();
    defaultView = { addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useValue: {
            get defaultView() {
              return defaultView;
            },
          },
        },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('attaches exactly one passive window scroll listener no matter how many callbacks register', () => {
    const service = TestBed.inject(ParallaxScrollService);

    service.register(vi.fn());
    service.register(vi.fn());
    service.register(vi.fn());

    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
  });

  it('notifies every registered callback on scroll', () => {
    const service = TestBed.inject(ParallaxScrollService);
    const first = vi.fn();
    const second = vi.fn();
    service.register(first);
    service.register(second);

    capturedHandler();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('stops notifying a callback once it unregisters', () => {
    const service = TestBed.inject(ParallaxScrollService);
    const first = vi.fn();
    const second = vi.fn();
    service.register(first);
    service.register(second);

    service.unregister(first);
    capturedHandler();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('unregistering a callback that never registered is a no-op', () => {
    const service = TestBed.inject(ParallaxScrollService);
    const callback = vi.fn();

    expect(() => service.unregister(callback)).not.toThrow();
    expect(removeEventListenerSpy).not.toHaveBeenCalled();
  });

  it('removes the window listener once the last callback unregisters', () => {
    const service = TestBed.inject(ParallaxScrollService);
    const first = vi.fn();
    const second = vi.fn();
    service.register(first);
    service.register(second);

    service.unregister(first);
    expect(removeEventListenerSpy).not.toHaveBeenCalled();

    service.unregister(second);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('re-attaches a fresh listener if a callback registers again after the last one unregistered', () => {
    const service = TestBed.inject(ParallaxScrollService);
    const first = vi.fn();
    service.register(first);
    service.unregister(first);

    service.register(vi.fn());

    expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
  });

  it('keeps notifying other callbacks when one throws', () => {
    const service = TestBed.inject(ParallaxScrollService);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const throwing = vi.fn(() => {
      throw new Error('boom');
    });
    const healthy = vi.fn();
    service.register(throwing);
    service.register(healthy);

    expect(() => capturedHandler()).not.toThrow();

    expect(healthy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('never attaches a listener, and never gets stuck, when defaultView is unavailable', () => {
    defaultView = null;
    const service = TestBed.inject(ParallaxScrollService);

    service.register(vi.fn());
    expect(addEventListenerSpy).not.toHaveBeenCalled();

    defaultView = { addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy };
    service.register(vi.fn());
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
  });
});
