import { Routes } from '@angular/router';

// One route per page; each page's code is loaded only when first visited (then preloaded -- see app.config.ts).
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about').then((m) => m.About),
  },
  {
    path: 'streaming',
    loadComponent: () => import('./pages/streaming/streaming').then((m) => m.Streaming),
  },
  {
    path: 'gallery',
    loadComponent: () => import('./pages/gallery/gallery').then((m) => m.Gallery),
  },
  {
    path: 'reviews',
    loadComponent: () => import('./pages/reviews/reviews').then((m) => m.Reviews),
  },
  {
    path: 'donate',
    loadComponent: () => import('./pages/donate/donate').then((m) => m.Donate),
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'commission',
    loadComponent: () => import('./pages/commission/commission').then((m) => m.Commission),
  },
];
