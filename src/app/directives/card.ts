import { Directive, computed, input } from '@angular/core';

type Tone = 'light' | 'middle' | 'dark';

/**
 * Applies the finished card/glass-panel design system (src/styles/components/cards.css) to its host element.
 * `tone`, `special`, `noBackground` and `glass` are not runtime-enforced as mutually exclusive -- misuse is a
 * visible CSS mistake, not a silent data bug (see docs/refactor/10-phase-3b-plan.md). Where more than one
 * would apply, `glass` wins over `noBackground`, which wins over the plain tone-painted surface.
 */
@Directive({
  selector: '[appCard]',
  host: { '[class]': 'hostClass()' },
})
export class Card {
  readonly tone = input.required<Tone>();
  readonly special = input(false);
  readonly noBackground = input(false);
  readonly glass = input(false);

  readonly hostClass = computed(() => {
    if (this.glass()) {
      return 'glass-panel';
    }
    if (this.noBackground()) {
      return `card-shadow-${this.tone()}`;
    }
    return `card-on-section-${this.tone()}${this.special() ? '-special' : ''}`;
  });
}
