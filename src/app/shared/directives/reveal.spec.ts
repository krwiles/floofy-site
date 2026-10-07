import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Reveal } from './reveal';
import { RevealService } from '../../services/reveal.service';

// Host with one revealed element.
@Component({
  template: `
    <div appReveal></div>
  `,
  imports: [Reveal],
})
class HostComponent {}

describe('Reveal', () => {
  let registerSpy: ReturnType<typeof vi.fn>;
  let unregisterSpy: ReturnType<typeof vi.fn>;
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    // Spy on RevealService instead of running the real observer.
    registerSpy = vi.fn();
    unregisterSpy = vi.fn();

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: RevealService, useValue: { register: registerSpy, unregister: unregisterSpy } }],
    });

    fixture = TestBed.createComponent(HostComponent);
  });

  it('registers its host element with RevealService on init', () => {
    // Act: render.
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('div');

    // Assert: the host element was registered.
    expect(registerSpy).toHaveBeenCalledWith(element);
  });

  it('unregisters its host element with RevealService on destroy', () => {
    // Arrange: render.
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('div');

    // Act: destroy the component.
    fixture.destroy();

    // Assert: the same element was unregistered.
    expect(unregisterSpy).toHaveBeenCalledWith(element);
  });
});
