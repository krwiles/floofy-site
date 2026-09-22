// Global test-environment polyfills. Runs once before all spec files (see the
// `setupFiles` option on the `test` architect target in angular.json).
//
// jsdom does not implement `window.matchMedia`. RevealService reads it (via
// prefers-reduced-motion) on every component that uses the `appReveal`
// directive, so without this, any spec rendering such a component throws
// "matchMedia is not a function" -- not specific to one component, so a
// global polyfill belongs here rather than repeated in every affected spec.
// Defaults to "no reduced motion"; tests that need the opposite provide
// their own DOCUMENT/matchMedia stub locally (see reveal.service.spec.ts).
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

// jsdom also does not implement IntersectionObserver, which RevealService
// creates (lazily) the first time anything using the `appReveal` directive
// renders -- again not specific to one component. This is a plain no-op
// stub (it never actually fires intersection callbacks); a spec that needs
// to control intersection behavior provides its own local stub instead
// (see reveal.service.spec.ts), which takes precedence for that file.
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
