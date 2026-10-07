import { Component, computed, input } from '@angular/core';
import { Social, SOCIALS, SocialId } from '../../../models/social';

type Variant = 'plain' | 'chip';

// The two looks: plain icons, or larger bordered chips.
const VARIANT_CLASSES: Record<Variant, string> = {
  plain:
    'inline-flex items-center justify-center text-xl text-on-light-heading transition-colors hover:text-on-light-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong',
  chip: 'inline-flex items-center justify-center rounded-2xl border border-border bg-white/65 p-4 text-5xl transition-colors hover:bg-brand-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong sm:p-5 sm:text-6xl md:text-5xl',
};

/**
 * Social-link icons: renders only the <a> items, and each page wraps them in its own layout -- see CONTEXT.md's
 * "Social link" entry.
 */
@Component({
  selector: 'app-social-links',
  // `display: contents` so each <a> sits directly in the caller's grid/flex layout, not inside one extra box.
  styles: ':host { display: contents; }',
  template: `
    @for (social of socials(); track social.id) {
      <a
        [href]="social.url"
        [attr.target]="isExternal(social) ? '_blank' : null"
        [attr.rel]="isExternal(social) ? 'noopener noreferrer' : null"
        [attr.aria-label]="social.ariaLabel"
        [class]="variantClass()"
      >
        <span class="social-icon" [class]="social.iconClass" aria-hidden="true"></span>
      </a>
    }
  `,
})
export class SocialLinks {
  readonly ids = input.required<SocialId[]>();
  readonly variant = input<Variant>('plain');

  // The SOCIALS entries for the requested ids, in the order given.
  readonly socials = computed(() => this.ids().map((id) => this.findSocial(id)));
  // The class string for the chosen look.
  readonly variantClass = computed(() => VARIANT_CLASSES[this.variant()]);

  isExternal(social: Social): boolean {
    // Email links stay in the same tab; everything else opens a new one.
    return !social.url.startsWith('mailto:');
  }

  private findSocial(id: SocialId): Social {
    // Look the id up, failing loudly on a typo rather than rendering a broken link.
    const social = SOCIALS.find((entry) => entry.id === id);
    if (!social) {
      throw new Error(`[app-social-links] no SOCIALS entry for id "${id}".`);
    }
    return social;
  }
}
