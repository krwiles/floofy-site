import { Component, input } from '@angular/core';

/**
 * Decorative CSS-mask flourish. Wraps the existing `.flourish`/`.f-*` mask
 * technique (see styles/utilities/flourishes.css) -- colour comes from
 * currentColor, so it inherits whatever text colour the caller sets.
 */
@Component({
  selector: 'app-flourish',
  template: `<span class="flourish" [class]="'f-' + variant()" [class.flip]="flip()" aria-hidden="true"></span>`,
  // No explicit changeDetection: OnPush is the default in Angular v22+.
})
export class Flourish {
  readonly variant = input.required<'end' | 'end-short' | 'full' | 'full-wide'>();
  readonly flip = input(false);
}
