import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JumpButton } from './jump-button';

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
    fixture = TestBed.createComponent(JumpButtonTestHost);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
  }

  function buttonEl(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [JumpButtonTestHost] }).compileComponents();
  });

  it('renders the "?" glyph', () => {
    create();
    expect(buttonEl().textContent?.trim()).toBe('?');
  });

  it('sets the aria-label and title from its inputs', () => {
    create();
    expect(buttonEl().getAttribute('aria-label')).toBe('Jump to section');
    expect(buttonEl().getAttribute('title')).toBe('Jump to section');
  });

  it('is type="button", so it never submits a form it sits inside', () => {
    create();
    expect(buttonEl().getAttribute('type')).toBe('button');
  });

  it('emits activate when clicked', () => {
    create();
    buttonEl().click();
    expect(fixture.componentInstance.activated).toBe(true);
  });

  it('applies its own base classes with no extraClass given', () => {
    create();
    expect(buttonEl().classList.contains('inline-flex')).toBe(true);
    expect(buttonEl().classList.contains('mt-px')).toBe(false);
  });

  it('applies an extra caller-supplied class alongside its own base classes', () => {
    create({ extraClass: 'mt-px' });
    expect(buttonEl().classList.contains('mt-px')).toBe(true);
    expect(buttonEl().classList.contains('inline-flex')).toBe(true);
  });
});
