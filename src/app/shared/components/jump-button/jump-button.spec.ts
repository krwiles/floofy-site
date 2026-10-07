import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JumpButton } from './jump-button';

// Host that sets every input and records whether activate fired.
@Component({
  selector: 'app-jump-button-test-host',
  imports: [JumpButton],
  template: `
    <app-jump-button
      ariaLabel="Jump to section"
      title="Jump to section"
      [extraClass]="extraClass"
      (activate)="activated = true"
    />
  `,
})
class JumpButtonTestHost {
  extraClass = '';
  activated = false;
}

describe('JumpButton', () => {
  let fixture: ComponentFixture<JumpButtonTestHost>;

  function create(overrides: Partial<JumpButtonTestHost> = {}): void {
    // Render the host, applying per-test overrides before the first change detection.
    fixture = TestBed.createComponent(JumpButtonTestHost);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
  }

  function buttonEl(): HTMLButtonElement {
    // The button under test.
    return fixture.nativeElement.querySelector('button');
  }

  beforeEach(async () => {
    // Compile the host once per test.
    await TestBed.configureTestingModule({ imports: [JumpButtonTestHost] }).compileComponents();
  });

  it('renders the "?" glyph', () => {
    // Act and assert: the button shows "?".
    create();
    expect(buttonEl().textContent?.trim()).toBe('?');
  });

  it('sets the aria-label and title from its inputs', () => {
    // Act: render.
    create();
    // Assert: both labels come from the inputs.
    expect(buttonEl().getAttribute('aria-label')).toBe('Jump to section');
    expect(buttonEl().getAttribute('title')).toBe('Jump to section');
  });

  it('is type="button", so it never submits a form it sits inside', () => {
    // Act and assert: it's a plain button, not a submit button.
    create();
    expect(buttonEl().getAttribute('type')).toBe('button');
  });

  it('emits activate when clicked', () => {
    // Arrange: render.
    create();
    // Act: click it.
    buttonEl().click();
    // Assert: activate fired.
    expect(fixture.componentInstance.activated).toBe(true);
  });

  it('applies its own base classes with no extraClass given', () => {
    // Act: render with no extra class.
    create();
    // Assert: base classes only.
    expect(buttonEl().classList.contains('inline-flex')).toBe(true);
    expect(buttonEl().classList.contains('mt-px')).toBe(false);
  });

  it('applies an extra caller-supplied class alongside its own base classes', () => {
    // Act: render with an extra class.
    create({ extraClass: 'mt-px' });
    // Assert: both the extra and the base classes.
    expect(buttonEl().classList.contains('mt-px')).toBe(true);
    expect(buttonEl().classList.contains('inline-flex')).toBe(true);
  });
});
