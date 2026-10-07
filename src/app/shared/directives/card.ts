import { Directive, computed, input } from '@angular/core';
import { Tone } from '../../models/tone';

/**
 * Applies the card/glass-panel design system (src/styles/components/cards.css) to its host element. `tone` is needed
 * for every surface except `glass`, whose CSS ignores tone, so it's optional in the type and checked at runtime
 * instead. Precedence: `glass`, then `noBackground`, then the plain tone-painted surface. See CONTEXT.md's "Card"
 * entry and docs/refactor/10-phase-3b-plan.md.
 */
@Directive({
  selector: '[appCard]',
  host: { '[class]': 'hostClass()' },
})
export class Card {
  readonly tone = input<Tone>();
  readonly special = input(false);
  readonly noBackground = input(false);
  readonly glass = input(false);

  readonly hostClass = computed(() => {
    // Glass ignores tone entirely.
    if (this.glass()) {
      return 'glass-panel';
    }

    // Every other surface needs a tone; fail loudly instead of emitting `card-on-section-undefined`.
    const tone = this.tone();
    if (!tone) {
      throw new Error('[appCard] requires a `tone` input unless `glass` is set.');
    }

    // Shadow-only surface, or the painted surface (optionally its -special variant).
    if (this.noBackground()) {
      return `card-shadow-${tone}`;
    }
    return `card-on-section-${tone}${this.special() ? '-special' : ''}`;
  });
}
