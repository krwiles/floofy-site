import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/**
 * Shared scroll broadcaster for `ParallaxSection`: one passive window scroll listener for the whole app, attached on
 * the first registration and removed when the last callback unregisters. It only fans out "a scroll happened"; the
 * parallax math stays in `ParallaxSection`.
 */
@Injectable({ providedIn: 'root' })
export class ParallaxScrollService {
  private readonly document = inject(DOCUMENT);
  private readonly callbacks = new Set<() => void>();
  private readonly handleScroll = () => this.notify();
  private listening = false;

  register(callback: () => void): void {
    // Add the callback, and start listening if it's the first one.
    this.callbacks.add(callback);
    this.ensureListening();
  }

  unregister(callback: () => void): void {
    // Remove the callback, and stop listening once nobody is left.
    this.callbacks.delete(callback);
    if (this.callbacks.size === 0) {
      this.stopListening();
    }
  }

  private ensureListening(): void {
    // Already attached, or no window (e.g. server rendering): nothing to do.
    if (this.listening) return;
    const view = this.document.defaultView;
    if (!view) return;

    // `passive` tells the browser we never block scrolling, so it can scroll smoothly.
    view.addEventListener('scroll', this.handleScroll, { passive: true });
    this.listening = true;
  }

  private stopListening(): void {
    // Detach the one shared listener, if it's attached.
    if (!this.listening) return;
    this.document.defaultView?.removeEventListener('scroll', this.handleScroll);
    this.listening = false;
  }

  private notify(): void {
    // Call each callback in isolation, so one that throws can't stop the rest in the same scroll tick.
    for (const callback of this.callbacks) {
      try {
        callback();
      } catch (error) {
        console.error('ParallaxScrollService: a registered callback threw', error);
      }
    }
  }
}
