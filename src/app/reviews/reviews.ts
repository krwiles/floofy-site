import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { ParallaxSection } from '../components/parallax-section/parallax-section';

@Component({
  selector: 'app-reviews',
  imports: [ParallaxSection],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reviews {
  readonly i18n = inject(I18nService);
}
