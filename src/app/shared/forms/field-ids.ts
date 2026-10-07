import { InjectionToken } from '@angular/core';

/** The ids a form field's pieces share: its control's, and its error list's (which the control is described by). */
export interface FieldIds {
  readonly controlId: string;
  readonly errorId: string;
}

/** Provided by `FormFieldGroup` to the control projected into it, so `appControl` can link itself to its label and errors. */
export const FIELD_IDS = new InjectionToken<FieldIds>('FIELD_IDS');

// Counts up for the whole page, so no two fields ever share an id.
let nextFieldNumber = 0;

/** A fresh, page-unique pair of ids for one field. */
export function createFieldIds(): FieldIds {
  const number = ++nextFieldNumber;
  return { controlId: `field-${number}`, errorId: `field-${number}-errors` };
}
