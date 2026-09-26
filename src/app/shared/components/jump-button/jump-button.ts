import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { joinClasses } from '../../../utils/join-classes';

/**
 * A small round "?" button that jumps to more detail lower on the page -- commission's Commission-Type/
 * Usage-Type/ToS rows each have one, projected as `[labelExtra]` content into `RadioGroup`/`CheckboxField`.
 * Extracted after `/code-review` flagged the same 9-line button (identical structure/classes, differing only
 * in click handler and two translation keys) copy-pasted three times in commission.html.
 *
 * Emits `activate` rather than taking a click handler directly, so the caller keeps owning what "jump" means
 * (calling its own `scrollToX()` method) -- this component only owns the button's own look and semantics.
 * `extraClass` exists for the one caller (the ToS row) that needs a small vertical-alignment nudge (`mt-px`)
 * the other two don't.
 */
@Component({
  selector: 'app-jump-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <button
      type="button"
      (click)="activate.emit()"
      [class]="hostClass()"
      [attr.aria-label]="ariaLabel()"
      [attr.title]="title()"
    >
      ?
    </button>
  `,
})
export class JumpButton {
  readonly ariaLabel = input.required<string>();
  readonly title = input.required<string>();
  readonly extraClass = input('');
  readonly activate = output<void>();

  readonly hostClass = computed(() =>
    joinClasses(
      'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-xs leading-none font-bold text-on-middle-body transition-colors hover:bg-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong',
      this.extraClass(),
    ),
  );
}
