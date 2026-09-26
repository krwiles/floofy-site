import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The logo image + "Floofy" wordmark linking home, shared by the navbar and
 * the footer. Owns only the core link/image/text -- each caller supplies its
 * own surrounding structure (footer's semantic <h2>, navbar's entrance-
 * animation class) since those belong to where Brand appears, not to Brand
 * itself. See CONTEXT.md ("Brand").
 */
@Component({
  selector: 'app-brand',
  imports: [RouterLink, NgOptimizedImage],
  template: `
    <a routerLink="/" class="flex items-center space-x-3 rtl:space-x-reverse">
      <!-- alt="" -- the adjacent "Floofy" text already names the link; a
           non-empty alt here would double-announce ("Floofy Floofy") to a
           screen reader, and inside footer's <h2 id="footer-brand">
           wrapper it would also corrupt that heading's accessible name
           (the aria-labelledby target for footer's landmark section). -->
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
  // display: contents was tried first (this host has no styling of its own to
  // apply) but breaks navbar's nav-brand-intro entrance animation -- an
  // element with no generated box can't be animated (opacity/animation have
  // nothing to apply to). block keeps that working.
  styles: ':host { display: block; }',
})
export class Brand {}
