import { ArtworkCategory } from '../../models/artwork-category';

// Page layout facts for the commission page: code constants, not translated content --
// see docs/refactor/18-phase-6-stage-3-plan.md (stage 3c).

/** Element ids the page scrolls to, kept in one place so a rename can't miss a spot. */
export const COMMISSION_ANCHORS = {
  pricing: 'commission-types',
  artworkUsage: 'artwork-usage',
  terms: 'commission-terms',
  form: 'commission-form',
} as const;

/** Left-to-right order of the pricing cards (also the order of the form's category options). */
export const PRICING_CARD_ORDER: readonly ArtworkCategory[] = ['chibi', 'emote', 'illustration'];

/** The five lists every pricing card shows, in order; each id also names its `commission.labels.<id>` heading. */
export const PRICING_LIST_ORDER = ['includes', 'excludes', 'details', 'notes', 'turnaround'] as const;
export type PricingListId = (typeof PRICING_LIST_ORDER)[number];

/** Each card's carousel aspect ratio, as a Tailwind class (spelled out in full so Tailwind generates it). */
export const CAROUSEL_SHAPE: Readonly<Record<ArtworkCategory, string>> = {
  chibi: 'aspect-square',
  emote: 'aspect-square',
  illustration: 'aspect-3/4',
};

export type TermsCardId = 'revisions' | 'workflow' | 'communication' | 'pricing' | 'artwork_usage' | 'payment' | 'tos';

/** How a terms card's body is shaped in the i18n JSON: a list, a numbered list, one paragraph, or groups. */
export type TermsBody = 'items' | 'numbered' | 'paragraph' | 'groups';

/** Each terms card's body shape, plus the scroll-anchor id for the one card the form links to. */
export const TERMS_CARDS: Readonly<Record<TermsCardId, { body: TermsBody; anchorId?: string }>> = {
  revisions: { body: 'items' },
  workflow: { body: 'numbered' },
  communication: { body: 'paragraph' },
  pricing: { body: 'items' },
  artwork_usage: { body: 'groups', anchorId: COMMISSION_ANCHORS.artworkUsage },
  payment: { body: 'items' },
  tos: { body: 'groups' },
};

/** The terms' three columns, balanced by hand: ToS is long, so it gets a column to itself. */
export const TERMS_COLUMNS: readonly (readonly TermsCardId[])[] = [
  ['revisions', 'workflow', 'communication'],
  ['pricing', 'artwork_usage', 'payment'],
  ['tos'],
];
