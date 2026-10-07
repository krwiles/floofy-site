import { Directive, computed, input } from '@angular/core';
import { Tone } from '../../models/tone';

type Variant = 'primary' | 'secondary' | 'pill';

/**
 * Applies the button design system (src/styles/components/buttons.css) to its host <a>/<button>. `variant` (shape)
 * and `tone` (the section background it sits on) are independent; the fill contrasts with its tone -- see
 * CONTEXT.md's "Button" entry.
 */
@Directive({
  selector: 'a[appButton], button[appButton]',
  host: { '[class]': 'hostClass()' },
})
export class Button {
  readonly variant = input<Variant>('primary');
  readonly tone = input<Tone>('light');

  // The shared .btn classes for this variant and the tone of the surface it sits on.
  readonly hostClass = computed(() => `btn btn-${this.variant()} btn-on-${this.tone()}`);
}
