import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { ArtworkCategory } from '../../models/artwork-category';
import { Hero } from '../../shared/components/hero/hero';
import { SectionDivider } from '../../shared/components/section-divider/section-divider';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { scrollToElement } from '../../utils/scroll-to-element';
import { PricingSection } from './pricing-section/pricing-section';
import { RequestForm, RequestFormDetail } from './request-form/request-form';
import { TermsSection } from './terms-section/terms-section';

// The section each "?" button in the form jumps to.
const DETAIL_ANCHOR: Record<RequestFormDetail, string> = {
  categories: 'commission-types',
  usage: 'artwork-usage',
  terms: 'commission-terms',
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
    this.requestForm().selectCategory(category);
    scrollToElement('commission-form', { focus: false });
  }

  /** A form "?" button asked for more detail: jump to and focus that section. */
  protected onDetailRequested(detail: RequestFormDetail): void {
    scrollToElement(DETAIL_ANCHOR[detail]);
  }
}
