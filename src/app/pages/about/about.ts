import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Hero } from '../../shared/components/hero/hero';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { NgOptimizedImage } from '@angular/common';
import { Reveal } from '../../shared/directives/reveal';
import { Flourish } from '../../shared/components/flourish/flourish';
import { SectionDivider } from '../../shared/components/section-divider/section-divider';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { Section } from '../../shared/components/section/section';
import { Card } from '../../shared/directives/card';
import { Button } from '../../shared/directives/button';
import { SocialLinks } from '../../shared/components/social-links/social-links';

// The global set by Twitter's widgets script (loaded in index.html), declared so TypeScript knows its shape.
// Declare the Twitter widgets object to avoid TypeScript errors
declare const twttr: { widgets: { load: () => void } };

@Component({
  selector: 'app-about',
  imports: [
    Hero,
    TranslatePipe,
    NgOptimizedImage,
    Reveal,
    Flourish,
    SectionDivider,
    SectionHeader,
    Section,
    Card,
    Button,
    SocialLinks,
  ],
  templateUrl: './about.html',
  styleUrl: './about.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About implements AfterViewInit {
  ngAfterViewInit(): void {
    // Ask Twitter's script to render embeds now this view exists; the script only scans once on first page load.
    if (typeof twttr !== 'undefined') {
      twttr.widgets.load();
    }
  }
}
