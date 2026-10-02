import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Streaming } from './streaming';

describe('Streaming', () => {
  let component: Streaming;
  let fixture: ComponentFixture<Streaming>;

  beforeEach(async () => {
    // Render the real page once per test.
    await TestBed.configureTestingModule({
      imports: [Streaming],
    }).compileComponents();

    fixture = TestBed.createComponent(Streaming);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    // Assert: the page builds.
    expect(component).toBeTruthy();
  });

  it('should include the streaming schedule and Twitch call to action', () => {
    // Act: read the rendered text.
    const content = fixture.nativeElement.textContent;

    // Assert: the schedule, the Twitch button and the channel name all show.
    expect(content).toContain('11:00 AM EST');
    expect(content).toContain('Watch on Twitch');
    expect(content).toContain('SummerFloofy');
  });
});
