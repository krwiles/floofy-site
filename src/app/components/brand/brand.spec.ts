import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Brand } from './brand';

@Component({
  template: `<app-brand class="nav-brand-intro" />`,
  imports: [Brand],
})
class HostComponent {}

function createFixture(): ComponentFixture<HostComponent> {
  TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideRouter([])] });
  return TestBed.createComponent(HostComponent);
}

describe('Brand', () => {
  it('renders a link to /', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('/');
  });

  it('renders the Floofy image with the right src and alt', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('ng-img')).toBe('true');
    expect(img.src).toContain('G_Xl1MobAAAVbNn.jpeg');
    expect(img.alt).toBe('Floofy');
  });

  it('renders the Floofy wordmark text', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('span').textContent).toBe('Floofy');
  });

  it('forwards a class from the caller onto the host element', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-brand').classList.contains('nav-brand-intro')).toBe(true);
  });
});
