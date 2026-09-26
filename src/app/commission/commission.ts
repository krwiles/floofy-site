import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Hero } from '../components/hero/hero';
import { TranslatePipe } from '../shared/pipes/translate.pipe';
import { SlideshowCarousel } from '../components/slideshow-carousel/slideshow-carousel';
import { GalleryImageService } from '../services/gallery-image.service';
import { email, form, FormField, FormRoot, maxLength, required } from '@angular/forms/signals';
import { PricingService } from '../services/pricing.service';
import { CurrencyPipe, PercentPipe } from '@angular/common';
import { CreateCommissionRequest } from '../models/commission.model';
import { ApiService } from '../services/api.service';
import { I18nService } from '../services/i18n.service';
import { Reveal } from '../shared/directives/reveal';
import { SectionDivider } from '../components/section-divider/section-divider';
import { SectionHeader } from '../components/section-header/section-header';
import { Section } from '../components/section/section';
import { Card } from '../shared/directives/card';
import { Button } from '../shared/directives/button';
import { FormFieldGroup } from '../components/form-field-group/form-field-group';
import { Control } from '../shared/directives/control';
import { RadioGroup } from '../components/radio-group/radio-group';
import { CheckboxField } from '../components/checkbox-field/checkbox-field';
import { FormStatus } from '../components/form-status/form-status';
import { JumpButton } from '../components/jump-button/jump-button';
import { createFormSubmission } from '../forms/form-submission';
import { FormSubmissionStatus } from '../models/form-submission-status';

/**
 * Migrated onto Phase 5's shared form pieces (FormFieldGroup/Control/RadioGroup/CheckboxField/FormStatus/
 * createFormSubmission/ApiService) -- see docs/refactor/16-phase-5-commission-plan.md. Three real,
 * pre-existing differences between commission's own markup and the shared components' hardcoded defaults
 * (built to match contact's/reviews' own original markup, per PRs #36/#37) were found during this migration
 * and, per the owner's explicit call, standardized away rather than preserved: (1) `FormFieldGroup`'s label
 * row uses `gap-2`; commission's fields used `gap-1`. (2) `CheckboxField`'s row likewise defaults to `gap-2`;
 * commission's ToS row used `gap-1`. (3) `FormFieldGroup`'s label is `text-sm font-semibold`; commission's own
 * labels were plain `font-semibold` (base text size) -- found only once actual rendered page height came out
 * shorter than expected after the gap changes, not caught in the initial design pass. All three are small,
 * deliberate visual changes on this one page (label text slightly smaller, a few pixels more breathing room
 * per field) -- confirmed via landmark-position measurements in a real browser, not just accepted as an
 * unexplained size-mismatch in the scripted visual diff (which can't produce a percentage once page height
 * itself changes).
 *
 * A second `/code-review` pass (on a later, stacked PR, scoped too broadly and flagging several already-
 * merged/already-disclosed decisions from unrelated earlier phases as if they were new -- verified via git
 * history before acting on anything) found two real, in-scope issues here: the three identical "jump to
 * detail" `?` buttons (Commission Type/Usage Type/ToS) were extracted to `JumpButton` (`app-jump-button`);
 * `formatPercentAddon` now calls the already-injected `PercentPipe` directly instead of a hand-rolled
 * reimplementation of its `'1.0-0'` rounding rule.
 */
interface CommissionFormValue {
  name: string;
  email: string;
  commissionType: 'illustration' | 'chibi' | 'emotes';
  description: string;
  referenceLinks: string;
  usageType: 'personal' | 'promotion' | 'distribution' | 'products' | 'unsure';
  usageExplanation: string;
  deadline: string;
  additionalNotes: string;
  tosAccepted: boolean;
}

