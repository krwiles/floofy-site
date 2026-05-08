import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-contact',
  imports: [ParallaxSection, TranslatePipe],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {}
