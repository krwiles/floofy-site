import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { joinClasses } from '../../../utils/join-classes';

/**
 * A small round "?" button that jumps to more detail lower on the page, used as `[labelExtra]` content on the
 * commission form. It emits `activate` and the caller decides where to jump; `extraClass` allows small nudges.
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

  // The fixed round-button styling, plus any per-caller extra classes.
  readonly hostClass = computed(() =>
    joinClasses(
      'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-xs leading-none font-bold text-on-middle-body transition-colors hover:bg-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong',
      this.extraClass(),
    ),
  );
}
