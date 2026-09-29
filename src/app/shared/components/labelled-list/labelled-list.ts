import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ListGroup } from '../../../models/list-group';
import { Tone } from '../../../models/tone';

// Class names spelled out in full so Tailwind finds and generates them.
const HEADING_CLASS: Record<Tone, string> = {
  light: 'text-on-light-heading',
  middle: 'text-on-middle-heading',
  dark: 'text-on-dark-heading',
};

/**
 * One list of translated content: plain `items` (bulleted, or `numbered`), or labelled `groups`, each a small
 * heading over its own bullets. Leaves text size and body colour to its container, so every card using it
 * matches by construction -- see docs/refactor/18-phase-6-stage-3-plan.md (stage 3c).
 */
@Component({
  selector: 'app-labelled-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (groups().length) {
      <div class="space-y-4">
        @for (group of groups(); track group.id) {
          <div>
            <p class="text-xs font-semibold" [class]="headingClass()">{{ group.label }}</p>
            <ul class="mt-1 list-disc space-y-1 pl-5">
              @for (item of group.items; track $index) {
                <li>{{ item }}</li>
              }
            </ul>
          </div>
        }
      </div>
    } @else if (items().length) {
      @if (numbered()) {
        <ol class="list-decimal space-y-2 pl-5">
          @for (item of items(); track $index) {
            <li>{{ item }}</li>
          }
        </ol>
      } @else {
        <ul class="list-disc space-y-2 pl-5">
          @for (item of items(); track $index) {
            <li>{{ item }}</li>
          }
        </ul>
      }
    }
  `,
})
export class LabelledList {
  readonly tone = input.required<Tone>();
  readonly items = input<readonly string[]>([]);
  readonly numbered = input(false);
  readonly groups = input<readonly ListGroup[]>([]);

  protected readonly headingClass = computed(() => HEADING_CLASS[this.tone()]);
}
