import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialId } from '../../../models/social';
import { SocialLinks } from './social-links';

@Component({
  template: `
    <app-social-links [ids]="ids" [variant]="variant" />
  `,
  imports: [SocialLinks],
})
class HostComponent {
  ids: SocialId[] = ['x', 'bsky', 'email'];
  variant: 'plain' | 'chip' = 'plain';
}

function createFixture(): ComponentFixture<HostComponent> {
  TestBed.configureTestingModule({ imports: [HostComponent] });
  return TestBed.createComponent(HostComponent);
}

describe('SocialLinks', () => {
  it('renders one link per id, in the given order', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    const links: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('a'));
    expect(links.map((a) => a.getAttribute('aria-label'))).toEqual([
      'SummerFloofy on X',
      'SummerFloofy on Bluesky',
      'SummerFloofy on Email',
    ]);
  });

  it("sets each link's href and icon class from the matching SOCIALS entry", () => {
    const fixture = createFixture();
    fixture.componentInstance.ids = ['bsky'];
    fixture.detectChanges();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('https://bsky.app/profile/summerfloofy.bsky.social');
    expect(link.querySelector('span')?.classList.contains('social-icon--bsky')).toBe(true);
  });

  it('omits target and rel for the mailto entry', () => {
    const fixture = createFixture();
    fixture.componentInstance.ids = ['email'];
    fixture.detectChanges();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('target')).toBeNull();
    expect(link.getAttribute('rel')).toBeNull();
  });

  it('includes target=_blank and rel=noopener noreferrer for http(s) entries', () => {
    const fixture = createFixture();
    fixture.componentInstance.ids = ['x'];
    fixture.detectChanges();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('applies the plain classes by default', () => {
    const fixture = createFixture();
    fixture.componentInstance.ids = ['x'];
    fixture.detectChanges();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.classList.contains('text-xl')).toBe(true);
    expect(link.classList.contains('rounded-2xl')).toBe(false);
  });

  it('applies the chip classes when variant is chip', () => {
    const fixture = createFixture();
    fixture.componentInstance.ids = ['x'];
    fixture.componentInstance.variant = 'chip';
    fixture.detectChanges();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.classList.contains('rounded-2xl')).toBe(true);
    expect(link.classList.contains('text-5xl')).toBe(true);
  });
});
