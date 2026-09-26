import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ParallaxSection } from './parallax-section';
import { ParallaxScrollService } from '../../../services/parallax-scroll.service';

describe('ParallaxSection', () => {
  let component: ParallaxSection;
  let fixture: ComponentFixture<ParallaxSection>;
  let registerSpy: ReturnType<typeof vi.fn>;
  let unregisterSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    registerSpy = vi.fn();
    unregisterSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [ParallaxSection],
      providers: [{ provide: ParallaxScrollService, useValue: { register: registerSpy, unregister: unregisterSpy } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ParallaxSection);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('backgroundImage', 'assets/test-fixture.jpg');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('registers itself with the shared scroll service instead of its own window listener', () => {
    expect(registerSpy).toHaveBeenCalledTimes(1);
    expect(registerSpy).toHaveBeenCalledWith(expect.any(Function));
  });

  it('unregisters from the shared scroll service on destroy', () => {
    const registeredCallback = registerSpy.mock.calls[0][0];

    fixture.destroy();

    expect(unregisterSpy).toHaveBeenCalledWith(registeredCallback);
  });

  it('updates the background transform when the scroll service notifies it', () => {
    const registeredCallback = registerSpy.mock.calls[0][0];
    const backgroundEl: HTMLElement = fixture.nativeElement.querySelector('.parallax-background');
    const rootEl: HTMLElement = fixture.nativeElement.querySelector('.parallax-root');
    vi.spyOn(rootEl, 'getBoundingClientRect').mockReturnValue({ top: -100 } as DOMRect);

    registeredCallback();

    // parallaxStrength defaults to 0.5, so a rect.top of -100 yields translate3d(0,50px,0).
    expect(backgroundEl.style.transform).toBe('translate3d(0,50px,0)');
  });
});
