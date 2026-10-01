import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Button } from './button';

// Host that binds both inputs, so each test can set them before the first render.
@Component({
  template: `
    <a appButton [variant]="variant" [tone]="tone" href="#"></a>
  `,
  imports: [Button],
})
class HostComponent {
  variant: 'primary' | 'secondary' | 'pill' = 'primary';
  tone: 'light' | 'middle' | 'dark' = 'light';
}

// Host with no bindings at all: binding an explicit `undefined` would override the defaults under test.
@Component({
  template: `
    <a appButton href="#"></a>
  `,
  imports: [Button],
})
class DefaultsHostComponent {}

function createFixture(): ComponentFixture<HostComponent> {
  // Build the bound host.
  TestBed.configureTestingModule({ imports: [HostComponent] });
  return TestBed.createComponent(HostComponent);
}

describe('Button', () => {
  it('applies btn and btn-primary and btn-on-light by default when no inputs are given', () => {
    // Arrange: render the host with no inputs.
    TestBed.configureTestingModule({ imports: [DefaultsHostComponent] });
    const fixture = TestBed.createComponent(DefaultsHostComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('a');

    // Assert: the default variant and tone classes.
    expect(element.classList.contains('btn')).toBe(true);
    expect(element.classList.contains('btn-primary')).toBe(true);
    expect(element.classList.contains('btn-on-light')).toBe(true);
  });

  it('applies btn-secondary for variant secondary', () => {
    // Arrange: secondary variant.
    const fixture = createFixture();
    fixture.componentInstance.variant = 'secondary';
    fixture.detectChanges();

    // Assert: its class is applied.
    expect(fixture.nativeElement.querySelector('a').classList.contains('btn-secondary')).toBe(true);
  });

  it('applies btn-pill for variant pill', () => {
    // Arrange: pill variant.
    const fixture = createFixture();
    fixture.componentInstance.variant = 'pill';
    fixture.detectChanges();

    // Assert: its class is applied.
    expect(fixture.nativeElement.querySelector('a').classList.contains('btn-pill')).toBe(true);
  });

  it('applies btn-on-middle for tone middle', () => {
    // Arrange: middle tone.
    const fixture = createFixture();
    fixture.componentInstance.tone = 'middle';
    fixture.detectChanges();

    // Assert: its class is applied.
    expect(fixture.nativeElement.querySelector('a').classList.contains('btn-on-middle')).toBe(true);
  });

  it('applies btn-on-dark for tone dark', () => {
    // Arrange: dark tone.
    const fixture = createFixture();
    fixture.componentInstance.tone = 'dark';
    fixture.detectChanges();

    // Assert: its class is applied.
    expect(fixture.nativeElement.querySelector('a').classList.contains('btn-on-dark')).toBe(true);
  });
});
