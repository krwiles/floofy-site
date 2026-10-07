import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionDivider } from './section-divider';

describe('SectionDivider', () => {
  let fixture: ComponentFixture<SectionDivider>;

  beforeEach(async () => {
    // Render the divider once per test.
    await TestBed.configureTestingModule({
      imports: [SectionDivider],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionDivider);
    fixture.detectChanges();
  });

  it('renders the between-sections flourish ornament', () => {
    // Act: find the rendered ornament.
    const span = fixture.nativeElement.querySelector('span');

    // Assert: a wide, absolutely positioned flourish, hidden from screen readers.
    expect(span.classList.contains('flourish')).toBe(true);
    expect(span.classList.contains('f-full-wide')).toBe(true);
    expect(span.classList.contains('absolute')).toBe(true);
    expect(span.getAttribute('aria-hidden')).toBe('true');
  });
});
