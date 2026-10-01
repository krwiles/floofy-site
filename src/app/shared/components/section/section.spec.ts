import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Section } from './section';

// Host that projects content, to test both template branches.
@Component({
  template: `
    <app-section [tone]="tone" [pattern]="pattern">
      <p>projected content</p>
    </app-section>
  `,
  imports: [Section],
})
class HostComponent {
  tone: 'light' | 'light-alt' | 'middle' | 'middle-alt' | 'dark' | 'dark-alt' = 'light';
  pattern: 'stars' | 'circles' | undefined = undefined;
}

describe('Section', () => {
  let fixture: ComponentFixture<Section>;

  beforeEach(async () => {
    // Create the bare component once per test.
    await TestBed.configureTestingModule({
      imports: [Section],
    }).compileComponents();

    fixture = TestBed.createComponent(Section);
  });

  it('applies the right bg-section-* class for each tone value', () => {
    // Act and assert: each tone maps to its background class.
    for (const tone of ['light', 'light-alt', 'middle', 'middle-alt', 'dark', 'dark-alt'] as const) {
      fixture.componentRef.setInput('tone', tone);
      fixture.detectChanges();
      const section = fixture.nativeElement.querySelector('section');
      expect(section.classList.contains(`bg-section-${tone}`)).toBe(true);
    }
  });

  it('renders a plain section with no parallax when no pattern is given', () => {
    // Act: render without a pattern.
    fixture.componentRef.setInput('tone', 'light');
    fixture.detectChanges();

    // Assert: a plain <section>, no parallax.
    expect(fixture.nativeElement.querySelector('app-parallax-section')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('section')).toBeTruthy();
  });

  it('wraps content in app-parallax-section when pattern is provided', () => {
    // Act: render with a pattern.
    fixture.componentRef.setInput('tone', 'dark');
    fixture.componentRef.setInput('pattern', 'stars');
    fixture.detectChanges();

    // Assert: the parallax wrapper is used.
    expect(fixture.nativeElement.querySelector('app-parallax-section')).toBeTruthy();
  });

  it('maps the stars/circles pattern names to their asset paths', () => {
    // Arrange: a tone.
    fixture.componentRef.setInput('tone', 'dark');

    // Act and assert: each pattern name maps to its image.
    fixture.componentRef.setInput('pattern', 'stars');
    expect(fixture.componentInstance.patternImage()).toBe('assets/graphics/pattern-stars.svg');

    fixture.componentRef.setInput('pattern', 'circles');
    expect(fixture.componentInstance.patternImage()).toBe('assets/graphics/pattern-circles.svg');
  });
});

describe('Section content projection (via a real host template)', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    // Create the host once per test.
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
  });

  it('projects content through the plain (non-pattern) branch', () => {
    // Act: render the plain branch.
    fixture.componentInstance.pattern = undefined;
    fixture.detectChanges();

    // Assert: the content was projected.
    expect(fixture.nativeElement.querySelector('section').textContent).toContain('projected content');
  });

  it('projects content through the pattern branch, inside app-parallax-section', () => {
    // Regression: two <ng-content>s across @if/@else only project into one, so this branch once rendered empty.
    // Act: render the pattern branch.
    fixture.componentInstance.pattern = 'circles';
    fixture.detectChanges();

    // Assert: the content was projected inside the parallax wrapper.
    const parallax = fixture.nativeElement.querySelector('app-parallax-section');
    expect(parallax).toBeTruthy();
    expect(parallax.textContent).toContain('projected content');
  });
});
