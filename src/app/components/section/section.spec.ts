import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Section } from './section';

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

  it('projects content', () => {
    fixture.componentRef.setInput('tone', 'light');
    const el = fixture.nativeElement;
    const projected = document.createElement('p');
    projected.textContent = 'projected content';
    el.appendChild(projected);
    fixture.detectChanges();

    expect(el.textContent).toContain('projected content');
  });
});
