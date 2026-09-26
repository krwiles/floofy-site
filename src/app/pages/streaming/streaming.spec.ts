import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Streaming } from './streaming';

describe('Streaming', () => {
  let component: Streaming;
  let fixture: ComponentFixture<Streaming>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Streaming],
    }).compileComponents();

    fixture = TestBed.createComponent(Streaming);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should include the streaming schedule and Twitch call to action', () => {
    const content = fixture.nativeElement.textContent;

    expect(content).toContain('11:00 AM EST');
    expect(content).toContain('Watch on Twitch');
    expect(content).toContain('SummerFloofy');
  });
});
