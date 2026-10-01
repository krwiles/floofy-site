import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/**
 * Shared scroll-reveal registry: one IntersectionObserver for the whole app, created on first use. Registered
 * elements (usually via the `appReveal` directive) get the `animate-in` class the first time they scroll into view,
 * or straight away when the visitor prefers reduced motion.
 */
@Injectable({ providedIn: 'root' })
export class RevealService {
  private readonly document = inject(DOCUMENT);
  private observer: IntersectionObserver | null = null;

  register(element: Element): void {
    // Reduced motion: show the element immediately instead of animating it in later.
    if (this.prefersReducedMotion()) {
      element.classList.add('animate-in');
      return;
    }

    // Otherwise wait for it to scroll into view.
    this.getObserver().observe(element);
  }

  unregister(element: Element): void {
    // Stop watching an element that's leaving the page before it was revealed.
    this.observer?.unobserve(element);
  }

  private getObserver(): IntersectionObserver {
    // Create the shared observer on first use: reveal each element once 20% of it is visible, then stop watching it.
    if (!this.observer) {
      this.observer = new IntersectionObserver(
        (entries, observer) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-in');
              observer.unobserve(entry.target);
            }
          }
        },
        { root: null, rootMargin: '0px', threshold: 0.2 },
      );
    }

    return this.observer;
  }

  private prefersReducedMotion(): boolean {
    // The OS-level "reduce motion" setting; false when there's no window to ask.
    return this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;
  }
}
