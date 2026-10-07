import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionHeader } from './section-header';

describe('SectionHeader', () => {
  let fixture: ComponentFixture<SectionHeader>;

  beforeEach(async () => {
    // Create the header with its required inputs; each test adds the rest before rendering.
    await TestBed.configureTestingModule({
      imports: [SectionHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionHeader);
    fixture.componentRef.setInput('eyebrow', 'Find Me Online');
    fixture.componentRef.setInput('title', 'Socials');
    fixture.componentRef.setInput('tone', 'middle');
  });

  it('renders the eyebrow and title', () => {
    // Act: render.
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    // Assert: both lines show.
    expect(text).toContain('Find Me Online');
    expect(text).toContain('Socials');
  });

  it('renders the description when provided', () => {
    // Act: render with a description.
    fixture.componentRef.setInput('description', 'Connect and join the community!');
    fixture.detectChanges();

    // Assert: it shows.
    expect(fixture.nativeElement.textContent).toContain('Connect and join the community!');
  });

  it('omits the description paragraph entirely when not provided', () => {
    // Act: render without a description.
    fixture.detectChanges();
    const paragraphs = fixture.nativeElement.querySelectorAll('p');

    // Only the eyebrow <p> should exist -- no empty description <p>.
    expect(paragraphs.length).toBe(1);
  });

  it('shows the flourish by default', () => {
    // Act and assert: the flourish shows by default.
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-flourish')).toBeTruthy();
  });

  it('hides the flourish when flourish is false', () => {
    // Act and assert: flourish=false removes it.
    fixture.componentRef.setInput('flourish', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-flourish')).toBeFalsy();
  });

  it('never applies text-sm to the description -- size is standardized, not configurable', () => {
    // Act: render with a description.
    fixture.componentRef.setInput('description', 'Some description text');
    fixture.detectChanges();

    // Assert: no text-sm (one standard size).
    const description = fixture.nativeElement.querySelectorAll('p')[1];
    expect(description.classList.contains('text-sm')).toBe(false);
  });

  it('applies the right heading colour class for each tone', () => {
    // Act and assert: each tone gives the heading its color.
    for (const [tone, expectedClass] of [
      ['light', 'text-on-light-heading'],
      ['middle', 'text-on-middle-heading'],
      ['dark', 'text-on-dark-heading'],
    ] as const) {
      fixture.componentRef.setInput('tone', tone);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h2').classList.contains(expectedClass)).toBe(true);
    }
  });
});
