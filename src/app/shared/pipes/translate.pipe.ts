import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateParams } from '../../models/translate-params';
import { I18nService } from '../../services/i18n.service';

@Pipe({
  name: 'translate',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string, params?: TranslateParams): string {
    // Look the key up in the current locale, filling any placeholders; `pure: false` re-runs this on a locale change.
    return this.i18n.t(key, params);
  }
}
