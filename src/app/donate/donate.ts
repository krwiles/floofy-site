import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Hero } from '../components/hero/hero';
import { TranslatePipe } from '../shared/pipes/translate.pipe';
import { Flourish } from '../components/flourish/flourish';
import { SectionDivider } from '../components/section-divider/section-divider';
import { SectionHeader } from '../components/section-header/section-header';
import { Section } from '../components/section/section';
import { Card } from '../directives/card';
import { SocialLinks } from '../components/social-links/social-links';

@Component({
  selector: 'app-donate',
  templateUrl: './donate.html',
  styleUrl: './donate.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Hero, TranslatePipe, Flourish, SectionDivider, SectionHeader, Section, Card, SocialLinks],
})
export class Donate {}
