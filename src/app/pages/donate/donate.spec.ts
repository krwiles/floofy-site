import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Donate } from './donate';

describe('Donate', () => {
  let component: Donate;
  let fixture: ComponentFixture<Donate>;

  beforeEach(async () => {
    // Render the real page once per test.
    await TestBed.configureTestingModule({
      imports: [Donate],
    }).compileComponents();

    fixture = TestBed.createComponent(Donate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    // Assert: the page builds.
    expect(component).toBeTruthy();
  });
});
