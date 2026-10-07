import { Component } from '@angular/core';

/**
 * The ornament between sections: a wide flourish centered on the seam, hidden below `md`. Identical everywhere, so
 * it has no inputs.
 */
@Component({
  selector: 'app-section-divider',
  template: `<span
    class="flourish f-full-wide absolute left-1/2 z-10 hidden h-16 -translate-x-1/2 -translate-y-1/2 text-border-strong md:inline-block"
    aria-hidden="true"
  ></span>`,
})
export class SectionDivider {}
