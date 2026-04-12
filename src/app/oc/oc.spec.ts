import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OC } from './oc';

describe('OC', () => {
  let component: OC;
  let fixture: ComponentFixture<OC>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OC],
    }).compileComponents();

    fixture = TestBed.createComponent(OC);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
