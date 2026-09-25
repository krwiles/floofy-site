import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/**
 * Shared scroll broadcaster for `ParallaxSection`. One passive window scroll
 * listener for the whole app, attached lazily on first registration and torn
 * down once the last callback unregisters -- previously every
 * `ParallaxSection` instance added its own (a page with a hero and a couple
 * of patterned `app-section`s ran several at once). Callbacks are plain
 * functions rather than elements (contrast `RevealService`, which owns the
 * intersection logic itself): the actual parallax math stays in
 * `ParallaxSection`, this only fans out the "a scroll happened" notification.
 */
@Injectable({ providedIn: 'root' })
export class ParallaxScrollService {
  private readonly document = inject(DOCUMENT);
  private readonly callbacks = new Set<() => void>();
  private readonly handleScroll = () => this.notify();
  private listening = false;

  register(callback: () => void): void {
    this.callbacks.add(callback);
    this.ensureListening();
  }

  unregister(callback: () => void): void {
    this.callbacks.delete(callback);
    if (this.callbacks.size === 0) {
      this.stopListening();
    }
  }

  private ensureListening(): void {
    if (this.listening) return;
    const view = this.document.defaultView;
    if (!view) return;
    view.addEventListener('scroll', this.handleScroll, { passive: true });
    this.listening = true;
  }

  private stopListening(): void {
    if (!this.listening) return;
    this.document.defaultView?.removeEventListener('scroll', this.handleScroll);
    this.listening = false;
  }

  // Isolated per callback -- previously each ParallaxSection had its own
  // listener, so native addEventListener dispatched them independently, and
  // one throwing didn't affect another. Sharing one loop must keep that same
  // isolation rather than letting one bad callback stop every later one in
  // the same scroll tick.
  private notify(): void {
    for (const callback of this.callbacks) {
      try {
        callback();
      } catch (error) {
        console.error('ParallaxScrollService: a registered callback threw', error);
      }
    }
  }
}
