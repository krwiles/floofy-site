import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Footer } from './footer';
import { routes } from '../../app.routes';

describe('Footer', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it("gives the footer-brand heading exactly the text 'Floofy' as its accessible name -- not doubled by the adjacent decorative image", () => {
    const heading = fixture.nativeElement.querySelector('#footer-brand');
    expect(heading.textContent.trim()).toBe('Floofy');
  });
});
