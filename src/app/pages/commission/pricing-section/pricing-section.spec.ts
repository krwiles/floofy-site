import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PricingSection } from './pricing-section';
import { ArtworkCategory } from '../../../models/artwork-category';

describe('PricingSection', () => {
  let fixture: ComponentFixture<PricingSection>;
  let el: HTMLElement;

  beforeEach(async () => {
    // Renders against the real JSON data, in English.
    await TestBed.configureTestingModule({ imports: [PricingSection] }).compileComponents();
    fixture = TestBed.createComponent(PricingSection);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('shows the three cards in order, each framed in its own carousel shape', () => {
    // Card titles left to right.
    const titles = Array.from(el.querySelectorAll('app-pricing-card h3')).map((h3) => h3.textContent?.trim());
    expect(titles).toEqual(['Chibi', 'Emotes', 'Illustration']);

    // Chibi and emote are square; illustration is 3:4.
    const shapes = Array.from(el.querySelectorAll('app-slideshow-carousel')).map((carousel) =>
      carousel.parentElement?.classList.contains('aspect-3/4') ? '3/4' : 'square',
    );
    expect(shapes).toEqual(['square', 'square', '3/4']);
  });

  it("re-emits a card's pick", () => {
    // Record what the section emits.
    const picked: ArtworkCategory[] = [];
    fixture.componentInstance.pick.subscribe((category) => picked.push(category));

    // Click the second card's call-to-action (emote).
    (el.querySelectorAll('app-pricing-card button[appbutton]')[1] as HTMLButtonElement).click();
    expect(picked).toEqual(['emote']);
  });

  it('keeps the scroll anchor the request form jumps to', () => {
    // The form's Commission Type "?" button targets this id.
    expect(el.querySelector('#commission-types')).toBeTruthy();
  });
});
