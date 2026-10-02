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
    // Fake window whose listener calls we can count, capturing the scroll handler so tests can fire "a scroll".
    addEventListenerSpy = vi.fn((_event: string, handler: () => void) => {
      capturedHandler = handler;
    });
    removeEventListenerSpy = vi.fn();
    defaultView = { addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy };

    // Hand the service a fake DOCUMENT whose window can be swapped (or removed) per test.
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
    // Undo any globals a test stubbed.
    vi.unstubAllGlobals();
  });

  it('attaches exactly one passive window scroll listener no matter how many callbacks register', () => {
    // Act: three callbacks register.
    const service = TestBed.inject(ParallaxScrollService);

    service.register(vi.fn());
    service.register(vi.fn());
    service.register(vi.fn());

    // Assert: still only one listener, and it's passive.
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
  });

  it('notifies every registered callback on scroll', () => {
    // Arrange: two registered callbacks.
    const service = TestBed.inject(ParallaxScrollService);
    const first = vi.fn();
    const second = vi.fn();
    service.register(first);
    service.register(second);

    // Act: simulate one scroll.
    capturedHandler();

    // Assert: both were called once.
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('stops notifying a callback once it unregisters', () => {
    // Arrange: two registered callbacks.
    const service = TestBed.inject(ParallaxScrollService);
    const first = vi.fn();
    const second = vi.fn();
    service.register(first);
    service.register(second);

    // Act: unregister one, then scroll.
    service.unregister(first);
    capturedHandler();

    // Assert: only the remaining one was called.
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('unregistering a callback that never registered is a no-op', () => {
    // Arrange: a callback that was never registered.
    const service = TestBed.inject(ParallaxScrollService);
    const callback = vi.fn();

    // Act and assert: unregistering it is harmless and leaves the (never-attached) listener alone.
    expect(() => service.unregister(callback)).not.toThrow();
    expect(removeEventListenerSpy).not.toHaveBeenCalled();
  });

  it('removes the window listener once the last callback unregisters', () => {
    // Arrange: two registered callbacks.
    const service = TestBed.inject(ParallaxScrollService);
    const first = vi.fn();
    const second = vi.fn();
    service.register(first);
    service.register(second);

    // Act and assert: the listener stays while one callback remains...
    service.unregister(first);
    expect(removeEventListenerSpy).not.toHaveBeenCalled();

    // ...and is removed with the last.
    service.unregister(second);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('re-attaches a fresh listener if a callback registers again after the last one unregistered', () => {
    // Arrange: register then unregister, so the listener is gone.
    const service = TestBed.inject(ParallaxScrollService);
    const first = vi.fn();
    service.register(first);
    service.unregister(first);

    // Act: register again.
    service.register(vi.fn());

    // Assert: a second listener was attached.
    expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
  });

  it('keeps notifying other callbacks when one throws', () => {
    // Arrange: a callback that throws, registered before a healthy one; silence the expected console.error.
    const service = TestBed.inject(ParallaxScrollService);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const throwing = vi.fn(() => {
      throw new Error('boom');
    });
    const healthy = vi.fn();
    service.register(throwing);
    service.register(healthy);

    // Act: a scroll doesn't throw out of the handler.
    expect(() => capturedHandler()).not.toThrow();

    // Assert: the healthy callback still ran, and the failure was reported.
    expect(healthy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
    // Put the real console.error back.
    errorSpy.mockRestore();
  });

  it('never attaches a listener, and never gets stuck, when defaultView is unavailable', () => {
    // Arrange: no window at all.
    defaultView = null;
    const service = TestBed.inject(ParallaxScrollService);

    // Act and assert: registering attaches nothing...
    service.register(vi.fn());
    expect(addEventListenerSpy).not.toHaveBeenCalled();

    // ...and once a window exists, the next registration attaches normally.
    defaultView = { addEventListener: addEventListenerSpy, removeEventListener: removeEventListenerSpy };
    service.register(vi.fn());
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
  });
});
