import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Card } from '../../../shared/directives/card';
import { Reveal } from '../../../shared/directives/reveal';
import { Tone } from '../../../models/tone';

// Class names spelled out in full so Tailwind finds and generates them.
const TONE_CLASSES: Record<Tone, { heading: string; body: string }> = {
  light: { heading: 'text-on-light-heading', body: 'text-on-light-body' },
  middle: { heading: 'text-on-middle-heading', body: 'text-on-middle-body' },
  dark: { heading: 'text-on-dark-heading', body: 'text-on-dark-body' },
};

/**
 * One commission terms card: surface, heading, and a body area that fixes text size and colour for whatever it
 * projects (a `LabelledList` or a paragraph) -- so every terms card, ToS included, reads at the same 14px.
 * Chrome only, no "kind" flag; see docs/refactor/18-phase-6-stage-3-plan.md (stage 3c).
 */
@Component({
  selector: 'app-terms-card',
  imports: [Card, Reveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <article appReveal appCard [tone]="tone()" class="p-8" [attr.id]="anchorId() ?? null">
      <h3 class="text-2xl font-black" [class]="headingClass()">{{ title() }}</h3>
      <div class="mt-4 text-sm leading-7" [class]="bodyClass()">
        <ng-content />
      </div>
    </article>
  `,
})
export class TermsCard {
  readonly title = input.required<string>();
  readonly tone = input.required<Tone>();
  readonly anchorId = input<string>();

  // Heading and body colors for the card's tone.
  protected readonly headingClass = computed(() => TONE_CLASSES[this.tone()].heading);
  protected readonly bodyClass = computed(() => TONE_CLASSES[this.tone()].body);
}
