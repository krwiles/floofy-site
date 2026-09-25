import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ParallaxSection } from '../parallax-section/parallax-section';
import { Card } from '../../directives/card';
import { Flourish } from '../flourish/flourish';

export type HeroTone = 'light' | 'middle' | 'dark';
export type HeroCardAlign = 'start' | 'end';

// Mirrors the shape (if not the literal type) of section-header.ts's own TONE_CLASSES map -- a lookup
// table, not ad hoc ternaries, so a future rename of any of these color tokens is one map to update,
// not a scattered set of conditionals. HeroTone stays its own narrower 'light' | 'dark' rather than the
// shared, 3-value Tone from models/tone.ts: every real usage across all 8 pages is one or the other,
// never 'middle', and section-header.ts's own tone map is likewise local rather than reusing it -- an
// existing inconsistency this doesn't originate, and adding an unused 'middle' branch here wouldn't
// actually resolve it.
const TONE_CLASSES: Record<HeroTone, { heading: string; body: string }> = {
  light: { heading: 'text-on-light-heading', body: 'text-on-light-body' },
  middle: { heading: 'text-on-middle-heading', body: 'text-on-middle-body' },
  dark: { heading: 'text-on-dark-heading', body: 'text-on-dark-body' },
};

/** Joins class fragments with a single space, dropping any empty ones -- avoids the classic
 * off-by-one when building a class list by hand from several optional/required pieces. */
function joinClasses(...parts: string[]): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * The parallax hero block repeated, with real per-page variation, at the top of all 8 pages --
 * consolidates that duplication into one component. Not a redesign: every input below exists to
 * reproduce some page's exact existing output (see docs/refactor/12-phase-4-plan.md, Phase 4 step 6),
 * verified per page via this project's scripted visual-diff tool rather than a formal spec.
 *
 * Two content slots, per the plan: `heroTitle` (the <h1>'s own content -- a plain translated string
 * for 7 of 8 pages, home's two-line name for the 8th) and `heroActions` (streaming's CTA row, in place
 * of a tagline). Every other string (`kicker`/`description`/`tagline`) comes in already-translated by
 * the caller, per the plan's own decision to keep this component i18n-agnostic -- streaming is the one
 * exception, passing hardcoded English rather than a translated string, a pre-existing i18n gap on
 * that page carried over unchanged (see streaming.html's own comment), not something this component
 * enforces or should be assumed to guarantee.
 *
 * The remaining "override" class inputs each default to what the rest of the site shares. Several
 * one-page-only overrides existed here originally -- card padding, an extra content-wrapper class, a
 * body-text color quirk shared by gallery/contact/home, a capitalization difference in one aria-label,
 * about.html's own slightly faster parallax speed, commission's own image position/offset quirks, and
 * a hidden-below-`md` flourish everywhere but home -- and were removed once the owner reviewed this
 * component and decided each one should standardize to a single shared behavior instead of being
 * preserved as a per-page difference (in the flourish's case, standardizing *to* home's own behavior --
 * always visible -- rather than away from it) -- see docs/refactor/05-roadmap.md for those rounds.
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
  // Outer background-pattern layer. Size/height/aria-label/parallax speed are the same on every page
  // -- about.html used to run its outer/inner parallax slightly faster (0.9/0.7 vs. the common
  // 0.8/0.65); standardized away rather than kept as a one-page override, per the owner's own call.
  readonly backgroundClass = input.required<string>();
  readonly backgroundPatternImage = input('assets/4-point-stars.svg');

  // Inner hero-image parallax layer.
  readonly heroImageSrc = input.required<string>();
  readonly heroImagePosition = input.required<string>();
  readonly heroImageHeight = input('100%');
  readonly heroImageMaxWidthClass = input.required<string>();

  // Layout / tone.
  readonly tone = input<HeroTone>('light');
  readonly cardAlign = input<HeroCardAlign>('end');
  readonly cardMaxWidthClass = input.required<string>();

  readonly titleClass = input('text-[clamp(3.4rem,10vw,6.75rem)] leading-[0.9] font-black tracking-[0.02em] uppercase');
  readonly kickerClass = input('mb-3 text-sm font-bold tracking-[0.32em] uppercase sm:text-[0.95rem]');
  readonly taglineClass = input('mt-6 text-xs font-semibold tracking-[0.28em] uppercase sm:text-sm');

  // Content -- already translated by the caller; see this component's own doc comment.
  readonly kicker = input.required<string>();
  readonly description = input<string | null>(null);
  readonly tagline = input<string | null>(null);

  readonly headingColorClass = computed(() => TONE_CLASSES[this.tone()].heading);

  // Every page's description/tagline uses the body color -- gallery, contact, and home used to be
  // exceptions (using the heading color instead), an inconsistency standardized away rather than kept
  // as a per-page override, per the owner's own call.
  readonly bodyColorClass = computed(() => TONE_CLASSES[this.tone()].body);

  // The card and the hero image sit on opposite sides of the layout -- see this component's own doc
  // comment: every one of the 8 pages pairs "card at the end" with "image on the left" (the default,
  // no ml-auto) and "card at the start" with "image pushed right" (ml-auto), with no exception, so one
  // input derives both sides rather than risking them being set inconsistently.
  readonly contentJustifyClass = computed(() => (this.cardAlign() === 'start' ? 'md:justify-start' : 'md:justify-end'));
  readonly heroImageAlignClass = computed(() => (this.cardAlign() === 'start' ? 'ml-auto' : ''));

  readonly heroImageClass = computed(() =>
    joinClasses(
      'absolute inset-0',
      this.heroImageAlignClass(),
      'h-full',
      this.heroImageMaxWidthClass(),
      'lg:mask-fade-x',
    ),
  );

  // Card padding is the same on every page -- home used to run larger (px-7/py-7, sm:px-9/py-9)
  // padding than the rest; standardized away rather than kept as a one-page override, per the owner's
  // own call.
  readonly cardClass = computed(() =>
    joinClasses(
      'hero-reveal-surface',
      this.cardMaxWidthClass(),
      'px-6 py-6 sm:px-7 sm:py-7',
      'drop-shadow-md',
      'md:mb-16',
    ),
  );

  // Always visible, at every width -- standardized to home's own original behavior, the one page that
  // never hid this below `md` like the other 7 used to.
  readonly flourishClass = computed(() =>
    joinClasses('absolute top-0 left-1/2 z-10 h-8 -translate-x-1/2 -translate-y-1/2 md:h-12', this.headingColorClass()),
  );

  readonly kickerFullClass = computed(() => joinClasses(this.kickerClass(), this.headingColorClass()));
  readonly titleFullClass = computed(() => joinClasses(this.titleClass(), this.headingColorClass()));
  readonly taglineFullClass = computed(() => joinClasses(this.taglineClass(), this.bodyColorClass()));
}
