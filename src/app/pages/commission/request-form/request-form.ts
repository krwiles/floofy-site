import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { email, form, FormField, FormRoot, maxLength, required } from '@angular/forms/signals';
import { requiredText } from '../../../shared/forms/required-text';
import { ArtworkCategory } from '../../../models/artwork-category';
import { CreateCommissionRequest } from '../../../models/commission.model';
import { FormSubmissionStatus } from '../../../models/form-submission-status';
import { UsageTypeId } from '../../../models/pricing.model';
import { ApiService } from '../../../services/api.service';
import { I18nService } from '../../../services/i18n.service';
import { PricingService } from '../../../services/pricing.service';
import { JumpButton } from '../../../shared/components/jump-button/jump-button';
import { Section } from '../../../shared/components/section/section';
import { SectionHeader } from '../../../shared/components/section-header/section-header';
import { Button } from '../../../shared/directives/button';
import { Card } from '../../../shared/directives/card';
import { Control } from '../../../shared/directives/control';
import { Reveal } from '../../../shared/directives/reveal';
import { CheckboxField } from '../../../shared/forms/checkbox-field/checkbox-field';
import { createFormSubmission } from '../../../shared/forms/form-submission';
import { FormFieldGroup } from '../../../shared/forms/form-field-group/form-field-group';
import { FormStatus } from '../../../shared/forms/form-status/form-status';
import { RadioGroup } from '../../../shared/forms/radio-group/radio-group';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { COMMISSION_ANCHORS, PRICING_CARD_ORDER } from '../commission-content';

/** Which detail a "?" button asks the page to jump to; the page maps it to the right section. */
export type RequestFormDetail = 'categories' | 'usage' | 'terms';

interface CommissionFormValue {
  name: string;
  email: string;
  commissionType: ArtworkCategory;
  description: string;
  referenceLinks: string;
  usageType: UsageTypeId | 'unsure';
  usageExplanation: string;
  deadline: string;
  additionalNotes: string;
  tosAccepted: boolean;
}

// Usage types in radio order; the form's extra 'unsure' has no price.
const USAGE_TYPE_OPTIONS: readonly (UsageTypeId | 'unsure')[] = [
  'personal',
  'promotion',
  'distribution',
  'products',
  'unsure',
];

/**
 * The commission request form: owns its form model, validation and submission (built on Phase 5's shared form
 * pieces -- see docs/refactor/16-phase-5-commission-plan.md). The page tells it which category was picked via
 * `selectCategory()`, and it asks the page to jump to more detail via `detailRequested`.
 */
@Component({
  selector: 'app-request-form',
  imports: [
    CurrencyPipe,
    FormField,
    FormRoot,
    JumpButton,
    Section,
    SectionHeader,
    Button,
    Card,
    Control,
    Reveal,
    CheckboxField,
    FormFieldGroup,
    FormStatus,
    RadioGroup,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './request-form.html',
})
export class RequestForm {
  private readonly apiService = inject(ApiService);
  private readonly injector = inject(Injector);
  // The commission-type radio group's element, so a pricing pick can move focus to the chosen radio.
  private readonly commissionTypeGroup = viewChild.required('commissionTypeGroup', { read: ElementRef });
  private readonly i18n = inject(I18nService);
  protected readonly pricing = inject(PricingService);

  /** Fires when a "?" button asks for more detail elsewhere on the page. */
  readonly detailRequested = output<RequestFormDetail>();
  readonly status = signal<FormSubmissionStatus>({ kind: 'idle', key: '' });

  // Element ids from commission-content.ts, exposed to the template.
  protected readonly anchors = COMMISSION_ANCHORS;

  // Radio options in pricing-card order, rebuilt when the locale changes so labels stay translated.
  protected readonly artworkCategoryOptions = computed(() =>
    PRICING_CARD_ORDER.map((value) => ({
      value,
      label: this.i18n.t(`commission.form.commission_type.${value}`),
    })),
  );

  // Priced usage types also show their add-on, e.g. "Promotion (+50%)".
  protected readonly usageTypeOptions = computed(() =>
    USAGE_TYPE_OPTIONS.map((value) => {
      const label = this.i18n.t(`commission.form.usage_type.${value}`);
      const addon = value === 'unsure' ? 0 : (this.pricing.getPercentAddon(value) ?? 0);
      return {
        value,
        label: addon > 0 ? `${label} (+${this.pricing.formatPercentAddon(value as UsageTypeId)})` : label,
      };
    }),
  );

  // The form's current values; defaults match the first pricing card and the cheapest usage.
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

  // The form: its validation rules, then what happens on submit.
  readonly commissionForm = form(
    this.commissionModel,
    (schemaPath) => {
      // Required fields (blank text counts as empty), length caps matching the Lambda, and a valid email.
      requiredText(schemaPath.name, { message: 'Name is required.' });
      requiredText(schemaPath.email, { message: 'Email is required.' });
      requiredText(schemaPath.description, { message: 'Description is required.' });
      // Radio groups always hold a value, so these two only drive the required-marker asterisk.
      required(schemaPath.commissionType, { message: 'Commission type is required.' });
      required(schemaPath.usageType, { message: 'Usage type is required.' });
      required(schemaPath.tosAccepted, { message: 'You must accept the terms of service to submit the form.' });
      requiredText(schemaPath.usageExplanation, { message: 'Usage explanation is required.' });
      maxLength(schemaPath.email, 100, { message: 'Email cannot exceed 100 characters.' });
      maxLength(schemaPath.name, 50, { message: 'Name cannot exceed 50 characters.' });
      maxLength(schemaPath.description, 2000, { message: 'Description cannot exceed 2000 characters.' });
      maxLength(schemaPath.referenceLinks, 2000, { message: 'Reference links cannot exceed 2000 characters.' });
      maxLength(schemaPath.additionalNotes, 2000, { message: 'Additional notes cannot exceed 2000 characters.' });
      maxLength(schemaPath.usageExplanation, 2000, { message: 'Usage explanation cannot exceed 2000 characters.' });
      email(schemaPath.email, { message: 'Please enter a valid email address.' });
    },
    {
      // Show progress, then send the request with the price computed from the current picks.
      submission: createFormSubmission({
        i18nPrefix: 'forms.commission',
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
          estimatedPrice: this.pricing.getTotalPriceUsd(model.commissionType, model.usageType),
          deadline: model.deadline,
          additionalNotes: model.additionalNotes,
        }),
        submit: (request) => this.apiService.submitCommission(request),
      }),
    },
  );

  // The live estimate shown under the usage type, from the current category and usage picks.
  protected readonly estimatedPriceUsd = computed(() =>
    this.pricing.getTotalPriceUsd(
      this.commissionForm.commissionType().value(),
      this.commissionForm.usageType().value(),
    ),
  );

  /** Applies a pricing card's pick. A method, not an input, so picking the same card twice still re-applies it. */
  selectCategory(category: ArtworkCategory): void {
    // Set the form's category to the picked one.
    this.commissionForm.commissionType().value.set(category);
  }

  /**
   * Focuses the checked commission-type radio once the pick has rendered, without jumping the page, so a smooth
   * scroll to the form isn't interrupted. Keyboard and screen-reader users then land where the page went.
   */
  focusCommissionType(): void {
    // Wait for the render that checks the newly picked radio, then focus it.
    afterNextRender(
      () => {
        const host: HTMLElement = this.commissionTypeGroup().nativeElement;
        host.querySelector<HTMLInputElement>('input:checked')?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }
}
