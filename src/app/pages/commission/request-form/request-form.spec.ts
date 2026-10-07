import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RequestForm, RequestFormDetail } from './request-form';

describe('RequestForm', () => {
  let fixture: ComponentFixture<RequestForm>;
  let el: HTMLElement;

  // The <app-form-field> whose label starts with `label`.
  function formField(label: string): HTMLElement {
    const fields: HTMLElement[] = Array.from(el.querySelectorAll('app-form-field'));
    return fields.find((field) => field.querySelector('p')?.textContent?.trim().startsWith(label))!;
  }

  // The checked radio in the group labelled `label`.
  function checkedValue(label: string): string | undefined {
    const groups: HTMLElement[] = Array.from(el.querySelectorAll('app-radio-group'));
    const group = groups.find((g) => g.querySelector('p')?.textContent?.includes(label));
    return (group?.querySelector('input:checked') as HTMLInputElement | null)?.value;
  }

  beforeEach(async () => {
    // Renders against the real en.json and pricing.json, in English.
    await TestBed.configureTestingModule({ imports: [RequestForm] }).compileComponents();
    fixture = TestBed.createComponent(RequestForm);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('moves reference links, deadline and additional notes onto the shared form field, notes folded into labels', () => {
    // Each of the three is now an <app-form-field>, found by its label.
    expect(formField('Reference Links')).toBeTruthy();
    expect(formField('Deadline (optional and not guaranteed)')?.querySelector('input[type="date"]')).toBeTruthy();
    expect(formField('Additional Notes (optional)')?.querySelector('textarea')).toBeTruthy();
  });

  it('shows validation errors on a migrated field, like every other field', () => {
    // Too-long reference links, and the visitor has left the field.
    const referenceLinks = fixture.componentInstance.commissionForm.referenceLinks();
    referenceLinks.value.set('x'.repeat(2001));
    referenceLinks.markAsTouched();
    fixture.detectChanges();

    // The shared error list now shows the max-length message.
    expect(formField('Reference Links').querySelector('.text-error')?.textContent).toContain(
      'Reference links cannot exceed 2000 characters.',
    );
  });

  it('applies a picked category, and re-applies it even when it is the same pick as last time', () => {
    // Picking illustration selects it and prices it ($80, personal use).
    fixture.componentInstance.selectCategory('illustration');
    fixture.detectChanges();
    expect(checkedValue('Commission Type')).toBe('illustration');
    expect(el.textContent).toContain('$80');

    // The visitor changes it by hand, then clicks the same card's CTA again.
    fixture.componentInstance.commissionForm.commissionType().value.set('emote');
    fixture.componentInstance.selectCategory('illustration');
    fixture.detectChanges();
    expect(checkedValue('Commission Type')).toBe('illustration');
  });

  it("appends each priced usage type's add-on to its radio label", () => {
    // Personal and Unsure add nothing; the other three show pricing.json's percent.
    const labels = Array.from(el.querySelectorAll('app-radio-group'))[1].querySelectorAll('input + span');
    expect(Array.from(labels).map((span) => span.textContent?.trim())).toEqual([
      'Personal',
      'Promotion (+50%)',
      'Distribution (+100%)',
      'Products (+200%)',
      'Unsure',
    ]);
  });

  it('asks the page for more detail from each "?" button', () => {
    // Record what the form asks for.
    const requested: RequestFormDetail[] = [];
    fixture.componentInstance.detailRequested.subscribe((detail) => requested.push(detail));

    // Commission Type, Usage Type, then the ToS checkbox's button.
    el.querySelectorAll('app-jump-button button').forEach((button) => (button as HTMLButtonElement).click());
    expect(requested).toEqual(['categories', 'usage', 'terms']);
  });

  it('leaves no untranslated keys in the form', () => {
    // t() echoes a missing key back, so any "commission." text means a broken lookup.
    expect(el.textContent).not.toContain('commission.');
  });

  it('keeps the submit button on one line, however long the status message beside it', () => {
    // Arrange: the submit button, which shares a row with the status message.
    const submit = el.querySelector('button[type="submit"]') as HTMLButtonElement;

    // Assert: it never shrinks or wraps, so a long message wraps instead (as on the contact and review forms).
    expect(submit.classList.contains('shrink-0')).toBe(true);
    expect(submit.classList.contains('whitespace-nowrap')).toBe(true);
  });
});
