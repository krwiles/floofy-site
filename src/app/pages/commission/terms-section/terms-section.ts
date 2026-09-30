import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../../services/i18n.service';
import { PricingService } from '../../../services/pricing.service';
import { ListGroup } from '../../../models/list-group';
import { UsageTypeId } from '../../../models/pricing.model';
import { Section } from '../../../shared/components/section/section';
import { SectionHeader } from '../../../shared/components/section-header/section-header';
import { LabelledList } from '../../../shared/components/labelled-list/labelled-list';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TermsCard } from '../terms-card/terms-card';
import { COMMISSION_ANCHORS, TERMS_CARDS, TERMS_COLUMNS, TermsCardId } from '../commission-content';

/** The commission terms: seven `TermsCard`s in the hand-balanced columns from `commission-content.ts`. */
@Component({
  selector: 'app-terms-section',
  imports: [Section, SectionHeader, LabelledList, TranslatePipe, TermsCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-section tone="middle">
      <div class="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div [id]="anchors.terms" class="rounded-4xl">
          <app-section-header
            [eyebrow]="'commission.terms.kicker' | translate"
            [title]="'commission.terms.title' | translate"
            [description]="'commission.terms.description' | translate"
            tone="middle"
          />

          <div class="grid gap-6 lg:grid-cols-3">
            @for (column of columns; track $index) {
              <div class="space-y-6">
                @for (id of column; track id) {
                  <app-terms-card
                    [title]="'commission.terms.' + id + '.title' | translate"
                    tone="middle"
                    [anchorId]="cards[id].anchorId"
                  >
                    @switch (cards[id].body) {
                      @case ('paragraph') {
                        <p>{{ 'commission.terms.' + id + '.body' | translate }}</p>
                      }
                      @case ('groups') {
                        <app-labelled-list tone="middle" [groups]="groupsFor(id)" />
                      }
                      @default {
                        <app-labelled-list
                          tone="middle"
                          [items]="i18n.list('commission.terms.' + id + '.items')"
                          [numbered]="cards[id].body === 'numbered'"
                        />
                      }
                    }
                  </app-terms-card>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </app-section>
  `,
})
export class TermsSection {
  protected readonly i18n = inject(I18nService);
  private readonly pricing = inject(PricingService);

  protected readonly anchors = COMMISSION_ANCHORS;
  protected readonly columns = TERMS_COLUMNS;
  protected readonly cards = TERMS_CARDS;

  /** A grouped card's groups; Artwork Usage's labels also get their "(+50%)"-style add-on. */
  protected groupsFor(id: TermsCardId): ListGroup[] {
    const groups = this.i18n.groups(`commission.terms.${id}.groups`);

    // Only Artwork Usage is priced; ToS groups pass through untouched.
    if (id !== 'artwork_usage') {
      return groups;
    }

    // Group ids are the usage-type ids (pinned by i18n.service.spec.ts); unpriced ones (Personal) keep their label.
    return groups.map((group) => {
      const usageType = group.id as UsageTypeId;
      const addon = this.pricing.getPercentAddon(usageType) ?? 0;
      return addon > 0 ? { ...group, label: `${group.label} (+${this.pricing.formatPercentAddon(usageType)})` } : group;
    });
  }
}
