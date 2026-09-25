import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/**
 * Shared scroll broadcaster for `ParallaxSection`. One passive window scroll
 * listener for the whole app, attached lazily on first registration --
 * previously every `ParallaxSection` instance added its own (a page with a
 * hero and a couple of patterned `app-section`s ran several at once).
 * Callbacks are plain functions rather than elements (contrast
 * `RevealService`, which owns the intersection logic itself): the actual
 * parallax math stays in `ParallaxSection`, this only fans out the "a scroll
 * happened" notification.
 */
@Injectable({ providedIn: 'root' })
export class ParallaxScrollService {
  private readonly document = inject(DOCUMENT);
  private readonly callbacks = new Set<() => void>();
  private started = false;

  register(callback: () => void): void {
    this.callbacks.add(callback);
    this.ensureListening();
  }

  unregister(callback: () => void): void {
    this.callbacks.delete(callback);
  }

  private ensureListening(): void {
    if (this.started) return;
    this.started = true;
    this.document.defaultView?.addEventListener('scroll', () => this.notify(), { passive: true });
  }

  private notify(): void {
    for (const callback of this.callbacks) {
      callback();
    }
  }
}
