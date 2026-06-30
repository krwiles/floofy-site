import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';
import { ReviewsService } from '../services/reviews.service';

@Component({
  selector: 'app-reviews',
  imports: [ParallaxSection, TranslatePipe],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reviews {
  private readonly reviewsService = inject(ReviewsService);
  readonly testing = toSignal(this.reviewsService.getReviews(), { initialValue: '' });
}
