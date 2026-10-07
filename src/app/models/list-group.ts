/**
 * One labelled sub-list in a grouped i18n card (Artwork Usage, Terms of Service), read via `I18nService.groups()`.
 * `id` is the group's stable key -- for Artwork Usage it's the `UsageTypeId` its percent add-on is looked up by.
 */
export interface ListGroup {
  id: string;
  label: string;
  items: string[];
}
