import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { ParallaxSection } from '../parallax-section/parallax-section';

type Tone = 'light' | 'light-alt' | 'middle' | 'middle-alt' | 'dark' | 'dark-alt';

/**
 * A tone-colored <section>, optionally with a tiled pattern backdrop. Only this outer shell is shared; each caller
 * projects its own width/padding wrapper -- see docs/refactor/09-phase-3-plan.md.
 */
@Component({
  selector: 'app-section',
  imports: [ParallaxSection, NgTemplateOutlet],
  template: `
    <ng-template #projected>
      <ng-content />
    </ng-template>
    @if (pattern()) {
      <app-parallax-section
        [class]="toneClass()"
        [backgroundImage]="patternImage()"
        backgroundSize="100px"
        backgroundHeight="200%"
        [parallaxStrength]="parallaxStrength()"
        [ariaLabel]="ariaLabel() ?? 'Section'"
      >
        <ng-container *ngTemplateOutlet="projected" />
      </app-parallax-section>
    } @else {
      <section [class]="toneClass()" [attr.aria-label]="ariaLabel()">
        <ng-container *ngTemplateOutlet="projected" />
      </section>
    }
  `,
  // Block, like the <section> it replaces; inline would collapse the layout inside it.
  styles: ':host { display: block; }',
})
export class Section {
  readonly tone = input.required<Tone>();
  readonly pattern = input<'stars' | 'circles'>();
  readonly parallaxStrength = input(0.6);
  readonly ariaLabel = input<string>();

  // Background color for the tone.
  readonly toneClass = computed(() => `bg-section-${this.tone()}`);
  // The tiled pattern image (stars unless circles is asked for).
  readonly patternImage = computed(() =>
    this.pattern() === 'circles' ? 'assets/graphics/pattern-circles.svg' : 'assets/graphics/pattern-stars.svg',
  );
}
