import { Component, computed, input } from '@angular/core';
import { ParallaxSection } from '../parallax-section/parallax-section';

type Tone = 'light' | 'light-alt' | 'middle' | 'middle-alt' | 'dark' | 'dark-alt';

/**
 * A tone-coloured <section>, optionally with a tiled pattern backdrop.
 * Deliberately narrow: only the outer tone/pattern shell is common across
 * usages -- the inner width/padding wrapper varies per instance (checked
 * ~16 usages; no two share the same padding scale) and stays as the
 * caller's own projected content rather than becoming a parametrized input
 * that would either multiply endlessly or force a real spacing change on
 * some page. See docs/refactor/09-phase-3-plan.md.
 */
@Component({
  selector: 'app-section',
  imports: [ParallaxSection],
  template: `
    @if (pattern()) {
      <app-parallax-section
        [class]="toneClass()"
        [backgroundImage]="patternImage()"
        backgroundSize="100px"
        backgroundHeight="200%"
        [parallaxStrength]="parallaxStrength()"
        [ariaLabel]="ariaLabel() ?? 'Section'"
      >
        <ng-content />
      </app-parallax-section>
    } @else {
      <section [class]="toneClass()" [attr.aria-label]="ariaLabel()">
        <ng-content />
      </section>
    }
  `,
})
export class Section {
  readonly tone = input.required<Tone>();
  readonly pattern = input<'stars' | 'circles'>();
  readonly parallaxStrength = input(0.6);
  readonly ariaLabel = input<string>();

  readonly toneClass = computed(() => `bg-section-${this.tone()}`);
  readonly patternImage = computed(() =>
    this.pattern() === 'circles' ? 'assets/intersecting-circles.svg' : 'assets/4-point-stars.svg',
  );
}
