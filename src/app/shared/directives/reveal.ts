import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { RevealService } from '../../services/reveal.service';

/**
 * Registers its host element with RevealService for the scroll-reveal animation, and adds the `animate-on-scroll`
 * class the animation needs.
 */
@Directive({
  selector: '[appReveal]',
  host: { class: 'animate-on-scroll' },
})
export class Reveal implements OnInit, OnDestroy {
  private readonly revealService = inject(RevealService);
  private readonly elementRef = inject(ElementRef);

  ngOnInit(): void {
    // Start watching the element for when it scrolls into view.
    this.revealService.register(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    // Stop watching when the element leaves the page.
    this.revealService.unregister(this.elementRef.nativeElement);
  }
}
