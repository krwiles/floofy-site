import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Commission } from './commission';

describe('Commission', () => {
  let component: Commission;
  let fixture: ComponentFixture<Commission>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Commission],
    }).compileComponents();

    fixture = TestBed.createComponent(Commission);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
