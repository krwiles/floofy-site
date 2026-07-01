import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';
import { ReviewsService } from '../services/reviews.service';
import { DatePipe } from '@angular/common';
import { Review } from '../models/review';
import { App } from '../app';

@Component({
  selector: 'app-reviews',
  imports: [ParallaxSection, TranslatePipe, DatePipe],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reviews implements OnInit {
  private readonly reviewsService = inject(ReviewsService);
  private readonly app = inject(App, { optional: true });
  readonly reviews = signal<Review[]>([]);

  ngOnInit(): void {
    this.reviewsService.getReviews().subscribe((reviews) => {
      this.reviews.set(reviews);
      setTimeout(() => this.app?.observerInit(), 0);
    });
  }
}
