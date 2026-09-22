import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeAll, vi } from 'vitest';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeAll(() => {
    // jsdom (the test environment) doesn't implement IntersectionObserver, which
    // App.ngAfterViewInit schedules via setTimeout(0). That timeout can still be
    // pending when a test's assertions finish, so the stub is installed for this
    // whole file's run (not unstubbed per-test) rather than raced against a
    // deferred callback. This is an environment shim only; App's real behavior
    // is unchanged.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

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
});
