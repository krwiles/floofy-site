import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';
import { Reveal } from '../directives/reveal';

@Component({
  selector: 'app-donate',
  templateUrl: './donate.html',
  styleUrl: './donate.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ParallaxSection, TranslatePipe, Reveal],
})
export class Donate {}
