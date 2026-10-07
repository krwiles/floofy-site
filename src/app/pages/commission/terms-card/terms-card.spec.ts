import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TermsCard } from './terms-card';

// Host that projects a body into a middle-tone card, with an optional anchor id.
@Component({
  imports: [TermsCard],
  template: `
    <app-terms-card [title]="title" tone="middle" [anchorId]="anchorId">
      <p class="projected">Body content</p>
    </app-terms-card>
  `,
})
class TermsCardTestHost {
  title = 'Revisions';
  anchorId: string | undefined = undefined;
}

describe('TermsCard', () => {
  let fixture: ComponentFixture<TermsCardTestHost>;

  // Build the host with per-test values set before the first render (zoneless: later mutations aren't seen).
  function create(overrides: Partial<TermsCardTestHost> = {}): HTMLElement {
    fixture = TestBed.createComponent(TermsCardTestHost);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(async () => {
    // Compile the host once per test.
    await TestBed.configureTestingModule({ imports: [TermsCardTestHost] }).compileComponents();
  });

  it('renders the title as the card heading', () => {
    // Act: render.
    const el = create();

    // The title is the card's h3.
    expect(el.querySelector('h3')?.textContent?.trim()).toBe('Revisions');
  });

  it('projects its body into the standard text-sm body area', () => {
    // Act: render.
    const el = create();

    // The projected content sits inside the body wrapper that fixes size and tone colour for every card.
    const body = el.querySelector('.projected')?.parentElement;
    expect(body?.classList.contains('text-sm')).toBe(true);
    expect(body?.classList.contains('text-on-middle-body')).toBe(true);
  });

  it('sets the scroll-anchor id on the card only when one is given', () => {
    // Without an anchor, the card has no id.
    expect(create().querySelector('article')?.hasAttribute('id')).toBe(false);

    // With one, the card carries it so the form's "?" button can jump there.
    expect(create({ anchorId: 'artwork-usage' }).querySelector('article')?.id).toBe('artwork-usage');
  });
});
