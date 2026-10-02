import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reviews } from './reviews';

describe('Reviews', () => {
  let component: Reviews;
  let fixture: ComponentFixture<Reviews>;

  beforeEach(async () => {
    // Render the real page once per test.
    await TestBed.configureTestingModule({
      imports: [Reviews],
    }).compileComponents();

    fixture = TestBed.createComponent(Reviews);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    // Assert: the page builds.
    expect(component).toBeTruthy();
  });
});
