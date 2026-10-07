import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Flourish } from './flourish';

describe('Flourish', () => {
  let fixture: ComponentFixture<Flourish>;

  beforeEach(async () => {
    // Compile the component and create it, leaving inputs for each test to set.
    await TestBed.configureTestingModule({
      imports: [Flourish],
    }).compileComponents();

    fixture = TestBed.createComponent(Flourish);
  });

  it('renders the flourish class plus the variant-specific f-* class', () => {
    // Act: render the full variant.
    fixture.componentRef.setInput('variant', 'full');
    fixture.detectChanges();

    // Assert: the base class and the variant's class.
    const span = fixture.nativeElement.querySelector('span');
    expect(span.classList.contains('flourish')).toBe(true);
    expect(span.classList.contains('f-full')).toBe(true);
  });

  it('maps every variant to its matching f-* class', () => {
    // Act and assert: each variant maps to its own class.
    for (const variant of ['end', 'end-short', 'full', 'full-wide'] as const) {
      fixture.componentRef.setInput('variant', variant);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('span').classList.contains(`f-${variant}`)).toBe(true);
    }
  });

  it('omits the flip class by default', () => {
    // Act: render without flip.
    fixture.componentRef.setInput('variant', 'full');
    fixture.detectChanges();

    // Assert: no flip class.
    expect(fixture.nativeElement.querySelector('span').classList.contains('flip')).toBe(false);
  });

  it('adds the flip class when flip is true', () => {
    // Act: render flipped.
    fixture.componentRef.setInput('variant', 'full');
    fixture.componentRef.setInput('flip', true);
    fixture.detectChanges();

    // Assert: flip class added.
    expect(fixture.nativeElement.querySelector('span').classList.contains('flip')).toBe(true);
  });

  it('marks the span aria-hidden', () => {
    // Act: render.
    fixture.componentRef.setInput('variant', 'full');
    fixture.detectChanges();

    // Assert: hidden from screen readers (it's decoration).
    expect(fixture.nativeElement.querySelector('span').getAttribute('aria-hidden')).toBe('true');
  });
});
