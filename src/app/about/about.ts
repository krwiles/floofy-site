import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';
import { NgOptimizedImage } from '@angular/common';

// Declare the Twitter widgets object to avoid TypeScript errors
declare const twttr: { widgets: { load: () => void } };

@Component({
  selector: 'app-about',
  imports: [ParallaxSection, TranslatePipe, NgOptimizedImage],
  templateUrl: './about.html',
  styleUrl: './about.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About implements AfterViewInit {
  ngAfterViewInit(): void {
    // Load Twitter widgets after the view has initialized
    // This is needed to ensure that any embedded tweets are properly rendered after routing
    if (typeof twttr !== 'undefined') {
      twttr.widgets.load();
    }
  }
}
