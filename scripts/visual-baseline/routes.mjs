// Shared config for the visual-baseline capture/diff scripts.

export const ROUTES = ['', 'about', 'streaming', 'gallery', 'reviews', 'donate', 'contact', 'commission'];

export const WIDTHS = [375, 768, 1280];

export const BASE_URL = process.env.BASELINE_URL ?? 'http://localhost:4200';

export function slugFor(route) {
  return route === '' ? 'home' : route.replace(/\//g, '-');
}
