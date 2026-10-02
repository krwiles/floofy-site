import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Hero } from './hero';

// Host that fills Hero's slots like a real page. Zoneless: set every value before the first render (see
// CLAUDE.md "Zoneless tests").
@Component({
  selector: 'app-hero-test-host',
  imports: [Hero],
  template: `
    <app-hero
      backgroundClass="bg-hero-test"
      heroImageSrc="assets/test.jpg"
      heroImagePosition="center 50%"
      heroImageMaxWidthClass="max-w-4xl"
      cardMaxWidthClass="max-w-2xl"
      [tone]="tone"
      [cardAlign]="cardAlign"
      [kicker]="kicker"
      [description]="description"
      [tagline]="tagline"
    >
      <span heroTitle>Test Title</span>
      @if (withActions) {
        <div heroActions>
          <a href="#">Do the thing</a>
        </div>
      }
    </app-hero>
  `,
})
class HeroTestHost {
  tone: 'light' | 'dark' = 'light';
  cardAlign: 'start' | 'end' = 'end';
  kicker = 'Kicker text';
  description: string | null = 'Description text';
  tagline: string | null = 'Tagline text';
  withActions = false;
}

describe('Hero', () => {
  let fixture: ComponentFixture<HeroTestHost>;

  function create(overrides: Partial<HeroTestHost> = {}): void {
    // Render the host, applying per-test overrides before the first change detection.
    fixture = TestBed.createComponent(HeroTestHost);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
  }

  function heroEl(): HTMLElement {
    // The rendered <app-hero>.
    return fixture.nativeElement.querySelector('app-hero');
  }

  function heroInstance(): Hero {
    // The Hero instance itself, for reading its inputs.
    return fixture.debugElement.query(By.directive(Hero)).componentInstance as Hero;
  }

  function imageWrapper(): HTMLElement {
    // The wrapper holding the hero image layer.
    return heroEl().querySelector('.hero-image-wrapper')!;
  }

  function contentWrapper(): HTMLElement {
    // The wrapper holding the glass card.
    return heroEl().querySelector('.hero-content-wrapper')!;
  }

  function heroImageSection(): HTMLElement {
    // The hero image's parallax layer.
    return imageWrapper().querySelector('app-parallax-section')!;
  }

  function heading(): HTMLElement {
    // The page heading.
    return heroEl().querySelector('h1')!;
  }

  function kickerEl(): HTMLElement {
    // The kicker line above the heading.
    return heroEl().querySelector('p.hero-reveal-kicker')!;
  }

  beforeEach(async () => {
    // Compile the host once per test.
    await TestBed.configureTestingModule({ imports: [HeroTestHost] }).compileComponents();
  });

  it('should create', () => {
    // Act and assert: it builds.
    create();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('projects the heroTitle content into the <h1>', () => {
    // Act and assert: the projected title lands in the <h1>.
    create();
    expect(heading().textContent).toContain('Test Title');
  });

  it('uses light-tone heading/body colors by default', () => {
    // Act: render with the default (light) tone.
    create();
    // Assert: heading and body colors are the light ones.
    expect(kickerEl().classList.contains('text-on-light-heading')).toBe(true);
    const description = heroEl().querySelectorAll('p.hero-reveal-copy')[0];
    expect(description.classList.contains('text-on-light-body')).toBe(true);
  });

  it('switches to dark-tone heading/body colors when tone="dark"', () => {
    // Act: render dark.
    create({ tone: 'dark' });

    // Assert: heading and body colors are the dark ones.
    expect(kickerEl().classList.contains('text-on-dark-heading')).toBe(true);
    const description = heroEl().querySelectorAll('p.hero-reveal-copy')[0];
    expect(description.classList.contains('text-on-dark-body')).toBe(true);
  });

  it('aligns the card to the end and keeps the hero image on the left by default (cardAlign="end")', () => {
    // Act: render with the default alignment.
    create();
    // Assert: card at the end, image not pushed right.
    expect(contentWrapper().classList.contains('md:justify-end')).toBe(true);
    expect(heroImageSection().classList.contains('ml-auto')).toBe(false);
  });

  it('aligns the card to the start and pushes the hero image to the right when cardAlign="start"', () => {
    // Act: align the card to the start.
    create({ cardAlign: 'start' });

    // Assert: card at the start, image pushed right.
    expect(contentWrapper().classList.contains('md:justify-start')).toBe(true);
    expect(heroImageSection().classList.contains('ml-auto')).toBe(true);
  });

  it('renders no description paragraph when none is provided (e.g. home)', () => {
    // Act and assert: without a description, only the tagline paragraph remains.
    create({ description: null });
    expect(heroEl().querySelectorAll('p.hero-reveal-copy').length).toBe(1); // tagline only
  });

  it('renders no tagline paragraph when none is provided (e.g. streaming)', () => {
    // Act and assert: without a tagline, only the description paragraph remains.
    create({ tagline: null });
    expect(heroEl().querySelectorAll('p.hero-reveal-copy').length).toBe(1); // description only
  });

  it('projects heroActions content when provided', () => {
    // Act and assert: projected actions render.
    create({ withActions: true });
    expect(heroEl().querySelector('[heroactions] a')?.textContent).toContain('Do the thing');
  });

  it('forwards the hero image inputs to the inner parallax-section', () => {
    // Act: render.
    create();
    // Assert: the image inputs reached the component.
    expect(heroInstance().heroImageSrc()).toBe('assets/test.jpg');
    expect(heroInstance().heroImagePosition()).toBe('center 50%');
  });

  it('defaults to the shared background-pattern image and the common hero-image height', () => {
    // Act: render.
    create();
    // Assert: the shared defaults apply.
    expect(heroInstance().backgroundPatternImage()).toBe('assets/graphics/pattern-stars.svg');
    expect(heroInstance().heroImageHeight()).toBe('100%');
  });

  it("always shows the flourish, never hidden below md (standardized to what was originally only home's behavior)", () => {
    // Act: render.
    create();
    // Assert: the flourish is never hidden, and sized for both breakpoints.
    const flourish = heroEl().querySelector('app-flourish')!;
    expect(flourish.classList.contains('hidden')).toBe(false);
    expect(flourish.classList.contains('h-8')).toBe(true);
    expect(flourish.classList.contains('md:h-12')).toBe(true);
  });
});
