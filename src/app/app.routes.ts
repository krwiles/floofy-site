import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about').then((m) => m.About),
  },
  {
    path: 'streaming',
    loadComponent: () => import('./streaming/streaming').then((m) => m.Streaming),
  },
  {
    path: 'gallery',
    loadComponent: () => import('./gallery/gallery').then((m) => m.Gallery),
  },
  {
    path: 'reviews',
    loadComponent: () => import('./reviews/reviews').then((m) => m.Reviews),
  },
  {
    path: 'oc',
    loadComponent: () => import('./oc/oc').then((m) => m.OC),
  },
  {
    path: 'contact',
    loadComponent: () => import('./contact/contact').then((m) => m.Contact),
  },
  {
    path: 'commission',
    loadComponent: () => import('./commission/commission').then((m) => m.Commission),
  },
];
