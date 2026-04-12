import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-oc',
  imports: [],
  templateUrl: './oc.html',
  styleUrl: './oc.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OC {
  readonly i18n = inject(I18nService);
}
