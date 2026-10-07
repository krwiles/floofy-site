/** The part of a Signal Forms field's state this rule reads. */
interface ValidityState {
  invalid(): boolean;
  touched(): boolean;
}

/**
 * Whether a field's errors should show: only once it's both invalid and touched, so nobody is scolded before they've
 * had a chance to fill it in. One rule for the red border, the error text and `aria-invalid` alike.
 */
export function showsErrors(state: ValidityState): boolean {
  return state.invalid() && state.touched();
}
