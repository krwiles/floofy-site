import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-commission',
  imports: [ParallaxSection, TranslatePipe],
  templateUrl: './commission.html',
  styleUrl: './commission.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Commission {}
