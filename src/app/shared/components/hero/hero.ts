import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ParallaxSection } from '../parallax-section/parallax-section';
import { Card } from '../../directives/card';
import { Flourish } from '../flourish/flourish';
import { joinClasses } from '../../../utils/join-classes';

export type HeroTone = 'light' | 'middle' | 'dark';
export type HeroCardAlign = 'start' | 'end';

// Per-tone text colors, spelled out in full so Tailwind generates them. 'middle' is unused today but kept for
// future pages at the owner's request.
const TONE_CLASSES: Record<HeroTone, { heading: string; body: string }> = {
  light: { heading: 'text-on-light-heading', body: 'text-on-light-body' },
  middle: { heading: 'text-on-middle-heading', body: 'text-on-middle-body' },
  dark: { heading: 'text-on-dark-heading', body: 'text-on-dark-body' },
};

/**
 * The parallax hero at the top of every page: a patterned background, a hero image and a glass card -- see
 * docs/refactor/12-phase-4-plan.md (step 6). Slots: `heroTitle` (the <h1> content) and `heroActions` (e.g.
 * streaming's buttons). Text inputs arrive already translated. Per-page overrides were standardized away by the
 * owner; see docs/refactor/05-roadmap.md.
 */
@Component({
  selector: 'app-hero',
  imports: [ParallaxSection, Card, Flourish],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-parallax-section
      [class]="backgroundClass()"
      [backgroundImage]="backgroundPatternImage()"
      backgroundSize="100px"
      backgroundHeight="200%"
      [parallaxStrength]="0.8"
      ariaLabel="Hero Background"
    >
      <div class="hero-image-wrapper absolute inset-0 mx-auto h-full max-w-7xl">
        <app-parallax-section
          [class]="heroImageClass()"
          ariaLabel="Hero section"
          [backgroundImage]="heroImageSrc()"
          [backgroundPosition]="heroImagePosition()"
          [backgroundHeight]="heroImageHeight()"
          [parallaxStrength]="0.65"
        ></app-parallax-section>
      </div>
      <div
        class="hero-content-wrapper relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-end justify-center text-left md:min-h-[95svh]"
        [class]="contentJustifyClass()"
      >
        <div appCard [glass]="true" [class]="cardClass()">
          <app-flourish variant="full" [class]="flourishClass()" />
          <p class="hero-reveal-kicker" [class]="kickerFullClass()">
            {{ kicker() }}
          </p>
          <h1 class="hero-reveal-title" [class]="titleFullClass()">
            <ng-content select="[heroTitle]" />
          </h1>
          @if (description()) {
            <p class="hero-reveal-copy mt-4 max-w-[56ch] text-sm leading-7 sm:text-base" [class]="bodyColorClass()">
              {{ description() }}
            </p>
          }
          @if (tagline()) {
            <p class="hero-reveal-copy" [class]="taglineFullClass()">
              {{ tagline() }}
            </p>
          }
          <ng-content select="[heroActions]" />
        </div>
      </div>
    </app-parallax-section>
  `,
})
export class Hero {
  // Outer background-pattern layer; its size and parallax speed are the same on every page.
  readonly backgroundClass = input.required<string>();
  readonly backgroundPatternImage = input('assets/graphics/pattern-stars.svg');

  // Inner hero-image parallax layer.
  readonly heroImageSrc = input.required<string>();
  readonly heroImagePosition = input.required<string>();
  readonly heroImageHeight = input('100%');
  readonly heroImageMaxWidthClass = input.required<string>();

  // Layout / tone, plus the default text styles each page can override.
  readonly tone = input<HeroTone>('light');
  readonly cardAlign = input<HeroCardAlign>('end');
  readonly cardMaxWidthClass = input.required<string>();

  readonly titleClass = input('text-[clamp(3.4rem,10vw,6.75rem)] leading-[0.9] font-black tracking-[0.02em] uppercase');
  readonly kickerClass = input('mb-3 text-sm font-bold tracking-[0.32em] uppercase sm:text-[0.95rem]');
  readonly taglineClass = input('mt-6 text-xs font-semibold tracking-[0.28em] uppercase sm:text-sm');

  // Content, already translated by the caller.
  readonly kicker = input.required<string>();
  readonly description = input<string | null>(null);
  readonly tagline = input<string | null>(null);

  // Kicker, title and flourish take the tone's heading color.
  readonly headingColorClass = computed(() => TONE_CLASSES[this.tone()].heading);

  // Description and tagline take the tone's body color on every page.
  readonly bodyColorClass = computed(() => TONE_CLASSES[this.tone()].body);

  // Card and image always sit on opposite sides, so one input sets both: card at the end means image on the left.
  readonly contentJustifyClass = computed(() => (this.cardAlign() === 'start' ? 'md:justify-start' : 'md:justify-end'));
  readonly heroImageAlignClass = computed(() => (this.cardAlign() === 'start' ? 'ml-auto' : ''));

  // The inner image layer: full height, aligned per cardAlign, edges faded on large screens.
  readonly heroImageClass = computed(() =>
    joinClasses(
      'absolute inset-0',
      this.heroImageAlignClass(),
      'h-full',
      this.heroImageMaxWidthClass(),
      'lg:mask-fade-x',
    ),
  );

  // The glass card: same padding on every page.
  readonly cardClass = computed(() =>
    joinClasses(
      'hero-reveal-surface',
      this.cardMaxWidthClass(),
      'px-6 py-6 sm:px-7 sm:py-7',
      'drop-shadow-md',
      'md:mb-16',
    ),
  );

  // The flourish centered on the card's top edge, visible at every width.
  readonly flourishClass = computed(() =>
    joinClasses('absolute top-0 left-1/2 z-10 h-8 -translate-x-1/2 -translate-y-1/2 md:h-12', this.headingColorClass()),
  );

  // Each text element's caller-overridable styles plus its tone color.
  readonly kickerFullClass = computed(() => joinClasses(this.kickerClass(), this.headingColorClass()));
  readonly titleFullClass = computed(() => joinClasses(this.titleClass(), this.headingColorClass()));
  readonly taglineFullClass = computed(() => joinClasses(this.taglineClass(), this.bodyColorClass()));
}
