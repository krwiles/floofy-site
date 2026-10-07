import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Footer } from './footer';
import { routes } from '../../app.routes';

describe('Footer', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;

  beforeEach(async () => {
    // Render the footer with the real routes (it contains router links).
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    // Assert: the component builds.
    expect(component).toBeTruthy();
  });

  it("gives the footer-brand heading exactly the text 'Floofy' as its accessible name -- not doubled by the adjacent decorative image", () => {
    // Act and assert: the heading's text is just the name, so screen readers don't hear it twice.
    const heading = fixture.nativeElement.querySelector('#footer-brand');
    expect(heading.textContent.trim()).toBe('Floofy');
  });
});
