import { Component, computed, input } from '@angular/core';
import { Reveal } from '../../directives/reveal';
import { Flourish } from '../flourish/flourish';

type Tone = 'light' | 'middle' | 'dark';

// Per-tone text colors for each line, spelled out in full so Tailwind generates them.
const TONE_CLASSES: Record<Tone, { eyebrow: string; heading: string; body: string }> = {
  light: { eyebrow: 'text-on-light-body-subtle', heading: 'text-on-light-heading', body: 'text-on-light-body' },
  middle: { eyebrow: 'text-on-middle-body-subtle', heading: 'text-on-middle-heading', body: 'text-on-middle-body' },
  dark: { eyebrow: 'text-on-dark-body-subtle', heading: 'text-on-dark-heading', body: 'text-on-dark-body' },
};

/**
 * The eyebrow / title / description / flourish stack at the top of most sections, at one standard size. Headers that
 * don't fit this shape are written by hand -- see docs/refactor/09-phase-3-plan.md.
 */
@Component({
  selector: 'app-section-header',
  imports: [Reveal, Flourish],
  template: `
    <div class="mb-12 text-center">
      <p appReveal class="mb-2 text-sm font-semibold tracking-[0.35em] uppercase" [class]="colors().eyebrow">
        {{ eyebrow() }}
      </p>
      <h2
        appReveal
        class="mb-4 text-4xl leading-tight font-black tracking-tight wrap-break-word"
        [class]="colors().heading"
      >
        {{ title() }}
      </h2>
      @if (description()) {
        <p appReveal class="mx-auto mb-2 max-w-3xl leading-7" [class]="colors().body">
          {{ description() }}
        </p>
      }
      @if (flourish()) {
        <div appReveal class="mx-auto mb-12 flex justify-center">
          <app-flourish variant="full" class="h-8" [class]="colors().heading" />
        </div>
      }
    </div>
  `,
  // Block, like the wrapper <div> it replaces (custom elements default to inline).
  styles: ':host { display: block; }',
})
export class SectionHeader {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly tone = input.required<Tone>();
  readonly flourish = input(true);

  // The color set for the current tone.
  readonly colors = computed(() => TONE_CLASSES[this.tone()]);
}
