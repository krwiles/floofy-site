import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Hero } from './hero';

// A tiny host so the heroTitle/heroActions content-projection slots (which Hero itself can't supply)
// can be exercised the same way a real page would use them. This app runs zoneless (no zone.js
// dependency) -- a plain property mutated *after* the first detectChanges() is never picked up (no
// signal/event backs it, so nothing tells the zoneless scheduler to re-check), so every scenario below
// sets its values on the host BEFORE that first render rather than mutating an already-rendered one.
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
    fixture = TestBed.createComponent(HeroTestHost);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
  }

  function heroEl(): HTMLElement {
    return fixture.nativeElement.querySelector('app-hero');
  }

  function heroInstance(): Hero {
    return fixture.debugElement.query(By.directive(Hero)).componentInstance as Hero;
  }

  function imageWrapper(): HTMLElement {
    return heroEl().querySelector('.hero-image-wrapper')!;
  }

  function contentWrapper(): HTMLElement {
    return heroEl().querySelector('.hero-content-wrapper')!;
  }

  function heroImageSection(): HTMLElement {
    return imageWrapper().querySelector('app-parallax-section')!;
  }

  function heading(): HTMLElement {
    return heroEl().querySelector('h1')!;
  }

  function kickerEl(): HTMLElement {
    return heroEl().querySelector('p.hero-reveal-kicker')!;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HeroTestHost] }).compileComponents();
  });

  it('should create', () => {
    create();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('projects the heroTitle content into the <h1>', () => {
    create();
    expect(heading().textContent).toContain('Test Title');
  });

  it('uses light-tone heading/body colors by default', () => {
    create();
    expect(kickerEl().classList.contains('text-on-light-heading')).toBe(true);
    const description = heroEl().querySelectorAll('p.hero-reveal-copy')[0];
    expect(description.classList.contains('text-on-light-body')).toBe(true);
  });

  it('switches to dark-tone heading/body colors when tone="dark"', () => {
    create({ tone: 'dark' });

    expect(kickerEl().classList.contains('text-on-dark-heading')).toBe(true);
    const description = heroEl().querySelectorAll('p.hero-reveal-copy')[0];
    expect(description.classList.contains('text-on-dark-body')).toBe(true);
  });

  it('aligns the card to the end and keeps the hero image on the left by default (cardAlign="end")', () => {
    create();
    expect(contentWrapper().classList.contains('md:justify-end')).toBe(true);
    expect(heroImageSection().classList.contains('ml-auto')).toBe(false);
  });

  it('aligns the card to the start and pushes the hero image to the right when cardAlign="start"', () => {
    create({ cardAlign: 'start' });

    expect(contentWrapper().classList.contains('md:justify-start')).toBe(true);
    expect(heroImageSection().classList.contains('ml-auto')).toBe(true);
  });

  it('renders no description paragraph when none is provided (e.g. home)', () => {
    create({ description: null });
    expect(heroEl().querySelectorAll('p.hero-reveal-copy').length).toBe(1); // tagline only
  });

  it('renders no tagline paragraph when none is provided (e.g. streaming)', () => {
    create({ tagline: null });
    expect(heroEl().querySelectorAll('p.hero-reveal-copy').length).toBe(1); // description only
  });

  it('projects heroActions content when provided', () => {
    create({ withActions: true });
    expect(heroEl().querySelector('[heroactions] a')?.textContent).toContain('Do the thing');
  });

  it('forwards the hero image inputs to the inner parallax-section', () => {
    create();
    expect(heroInstance().heroImageSrc()).toBe('assets/test.jpg');
    expect(heroInstance().heroImagePosition()).toBe('center 50%');
  });

  it('defaults to the shared background-pattern image and the common hero-image height', () => {
    create();
    expect(heroInstance().backgroundPatternImage()).toBe('assets/graphics/pattern-stars.svg');
    expect(heroInstance().heroImageHeight()).toBe('100%');
  });

  it("always shows the flourish, never hidden below md (standardized to what was originally only home's behavior)", () => {
    create();
    const flourish = heroEl().querySelector('app-flourish')!;
    expect(flourish.classList.contains('hidden')).toBe(false);
    expect(flourish.classList.contains('h-8')).toBe(true);
    expect(flourish.classList.contains('md:h-12')).toBe(true);
  });
});
