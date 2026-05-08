import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-reviews',
  imports: [ParallaxSection, TranslatePipe],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reviews {}
