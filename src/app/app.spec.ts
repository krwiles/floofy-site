import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the navbar and footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-navbar')).toBeTruthy();
    expect(compiled.querySelector('app-footer')).toBeTruthy();
  });

  it('no longer owns the scroll-reveal scan (moved to RevealService/appReveal)', () => {
    const fixture = TestBed.createComponent(App);
    expect((fixture.componentInstance as unknown as { observerInit?: unknown }).observerInit).toBeUndefined();
  });

  it('marks the rest of the page inert while the mobile nav menu is open, so a control buried under its dimming overlay cannot be tabbed to or activated', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const restOfPage = compiled.querySelector('router-outlet')!.parentElement!;
    expect(restOfPage.inert).toBe(false);

    const menuButton: HTMLButtonElement = compiled.querySelector('button[aria-controls="navbar-language"]')!;
    menuButton.click();
    fixture.detectChanges();
    expect(restOfPage.inert).toBe(true);

    menuButton.click();
    fixture.detectChanges();
    expect(restOfPage.inert).toBe(false);
  });
});
