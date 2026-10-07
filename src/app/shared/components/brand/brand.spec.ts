import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Brand } from './brand';

// Host that passes a class onto <app-brand>, like the navbar does.
@Component({
  template: `
    <app-brand class="nav-brand-intro" />
  `,
  imports: [Brand],
})
class HostComponent {}

function createFixture(): ComponentFixture<HostComponent> {
  // Build the host with an empty router (Brand contains a routerLink).
  TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideRouter([])] });
  return TestBed.createComponent(HostComponent);
}

describe('Brand', () => {
  it('renders a link to /', () => {
    // Act: render.
    const fixture = createFixture();
    fixture.detectChanges();

    // Assert: it links home.
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('/');
  });

  it('renders the Floofy image with the right src, decorative (alt="")', () => {
    // Act: render.
    const fixture = createFixture();
    fixture.detectChanges();

    // Assert: the optimized logo image is used...
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('ng-img')).toBe('true');
    expect(img.src).toContain('floofy-02.jpeg');
    // ...with an empty alt, since the "Floofy" text already names the link (see brand.ts).
    expect(img.alt).toBe('');
  });

  it('renders the Floofy wordmark text', () => {
    // Act: render.
    const fixture = createFixture();
    fixture.detectChanges();

    // Assert: the wordmark text.
    expect(fixture.nativeElement.querySelector('span').textContent).toBe('Floofy');
  });

  it('forwards a class from the caller onto the host element', () => {
    // Act: render.
    const fixture = createFixture();
    fixture.detectChanges();

    // Assert: the caller's class lands on the host.
    expect(fixture.nativeElement.querySelector('app-brand').classList.contains('nav-brand-intro')).toBe(true);
  });
});
