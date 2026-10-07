/** Joins class fragments with single spaces, dropping empty ones, so optional pieces never leave stray spaces. */
export function joinClasses(...parts: string[]): string {
  // `filter(Boolean)` drops '' (and any other empty piece) before joining.
  return parts.filter(Boolean).join(' ');
}
