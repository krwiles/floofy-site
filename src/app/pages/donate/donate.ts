import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Hero } from '../../shared/components/hero/hero';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { Flourish } from '../../shared/components/flourish/flourish';
import { SectionDivider } from '../../shared/components/section-divider/section-divider';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { Section } from '../../shared/components/section/section';
import { Card } from '../../shared/directives/card';
import { SocialLinks } from '../../shared/components/social-links/social-links';

@Component({
  selector: 'app-donate',
  templateUrl: './donate.html',
  styleUrl: './donate.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Hero, TranslatePipe, Flourish, SectionDivider, SectionHeader, Section, Card, SocialLinks],
})
export class Donate {}
