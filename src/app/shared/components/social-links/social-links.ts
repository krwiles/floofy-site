import { Component, computed, input } from '@angular/core';
import { Social, SOCIALS, SocialId } from '../../../models/social';

type Variant = 'plain' | 'chip';

const VARIANT_CLASSES: Record<Variant, string> = {
  plain:
    'inline-flex items-center justify-center text-xl text-on-light-heading transition-colors hover:text-on-light-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong',
  chip: 'inline-flex items-center justify-center rounded-2xl border border-border bg-white/65 p-4 text-5xl transition-colors hover:bg-brand-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong sm:p-5 sm:text-6xl md:text-5xl',
};

/**
 * A row of social-link icons. Renders only the individual <a> items -- each
 * page keeps its own wrapping container (grid/flex, whatever column/gap
 * layout it needs) around this component. See CONTEXT.md ("Social link").
 */
@Component({
  selector: 'app-social-links',
  // display: contents -- callers grid/flex their own wrapping container
  // directly around the repeated <a> items (see CONTEXT.md "Social link"),
  // so this host must not introduce its own box: a real box would become a
  // single grid/flex item instead of letting each <a> participate in the
  // caller's layout, silently collapsing a grid into one cell.
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

  readonly socials = computed(() => this.ids().map((id) => this.findSocial(id)));
  readonly variantClass = computed(() => VARIANT_CLASSES[this.variant()]);

  isExternal(social: Social): boolean {
    return !social.url.startsWith('mailto:');
  }

  private findSocial(id: SocialId): Social {
    const social = SOCIALS.find((entry) => entry.id === id);
    if (!social) {
      throw new Error(`[app-social-links] no SOCIALS entry for id "${id}".`);
    }
    return social;
  }
}
