import { PathKind, required, requiredError, SchemaPath, SchemaPathRules, validate } from '@angular/forms/signals';

/**
 * Like Signal Forms' `required()`, but a value that's only whitespace counts as empty too, since `required()` accepts
 * `"   "`. The backend refuses blank required fields the same way.
 */
export function requiredText<TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>,
  options: { message: string },
): void {
  // The usual rule: marks the field required (for its `*` marker) and catches an empty value.
  required(path, options);

  // Also catch text that's blank once trimmed; an empty value is left to `required()`, so it isn't reported twice.
  validate(path, ({ value }) => {
    const text = value();
    return text !== '' && text.trim() === '' ? requiredError(options) : undefined;
  });
}
