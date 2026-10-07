/**
 * Global polyfills for jsdom, run once before every spec file (angular.json's `setupFiles`). RevealService needs both
 * matchMedia and IntersectionObserver for any component using `appReveal`, and jsdom implements neither.
 */

// matchMedia that always answers "no match", i.e. motion allowed; reveal.service.spec.ts stubs its own when needed.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// An IntersectionObserver that never fires; specs that need to control it stub their own (see reveal.service.spec.ts).
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class NoopIntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: ReadonlyArray<number> = [];
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  globalThis.IntersectionObserver = NoopIntersectionObserver as unknown as typeof IntersectionObserver;
}