@Component({
  selector: 'app-commission',
  imports: [
    SlideshowCarousel,
    Hero,
    TranslatePipe,
    FormField,
    CurrencyPipe,
    PercentPipe,
    FormRoot,
    Reveal,
    SectionDivider,
    SectionHeader,
    Section,
    Card,
    Button,
    FormFieldGroup,
    Control,
    RadioGroup,
    CheckboxField,
    FormStatus,
    JumpButton,
  ],
  // PercentPipe alone in `imports` only resolves it for the template's own `| percent` syntax (the Artwork
  // Usage terms section) -- `inject(PercentPipe)` in the class body below needs it as a real provider too.
  providers: [PercentPipe],
  templateUrl: './commission.html',
  styleUrl: './commission.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Commission {
  private readonly galleryImageService = inject(GalleryImageService);
  private readonly apiService = inject(ApiService);
  private readonly i18n = inject(I18nService);
  private readonly percentPipe = inject(PercentPipe);
  readonly pricingService = inject(PricingService);
  readonly status = signal<FormSubmissionStatus>({ kind: 'idle', message: '' });

  private readonly scrollOffset = 108;
  private readonly scrollFocusClass = 'scroll-focus-highlight';
  private readonly scrollFocusDurationMs = 1600;
  private readonly focusDelay = 1000;

  readonly chibiCarouselImages = this.galleryImageService.chibiImages;
  readonly emoteCarouselImages = this.galleryImageService.emoteImages;
  readonly illustrationCarouselImages = this.galleryImageService.illustrationImages;

  // Option lists for the two RadioGroup pickers below. Built here, not as static template literals, because
  // usageType's labels append a live percent-addon suffix for 3 of the 5 options -- computed so both the
  // translated text and the addon percentage stay reactive to locale/pricing-data changes, same as the
  // template pipes they replace.
  readonly commissionTypeOptions = computed(() => [
    { value: 'chibi', label: this.i18n.t('commission.form.commission_type.chibi') },
    { value: 'emotes', label: this.i18n.t('commission.form.commission_type.emote') },
    { value: 'illustration', label: this.i18n.t('commission.form.commission_type.illustration') },
  ]);

  readonly usageTypeOptions = computed(() => [
    { value: 'personal', label: this.i18n.t('commission.form.usage_type.personal') },
    {
      value: 'promotion',
      label: `${this.i18n.t('commission.form.usage_type.promotion')} (+${this.formatPercentAddon('promotion')})`,
    },
    {
      value: 'distribution',
      label: `${this.i18n.t('commission.form.usage_type.distribution')} (+${this.formatPercentAddon('distribution')})`,
    },
    {
      value: 'products',
      label: `${this.i18n.t('commission.form.usage_type.products')} (+${this.formatPercentAddon('products')})`,
    },
    { value: 'unsure', label: this.i18n.t('commission.form.usage_type.unsure') },
  ]);

  private readonly commissionModel = signal<CommissionFormValue>({
    name: '',
    email: '',
    commissionType: 'chibi',
    description: '',
    referenceLinks: '',
    usageType: 'personal',
    usageExplanation: '',
    deadline: '',
    additionalNotes: '',
    tosAccepted: false,
  });

  commissionForm = form(
    this.commissionModel,
    (schemaPath) => {
      required(schemaPath.name, { message: 'Name is required.' });
      required(schemaPath.email, { message: 'Email is required.' });
      required(schemaPath.description, { message: 'Description is required.' });
      // Previously undeclared, even though the field's label always showed a required asterisk unconditionally
      // -- RadioGroup now derives that asterisk from this signal (matching FormFieldGroup/CheckboxField), so
      // this was added to keep the marker showing. No behavioral change: a radio group always has some value
      // selected (its own default), so this can never actually fail validation in practice, same as usageType's
      // own long-standing required validator below.
      required(schemaPath.commissionType, { message: 'Commission type is required.' });
      required(schemaPath.usageType, { message: 'Usage type is required.' });
      required(schemaPath.tosAccepted, { message: 'You must accept the terms of service to submit the form.' });
      required(schemaPath.usageExplanation, { message: 'Usage explanation is required.' });
      maxLength(schemaPath.email, 100, { message: 'Email cannot exceed 100 characters.' });
      maxLength(schemaPath.name, 50, { message: 'Name cannot exceed 50 characters.' });
      maxLength(schemaPath.description, 2000, { message: 'Description cannot exceed 2000 characters.' });
      maxLength(schemaPath.referenceLinks, 2000, { message: 'Reference links cannot exceed 2000 characters.' });
      maxLength(schemaPath.additionalNotes, 2000, { message: 'Additional notes cannot exceed 2000 characters.' });
      maxLength(schemaPath.usageExplanation, 2000, { message: 'Usage explanation cannot exceed 2000 characters.' });
      email(schemaPath.email, { message: 'Please enter a valid email address.' });
    },
    {
      submission: createFormSubmission({
        pendingMessage: 'Submitting commission...',
        invalidMessage: 'Please correct the errors in the form before submitting.',
        model: this.commissionModel,
        status: this.status,
        buildRequest: (model): CreateCommissionRequest => ({
          name: model.name,
          email: model.email,
          commissionType: model.commissionType,
          description: model.description,
          referenceLinks: model.referenceLinks,
          usageType: model.usageType,
          usageExplanation: model.usageExplanation,
          estimatedPrice: this.pricingService.getTotalPriceUsd(model.commissionType, model.usageType),
          deadline: model.deadline,
          additionalNotes: model.additionalNotes,
        }),
        submit: (request) => this.apiService.submitCommission(request),
        // No post-success side effect today (no reset, no refresh) -- kept exactly as-is.
      }),
    },
  );

  scrollToCommissionTypes(): void {
    this.scrollToElement('commission-types');
  }

  scrollToArtworkUsage(): void {
    this.scrollToElement('artwork-usage');
  }

  scrollToTerms(): void {
    this.scrollToElement('commission-terms');
  }

  scrollToForm(type: 'illustration' | 'chibi' | 'emotes'): void {
    this.scrollToElement('commission-form', false);
    this.commissionForm.commissionType().value.set(type);
  }

  private scrollToElement(elementId: string, shouldFocus = true): void {
    const target = document.getElementById(elementId);

    if (!target) {
      return;
    }

    const top = target.getBoundingClientRect().top + window.scrollY - this.scrollOffset;

    window.scrollTo({
      top,
      behavior: 'smooth',
    });

    if (!shouldFocus) {
      return;
    }

    const focusTarget = target as HTMLElement;
    const hadTabIndex = focusTarget.hasAttribute('tabindex');

    if (!hadTabIndex) {
      focusTarget.setAttribute('tabindex', '-1');
    }

    // Delay focus slightly so the element is visible when the outline appears.
    window.setTimeout(() => {
      focusTarget.focus({ preventScroll: true });
      focusTarget.classList.add(this.scrollFocusClass);

      window.setTimeout(() => {
        focusTarget.classList.remove(this.scrollFocusClass);
      }, this.scrollFocusDurationMs);

      if (!hadTabIndex) {
        const cleanupTabIndex = () => {
          focusTarget.removeAttribute('tabindex');
          focusTarget.removeEventListener('blur', cleanupTabIndex);
        };

        focusTarget.addEventListener('blur', cleanupTabIndex);
      }
    }, this.focusDelay);
  }

  private formatPercentAddon(commercialTypeId: string): string {
    // Uses the real PercentPipe (already injected -- the Artwork Usage terms section still uses it via the
    // template pipe syntax) rather than a hand-rolled reimplementation of its '1.0-0' rounding rule.
    // /code-review flagged the original Math.round version as a duplicate-to-keep-in-sync of this same rule.
    return this.percentPipe.transform(this.pricingService.getPercentAddon(commercialTypeId) ?? 0, '1.0-0') ?? '0%';
  }
}
