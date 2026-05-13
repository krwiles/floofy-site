import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';

@Component({
  selector: 'app-parallax-section',
  templateUrl: './parallax-section.html',
  styleUrl: './parallax-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // host binding for scroll removed; will add manual passive listener
})
export class ParallaxSection implements AfterViewInit {
  readonly ariaLabel = input<string>('Parallax section');
  readonly backgroundImage = input.required<string>();
  readonly backgroundPosition = input<string>('center');
  readonly parallaxStrength = input<number>(0.5);
  readonly backgroundHeight = input<string>('100%');
  readonly backgroundSize = input<string>('cover');

  @ViewChild('parallaxRoot', { static: true }) root!: ElementRef<HTMLElement>;
  private backgroundEl: HTMLElement | null = null;

  // signals removed for direct DOM update

  private scrollHandler = this.onWindowScroll.bind(this);

  ngAfterViewInit(): void {
    if (this.root) {
      this.backgroundEl = this.root.nativeElement.querySelector('.parallax-background');
    }
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    this.onWindowScroll();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollHandler);
  }

  onWindowScroll(): void {
    if (!this.root || !this.backgroundEl) return;
    const rect = this.root.nativeElement.getBoundingClientRect();
    const y = -rect.top * this.parallaxStrength();
    this.backgroundEl.style.transform = `translate3d(0,${y}px,0)`;
  }
}
