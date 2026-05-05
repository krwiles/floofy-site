import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { ParallaxSection } from '../components/parallax-section/parallax-section';

@Component({
  selector: 'app-donate',
  templateUrl: './donate.html',
  styleUrl: './donate.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ParallaxSection],
})
export class Donate {
  i18n = inject(I18nService);
}
