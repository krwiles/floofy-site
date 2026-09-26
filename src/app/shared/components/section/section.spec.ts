import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Section } from './section';

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
    await TestBed.configureTestingModule({
      imports: [Section],
    }).compileComponents();

    fixture = TestBed.createComponent(Section);
  });

  it('applies the right bg-section-* class for each tone value', () => {
    for (const tone of ['light', 'light-alt', 'middle', 'middle-alt', 'dark', 'dark-alt'] as const) {
      fixture.componentRef.setInput('tone', tone);
      fixture.detectChanges();
      const section = fixture.nativeElement.querySelector('section');
      expect(section.classList.contains(`bg-section-${tone}`)).toBe(true);
    }
  });

  it('renders a plain section with no parallax when no pattern is given', () => {
    fixture.componentRef.setInput('tone', 'light');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-parallax-section')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('section')).toBeTruthy();
  });

  it('wraps content in app-parallax-section when pattern is provided', () => {
    fixture.componentRef.setInput('tone', 'dark');
    fixture.componentRef.setInput('pattern', 'stars');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-parallax-section')).toBeTruthy();
  });

  it('maps the stars/circles pattern names to their asset paths', () => {
    fixture.componentRef.setInput('tone', 'dark');

    fixture.componentRef.setInput('pattern', 'stars');
    expect(fixture.componentInstance.patternImage()).toBe('assets/4-point-stars.svg');

    fixture.componentRef.setInput('pattern', 'circles');
    expect(fixture.componentInstance.patternImage()).toBe('assets/intersecting-circles.svg');
  });
});

describe('Section content projection (via a real host template)', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
  });

  it('projects content through the plain (non-pattern) branch', () => {
    fixture.componentInstance.pattern = undefined;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('section').textContent).toContain('projected content');
  });

  it('projects content through the pattern branch, inside app-parallax-section', () => {
    // This is the exact case that silently rendered empty in Stage 3a: two
    // <ng-content> tags across @if/@else branches only project into one of
    // them at compile time, not whichever branch is actually active. Fixed
    // via a single <ng-content> inside <ng-template>, reused with
    // *ngTemplateOutlet in both branches.
    fixture.componentInstance.pattern = 'circles';
    fixture.detectChanges();

    const parallax = fixture.nativeElement.querySelector('app-parallax-section');
    expect(parallax).toBeTruthy();
    expect(parallax.textContent).toContain('projected content');
  });
});
