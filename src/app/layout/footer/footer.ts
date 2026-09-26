import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Brand } from '../../components/brand/brand';
import { SocialLinks } from '../../components/social-links/social-links';
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
