import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PricingCard } from './pricing-card';
import { ArtworkCategory } from '../../../models/artwork-category';

describe('PricingCard', () => {
  let fixture: ComponentFixture<PricingCard>;

  // Render one card, with its inputs set before the first change detection.
  function create(category: ArtworkCategory, carouselShape = 'aspect-square'): HTMLElement {
    fixture = TestBed.createComponent(PricingCard);
    fixture.componentRef.setInput('category', category);
    fixture.componentRef.setInput('carouselShape', carouselShape);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(async () => {
    // Renders against the real en.json, pricing.json and gallery.json, in English.
    await TestBed.configureTestingModule({ imports: [PricingCard] }).compileComponents();
  });

  it("shows the category's title and base price", () => {
    // Act: render the chibi card.
    const el = create('chibi');

    // Chibi is $27 in pricing.json.
    expect(el.querySelector('h3')?.textContent?.trim()).toBe('Chibi');
    expect(el.textContent).toContain('$27');
  });

  it('shows the five lists in the shared order, each with its own items', () => {
    // Act: render the emote card.
    const el = create('emote');

    // Headings follow the shared list order...
    const headings = Array.from(el.querySelectorAll('ul')).map((ul) => ul.previousElementSibling?.textContent?.trim());
    expect(headings).toEqual(['Includes', 'Excludes', 'Details', 'Notes', 'Turnaround Time']);

    // ...and each list holds that card's own entries (emote has 3 notes).
    expect(el.querySelectorAll('ul')[3].querySelectorAll('li').length).toBe(3);
  });

  it("frames the carousel in the card's own shape", () => {
    // Act: render the illustration card with its 3:4 shape.
    const el = create('illustration', 'aspect-3/4');

    // The carousel's wrapper carries the shape class it was given.
    expect(el.querySelector('app-slideshow-carousel')?.parentElement?.classList.contains('aspect-3/4')).toBe(true);
  });

  it('emits its category when the call-to-action is clicked', () => {
    // Arrange: render the illustration card.
    const el = create('illustration');
    // Record what the card emits.
    const picked: ArtworkCategory[] = [];
    fixture.componentInstance.pick.subscribe((category) => picked.push(category));

    // Clicking "Request Illustration" picks illustration.
    const cta = el.querySelector('button[appbutton]') as HTMLButtonElement;
    expect(cta.textContent?.trim()).toBe('Request Illustration');
    cta.click();
    expect(picked).toEqual(['illustration']);
  });

  it('makes the call-to-action a real button, so the keyboard can reach and press it', () => {
    // Act: render a card.
    const el = create('chibi');

    // Assert: a plain (non-submitting) button, which is in the Tab order without any extra attributes.
    const cta = el.querySelector('button[appbutton]') as HTMLButtonElement;
    expect(cta.type).toBe('button');
    expect(el.querySelector('a:not([href])')).toBeNull();
  });

  it('leaves no untranslated keys on the card', () => {
    // Act: render a card.
    const el = create('chibi');

    // t() echoes a missing key back, so any "commission." text means a broken lookup.
    expect(el.textContent).not.toContain('commission.');
  });
});
