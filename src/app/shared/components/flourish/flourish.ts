import { Component, input } from '@angular/core';

/**
 * Decorative CSS-mask flourish. Wraps the existing `.flourish`/`.f-*` mask
 * technique (see styles/utilities/flourishes.css) -- colour comes from
 * currentColor, so it inherits whatever text colour the caller sets.
 */
@Component({
  selector: 'app-flourish',
  template: `
    <span class="flourish" [class]="'f-' + variant()" [class.flip]="flip()" aria-hidden="true"></span>
  `,
  styles: `
    /* display: inline-block, not the default inline -- callers size this component via an
       explicit height utility (h-6/h-8/h-12/...) on <app-flourish> itself, and that utility has
       no effect on a plain \`display: inline\` element (same underlying issue flourishes.css's
       .flourish had before its own fix). Also required for the span rule below to have a real
       height to resolve 100% against, rather than an indefinite inline box.

       Wrapped in Tailwind's own "base" layer (not left unlayered): Tailwind v4 puts every one of
       its own utilities -- including \`hidden\` and responsive variants like \`md:inline-block\` --
       in \`@layer utilities\`, which Tailwind's own \`@layer theme,base,components,utilities;\`
       declaration ranks ABOVE \`base\`. Angular's compiled component styles are unlayered CSS by
       default, and unlayered CSS always wins over ANY layered CSS regardless of specificity or
       source order (the same root cause behind an earlier bug in this file, see the height rule
       below) -- so this rule was unconditionally beating every caller's \`hidden\` class site-wide,
       keeping every "hide below md" flourish visible (and, since several are absolutely positioned
       and centered via left-1/2, wide enough to push real horizontal overflow onto the page) on
       every mobile viewport, on every page that tried to hide one. Moving this into \`base\`
       (the same layer name Tailwind itself uses for exactly this purpose -- default styles a
       utility class should be able to override) fixes that without weakening the default: it still
       applies whenever a caller doesn't override it, same as before. */
    @layer base {
      :host {
        display: inline-block;
      }
    }

    /* height: 100% here, scoped to this component (Angular emulated encapsulation), not in the
       shared .flourish class in flourishes.css -- callers size THIS span via a height utility
       on the HOST, one element up, which never reached the span at all (it rendered at its own
       ambient font-size via flourishes.css's min-height: 1em regardless of the host's real
       height, e.g. a h-12 (48px) hero flourish rendering at 16px). This must stay scoped here
       rather than added to the shared class: app-section-divider uses .flourish directly
       (unwrapped) with its OWN height utility on the same element, and an unscoped
       height: 100% there would be unlayered CSS beating that utility's layered Tailwind rule
       outright, on the very box that already had a correct explicit height. Scoping this to
       Flourish's own template (via the compiler-generated attribute selector) means it can only
       ever match the span this component itself renders. */
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
