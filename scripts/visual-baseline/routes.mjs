// Shared settings for capture.mjs and diff.mjs: which routes, at which widths, against which server.
export const ROUTES = ['', 'about', 'streaming', 'gallery', 'reviews', 'donate', 'contact', 'commission'];

export const WIDTHS = [375, 768, 1280];

export const BASE_URL = process.env.BASELINE_URL ?? 'http://localhost:4200';

export function slugFor(route) {
  // Home's route is the empty string, so it gets a readable name; nested routes become dashed names.
  return route === '' ? 'home' : route.replace(/\//g, '-');
}
