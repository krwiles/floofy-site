import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { ParallaxSection } from '../components/parallax-section/parallax-section';

@Component({
  selector: 'app-commission',
  imports: [ParallaxSection],
  templateUrl: './commission.html',
  styleUrl: './commission.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Commission {
  readonly i18n = inject(I18nService);
}
