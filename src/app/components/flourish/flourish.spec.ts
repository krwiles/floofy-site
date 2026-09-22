import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Flourish } from './flourish';

describe('Flourish', () => {
  let fixture: ComponentFixture<Flourish>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Flourish],
    }).compileComponents();

    fixture = TestBed.createComponent(Flourish);
  });

  it('renders the flourish class plus the variant-specific f-* class', () => {
    fixture.componentRef.setInput('variant', 'full');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    expect(span.classList.contains('flourish')).toBe(true);
    expect(span.classList.contains('f-full')).toBe(true);
  });

  it('maps every variant to its matching f-* class', () => {
    for (const variant of ['end', 'end-short', 'full', 'full-wide'] as const) {
      fixture.componentRef.setInput('variant', variant);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('span').classList.contains(`f-${variant}`)).toBe(true);
    }
  });

  it('omits the flip class by default', () => {
    fixture.componentRef.setInput('variant', 'full');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('span').classList.contains('flip')).toBe(false);
  });

  it('adds the flip class when flip is true', () => {
    fixture.componentRef.setInput('variant', 'full');
    fixture.componentRef.setInput('flip', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('span').classList.contains('flip')).toBe(true);
  });

  it('marks the span aria-hidden', () => {
    fixture.componentRef.setInput('variant', 'full');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('span').getAttribute('aria-hidden')).toBe('true');
  });
});
