import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

/**
 * Loads third-party scripts (Twitch's embed now, Twitter's widgets later) on demand, once per URL, instead of from
 * `index.html` -- see docs/refactor/17-phase-6-plan.md's Stage 4.
 */
@Injectable({ providedIn: 'root' })
export class ScriptLoader {
  private readonly document = inject(DOCUMENT);
  // One promise per URL, so every caller waits on the same single load.
  private readonly loads = new Map<string, Promise<void>>();

  /** Resolves once the script at `src` has loaded; rejects if it fails, and a later call then tries again. */
  load(src: string): Promise<void> {
    // Already loading or loaded: share that result.
    const existing = this.loads.get(src);
    if (existing) return existing;

    // Add the script tag, settling the promise when the browser reports success or failure.
    const loading = new Promise<void>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        // Forget the failure, so the next visit to the page can retry.
        this.loads.delete(src);
        reject(new Error(`ScriptLoader: failed to load ${src}`));
      };
      this.document.body.appendChild(script);
    });

    // Remember it for later callers.
    this.loads.set(src, loading);
    return loading;
  }
}
