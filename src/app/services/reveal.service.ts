import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/**
 * Shared scroll-reveal registry. One IntersectionObserver for the whole app,
 * created lazily on first use. Elements register themselves (typically via
 * the `appReveal` directive) and get the `animate-in` class -- and are
 * unobserved -- the first time they cross the viewport threshold. Elements
 * that register while `prefers-reduced-motion: reduce` is set are revealed
 * immediately instead of being observed at all.
 */
@Injectable({ providedIn: 'root' })
export class RevealService {
  private readonly document = inject(DOCUMENT);
  private observer: IntersectionObserver | null = null;

  register(element: Element): void {
    if (this.prefersReducedMotion()) {
      element.classList.add('animate-in');
      return;
    }

    this.getObserver().observe(element);
  }

  unregister(element: Element): void {
    this.observer?.unobserve(element);
  }

  private getObserver(): IntersectionObserver {
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
    return this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;
  }
}
