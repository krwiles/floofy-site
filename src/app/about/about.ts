import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';

// Declare the Twitter widgets object to avoid TypeScript errors
declare const twttr: { widgets: { load: () => void } };

@Component({
  selector: 'app-about',
  imports: [],
  templateUrl: './about.html',
  styleUrl: './about.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About implements AfterViewInit {
  readonly i18n = inject(I18nService);

  ngAfterViewInit(): void {
    // Load Twitter widgets after the view has initialized
    // This is needed to ensure that any embedded tweets are properly rendered after routing
    if (typeof twttr !== 'undefined') {
      twttr.widgets.load();
    }
  }
}
