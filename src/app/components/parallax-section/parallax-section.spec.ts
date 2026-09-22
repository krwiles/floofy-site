import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParallaxSection } from './parallax-section';

describe('ParallaxSection', () => {
  let component: ParallaxSection;
  let fixture: ComponentFixture<ParallaxSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParallaxSection],
    }).compileComponents();

    fixture = TestBed.createComponent(ParallaxSection);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('backgroundImage', 'assets/test-fixture.jpg');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
