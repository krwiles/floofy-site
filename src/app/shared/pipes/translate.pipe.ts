import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';

@Pipe({
  name: 'translate',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string): string {
    // Look the key up in the current locale; `pure: false` re-runs this when the locale changes.
    return this.i18n.t(key);
  }
}
