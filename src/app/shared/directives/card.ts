import { Directive, computed, input } from '@angular/core';
import { Tone } from '../../models/tone';

/**
 * Applies the finished card/glass-panel design system (src/styles/components/cards.css) to its host element.
 * `tone` is required for the plain and `noBackground` surfaces (the shadow itself is tone-aware) but
 * meaningless for `glass` -- glass-panel's own CSS doesn't vary by tone (see CONTEXT.md's "Card" entry) -- so
 * it's typed optional rather than forcing every hero usage to pass an arbitrary, unused tone value. Since
 * that makes it look optional everywhere, `hostClass` throws if it's actually missing outside `glass` mode --
 * without that, a forgotten `tone` would silently produce a class matching no CSS rule (e.g.
 * `card-on-section-undefined`) with no compiler or runtime signal at all. `special`/`noBackground`/`glass`
 * combinations are still unenforced -- misuse there is a visible CSS mistake, not a silent one (see
 * docs/refactor/10-phase-3b-plan.md). Where more than one would apply, `glass` wins over `noBackground`,
 * which wins over the plain tone-painted surface.
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
    if (this.glass()) {
      return 'glass-panel';
    }

    const tone = this.tone();
    if (!tone) {
      throw new Error('[appCard] requires a `tone` input unless `glass` is set.');
    }

    if (this.noBackground()) {
      return `card-shadow-${tone}`;
    }
    return `card-on-section-${tone}${this.special() ? '-special' : ''}`;
  });
}
