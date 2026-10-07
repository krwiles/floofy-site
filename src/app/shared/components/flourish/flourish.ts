import { Component, input } from '@angular/core';

/**
 * A decorative CSS-mask flourish (styles/utilities/flourishes.css). It's drawn in currentColor, so it takes the
 * caller's text color.
 */
@Component({
  selector: 'app-flourish',
  template: `<span class="flourish" [class]="'f-' + variant()" [class.flip]="flip()" aria-hidden="true"></span>`,
  styles: `
    /* inline-block so a caller's height utility on <app-flourish> applies. In Tailwind's \`base\` layer, because
       unlayered component CSS would otherwise beat callers' \`hidden\`/\`md:*\` utilities. */
    @layer base {
      :host {
        display: inline-block;
      }
    }

    /* Fill the host's height. Scoped here, not in flourishes.css, so it can't override the height utilities
       app-section-divider puts directly on its own .flourish elements. */
    .flourish {
      height: 100%;
    }
  `,
  // No explicit changeDetection: OnPush is the default in Angular v22+.
})
export class Flourish {
  readonly variant = input.required<'end' | 'end-short' | 'full' | 'full-wide'>();
  readonly flip = input(false);
}
