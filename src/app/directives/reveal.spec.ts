import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Reveal } from './reveal';
import { RevealService } from '../services/reveal.service';

@Component({
  template: `<div appReveal></div>`,
  imports: [Reveal],
})
class HostComponent {}

describe('Reveal', () => {
  let registerSpy: ReturnType<typeof vi.fn>;
  let unregisterSpy: ReturnType<typeof vi.fn>;
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    registerSpy = vi.fn();
    unregisterSpy = vi.fn();

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: RevealService, useValue: { register: registerSpy, unregister: unregisterSpy } }],
    });

    fixture = TestBed.createComponent(HostComponent);
  });

  it('registers its host element with RevealService on init', () => {
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('div');

    expect(registerSpy).toHaveBeenCalledWith(element);
  });

  it('unregisters its host element with RevealService on destroy', () => {
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('div');

    fixture.destroy();

    expect(unregisterSpy).toHaveBeenCalledWith(element);
  });
});
