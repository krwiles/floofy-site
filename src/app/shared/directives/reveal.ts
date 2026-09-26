import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { RevealService } from '../../services/reveal.service';

/**
 * Registers its host element with RevealService for the scroll-reveal
 * animation and supplies the 'animate-in' class trigger itself, so callers
 * no longer add that class by hand.
 */
@Directive({
  selector: '[appReveal]',
  host: { class: 'animate-on-scroll' },
})
export class Reveal implements OnInit, OnDestroy {
  private readonly revealService = inject(RevealService);
  private readonly elementRef = inject(ElementRef);

  ngOnInit(): void {
    this.revealService.register(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.revealService.unregister(this.elementRef.nativeElement);
  }
}
