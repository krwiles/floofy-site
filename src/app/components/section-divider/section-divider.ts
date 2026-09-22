import { Component } from '@angular/core';

/**
 * The "between sections" flourish ornament -- always the same shape (a wide
 * flourish centred on the seam, hidden below md), confirmed with zero
 * variation across all 13 usages before extracting this. No inputs needed.
 */
@Component({
  selector: 'app-section-divider',
  template: `<span
    class="flourish f-full-wide absolute left-1/2 z-10 hidden h-16 -translate-x-1/2 -translate-y-1/2 text-border-strong md:inline-block"
    aria-hidden="true"
  ></span>`,
})
export class SectionDivider {}
