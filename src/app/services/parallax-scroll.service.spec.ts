import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ParallaxScrollService } from './parallax-scroll.service';

describe('ParallaxScrollService', () => {
  let addEventListenerSpy: ReturnType<typeof vi.fn>;
  let capturedHandler: () => void;

  beforeEach(() => {
    addEventListenerSpy = vi.fn((_event: string, handler: () => void) => {
      capturedHandler = handler;
    });

    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useValue: {
            defaultView: {
              addEventListener: addEventListenerSpy,
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
  });
});
