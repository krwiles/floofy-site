import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Button } from './button';

@Component({
  template: `<a appButton [variant]="variant" [tone]="tone" href="#"></a>`,
  imports: [Button],
})
class HostComponent {
  variant: 'primary' | 'secondary' | 'pill' = 'primary';
  tone: 'light' | 'middle' | 'dark' = 'light';
}

// Separate host with no bindings at all -- binding [variant]/[tone] to an explicit `undefined` would override
// the directive's own defaults, so the "defaults apply" case needs the attributes genuinely absent.
@Component({
  template: `<a appButton href="#"></a>`,
  imports: [Button],
})
class DefaultsHostComponent {}

function createFixture(): ComponentFixture<HostComponent> {
  TestBed.configureTestingModule({ imports: [HostComponent] });
  return TestBed.createComponent(HostComponent);
}

describe('Button', () => {
  it('applies btn and btn-primary and btn-on-light by default when no inputs are given', () => {
    TestBed.configureTestingModule({ imports: [DefaultsHostComponent] });
    const fixture = TestBed.createComponent(DefaultsHostComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('a');

    expect(element.classList.contains('btn')).toBe(true);
    expect(element.classList.contains('btn-primary')).toBe(true);
    expect(element.classList.contains('btn-on-light')).toBe(true);
  });

  it('applies btn-secondary for variant secondary', () => {
    const fixture = createFixture();
    fixture.componentInstance.variant = 'secondary';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a').classList.contains('btn-secondary')).toBe(true);
  });

  it('applies btn-pill for variant pill', () => {
    const fixture = createFixture();
    fixture.componentInstance.variant = 'pill';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a').classList.contains('btn-pill')).toBe(true);
  });

  it('applies btn-on-middle for tone middle', () => {
    const fixture = createFixture();
    fixture.componentInstance.tone = 'middle';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a').classList.contains('btn-on-middle')).toBe(true);
  });

  it('applies btn-on-dark for tone dark', () => {
    const fixture = createFixture();
    fixture.componentInstance.tone = 'dark';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a').classList.contains('btn-on-dark')).toBe(true);
  });
});
