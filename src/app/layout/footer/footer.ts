import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Brand } from '../../shared/components/brand/brand';
import { SocialLinks } from '../../shared/components/social-links/social-links';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  imports: [Brand, SocialLinks, TranslatePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  scrollToTop(): void {
    // Smoothly scroll back to the top of the page (the footer's "Back to top" link).
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
