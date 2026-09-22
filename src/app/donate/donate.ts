import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';
import { Reveal } from '../directives/reveal';
import { Flourish } from '../components/flourish/flourish';
import { SectionDivider } from '../components/section-divider/section-divider';

@Component({
  selector: 'app-donate',
  templateUrl: './donate.html',
  styleUrl: './donate.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ParallaxSection, TranslatePipe, Reveal, Flourish, SectionDivider],
})
export class Donate {}
