import { ComponentFixture, TestBed } from '@angular/core/testing';

import { About } from './about';

describe('About', () => {
  let component: About;
  let fixture: ComponentFixture<About>;

  beforeEach(async () => {
    // Render the real page once per test.
    await TestBed.configureTestingModule({
      imports: [About],
    }).compileComponents();

    fixture = TestBed.createComponent(About);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    // Assert: the page builds.
    expect(component).toBeTruthy();
  });

  it('names the fan-art link by the hashtag it shows', () => {
    // Act: find the link to the hashtag on X.
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href*="twitter.com/hashtag"]');

    // Assert: no aria-label hiding the visible text; the name is the hashtag plus a hidden note of where it goes.
    expect(link.hasAttribute('aria-label')).toBe(false);
    expect(link.textContent?.replace(/\s+/g, ' ').trim()).toBe('#Floofyllust (fan art on X)');
  });
});
