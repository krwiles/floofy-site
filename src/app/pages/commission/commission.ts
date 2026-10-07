import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { ArtworkCategory } from '../../models/artwork-category';
import { Hero } from '../../shared/components/hero/hero';
import { SectionDivider } from '../../shared/components/section-divider/section-divider';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { scrollToElement } from '../../utils/scroll-to-element';
import { PricingSection } from './pricing-section/pricing-section';
import { RequestForm, RequestFormDetail } from './request-form/request-form';
import { TermsSection } from './terms-section/terms-section';
import { COMMISSION_ANCHORS } from './commission-content';

// The section each "?" button in the form jumps to.
const DETAIL_ANCHOR: Record<RequestFormDetail, string> = {
  categories: COMMISSION_ANCHORS.pricing,
  usage: COMMISSION_ANCHORS.artworkUsage,
  terms: COMMISSION_ANCHORS.terms,
};

/**
 * The commission page: an outline of hero, pricing, terms and request form. It's the one place that knows about
 * all three sections, so it relays between them -- see docs/refactor/18-phase-6-stage-3-plan.md (stage 3c).
 */
@Component({
  selector: 'app-commission',
  imports: [Hero, SectionDivider, TranslatePipe, PricingSection, TermsSection, RequestForm],
  templateUrl: './commission.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Commission {
  private readonly requestForm = viewChild.required(RequestForm);

  /** A pricing card was picked: preselect it in the form, then scroll there (no focus -- the form isn't one spot). */
  protected onPick(category: ArtworkCategory): void {
    // Preselect the picked category in the form.
    this.requestForm().selectCategory(category);
    // Then scroll to the form.
    scrollToElement(COMMISSION_ANCHORS.form, { focus: false });
  }

  /** A form "?" button asked for more detail: jump to and focus that section. */
  protected onDetailRequested(detail: RequestFormDetail): void {
    // Jump to the matching section and focus it.
    scrollToElement(DETAIL_ANCHOR[detail]);
  }
}
