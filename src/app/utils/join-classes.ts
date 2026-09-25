/** Joins class fragments with a single space, dropping any empty ones -- avoids the classic off-by-one when
 * building a class list by hand from several optional/required pieces. Shared by `hero.ts` and `control.ts`
 * (previously duplicated verbatim between them). */
export function joinClasses(...parts: string[]): string {
  return parts.filter(Boolean).join(' ');
}
