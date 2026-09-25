import { AfterViewInit, ChangeDetectionStrategy, Component, input, ViewChild, ElementRef, inject } from '@angular/core';
import { ParallaxScrollService } from '../../services/parallax-scroll.service';

@Component({
  selector: 'app-parallax-section',
  templateUrl: './parallax-section.html',
  styleUrl: './parallax-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  private readonly scrollService = inject(ParallaxScrollService);
  private readonly scrollHandler = () => this.onWindowScroll();

  ngAfterViewInit(): void {
    if (this.root) {
      this.backgroundEl = this.root.nativeElement.querySelector('.parallax-background');
    }
    this.scrollService.register(this.scrollHandler);
    this.onWindowScroll();
  }

  ngOnDestroy(): void {
    this.scrollService.unregister(this.scrollHandler);
  }

  onWindowScroll(): void {
    if (!this.root || !this.backgroundEl) return;
    const rect = this.root.nativeElement.getBoundingClientRect();
    const y = -rect.top * this.parallaxStrength();
    this.backgroundEl.style.transform = `translate3d(0,${y}px,0)`;
  }
}
