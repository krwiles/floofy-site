import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The logo + "Floofy" wordmark linking home, shared by the navbar and footer. Callers add their own wrapper (the
 * footer's <h2>, the navbar's entrance animation) -- see CONTEXT.md's "Brand" entry.
 */
@Component({
  selector: 'app-brand',
  imports: [RouterLink, NgOptimizedImage],
  template: `
    <a routerLink="/" class="flex items-center space-x-3 rtl:space-x-reverse">
      <!-- Empty alt: the "Floofy" text already names the link, and a second name would also corrupt the footer
           heading's accessible name. -->
      <img
        class="block h-14 w-14 rounded-4xl border-2 border-bg-muted"
        ngSrc="assets/artwork/floofy-02.jpeg"
        alt=""
        width="621"
        height="621"
      />
      <span class="text-2xl font-semibold text-on-light-heading">Floofy</span>
    </a>
  `,
  // `display: block`, not `contents`: navbar's entrance animation needs a real box to animate.
  styles: ':host { display: block; }',
})
export class Brand {}
