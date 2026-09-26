import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Card } from './card';

@Component({
  template: `
    <div appCard [tone]="tone" [special]="special" [noBackground]="noBackground" [glass]="glass"></div>
  `,
  imports: [Card],
})
class HostComponent {
  tone: 'light' | 'middle' | 'dark' = 'light';
  special = false;
  noBackground = false;
  glass = false;
}

function createFixture(): ComponentFixture<HostComponent> {
  TestBed.configureTestingModule({ imports: [HostComponent] });
  return TestBed.createComponent(HostComponent);
}

// No [tone] binding at all -- glass-panel's own CSS doesn't vary by tone, so glass usage shouldn't need one.
@Component({
  template: `
    <div appCard [glass]="true"></div>
  `,
  imports: [Card],
})
class GlassOnlyHostComponent {}

// No [tone] and no [glass] -- tone is required in practice for every other mode.
@Component({
  template: `
    <div appCard></div>
  `,
  imports: [Card],
})
class NoToneNoGlassHostComponent {}

describe('Card', () => {
  it('applies card-on-section-light for tone light', () => {
    const fixture = createFixture();
    fixture.componentInstance.tone = 'light';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('div').classList.contains('card-on-section-light')).toBe(true);
  });

  it('applies card-on-section-middle for tone middle', () => {
    const fixture = createFixture();
    fixture.componentInstance.tone = 'middle';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('div').classList.contains('card-on-section-middle')).toBe(true);
  });

  it('applies card-on-section-dark for tone dark', () => {
    const fixture = createFixture();
    fixture.componentInstance.tone = 'dark';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('div').classList.contains('card-on-section-dark')).toBe(true);
  });

  it('applies the -special suffix when special is true', () => {
    const fixture = createFixture();
    fixture.componentInstance.tone = 'middle';
    fixture.componentInstance.special = true;
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('div');

    expect(element.classList.contains('card-on-section-middle-special')).toBe(true);
    expect(element.classList.contains('card-on-section-middle')).toBe(false);
  });

  it('applies card-shadow-{tone} and omits the tone-painted class when noBackground is true', () => {
    const fixture = createFixture();
    fixture.componentInstance.tone = 'dark';
    fixture.componentInstance.noBackground = true;
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('div');

    expect(element.classList.contains('card-shadow-dark')).toBe(true);
    expect(element.classList.contains('card-on-section-dark')).toBe(false);
  });

  it('applies glass-panel and omits every other class when glass is true', () => {
    const fixture = createFixture();
    fixture.componentInstance.tone = 'light';
    fixture.componentInstance.glass = true;
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('div');

    expect(element.classList.contains('glass-panel')).toBe(true);
    expect(element.classList.contains('card-on-section-light')).toBe(false);
    expect(element.classList.contains('card-shadow-light')).toBe(false);
  });

  it('applies glass-panel with no tone bound at all', () => {
    TestBed.configureTestingModule({ imports: [GlassOnlyHostComponent] });
    const fixture = TestBed.createComponent(GlassOnlyHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('div').classList.contains('glass-panel')).toBe(true);
  });

  it('throws if tone is missing and glass is not set, instead of silently emitting a broken class', () => {
    TestBed.configureTestingModule({ imports: [NoToneNoGlassHostComponent] });
    const fixture = TestBed.createComponent(NoToneNoGlassHostComponent);

    expect(() => fixture.detectChanges()).toThrow();
  });
});
