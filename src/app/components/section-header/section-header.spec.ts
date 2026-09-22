import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionHeader } from './section-header';

describe('SectionHeader', () => {
  let fixture: ComponentFixture<SectionHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionHeader);
    fixture.componentRef.setInput('eyebrow', 'Find Me Online');
    fixture.componentRef.setInput('title', 'Socials');
    fixture.componentRef.setInput('tone', 'middle');
  });

  it('renders the eyebrow and title', () => {
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Find Me Online');
    expect(text).toContain('Socials');
  });

  it('renders the description when provided', () => {
    fixture.componentRef.setInput('description', 'Connect and join the community!');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Connect and join the community!');
  });

  it('omits the description paragraph entirely when not provided', () => {
    fixture.detectChanges();
    const paragraphs = fixture.nativeElement.querySelectorAll('p');

    // Only the eyebrow <p> should exist -- no empty description <p>.
    expect(paragraphs.length).toBe(1);
  });

  it('shows the flourish by default', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-flourish')).toBeTruthy();
  });

  it('hides the flourish when flourish is false', () => {
    fixture.componentRef.setInput('flourish', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-flourish')).toBeFalsy();
  });

  it('applies text-sm to the description by default', () => {
    fixture.componentRef.setInput('description', 'Some description text');
    fixture.detectChanges();

    const description = fixture.nativeElement.querySelectorAll('p')[1];
    expect(description.classList.contains('text-sm')).toBe(true);
  });

  it('omits text-sm when descriptionSize is base', () => {
    fixture.componentRef.setInput('description', 'Some description text');
    fixture.componentRef.setInput('descriptionSize', 'base');
    fixture.detectChanges();

    const description = fixture.nativeElement.querySelectorAll('p')[1];
    expect(description.classList.contains('text-sm')).toBe(false);
  });

  it('applies the right heading colour class for each tone', () => {
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
