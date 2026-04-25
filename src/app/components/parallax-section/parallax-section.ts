import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-parallax-section',
  templateUrl: './parallax-section.html',
  styleUrl: './parallax-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onWindowScroll()',
  },
})
export class ParallaxSection implements AfterViewInit {
  readonly ariaLabel = input<string>('Parallax section');
  readonly backgroundImage = input.required<string>();
  readonly backgroundPosition = input<string>('center 40%');
  readonly parallaxStrength = input<number>(0.5);

  readonly parallaxY = signal(0);
  readonly backgroundTransform = computed(() => `translate3d(0,${this.parallaxY()}px,0)`);

  ngAfterViewInit(): void {
    this.onWindowScroll();
  }

  onWindowScroll(): void {
    this.parallaxY.set(window.scrollY * this.parallaxStrength());
  }
}
