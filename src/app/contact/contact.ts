import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { ParallaxSection } from '../components/parallax-section/parallax-section';

@Component({
  selector: 'app-contact',
  imports: [ParallaxSection],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  readonly i18n = inject(I18nService);
}
