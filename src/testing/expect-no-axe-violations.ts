import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Runs the axe-core accessibility rules on `element` and fails with each broken rule's name and the elements it
 * flagged. Contrast is skipped (jsdom can't compute colors), and so is "region", since a lone component isn't meant to
 * sit in a page landmark.
 */
export async function expectNoAxeViolations(element: Element): Promise<void> {
  // axe.run resolves with every rule that failed, each listing the elements it failed on.
  const { violations } = await axe.run(element, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });

  // One readable line per broken rule, so a failure says what to fix.
  const problems = violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target.join(' ')).join(', ')})`,
  );
  expect(problems).toEqual([]);
}
