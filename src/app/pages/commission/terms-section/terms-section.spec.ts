import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TermsSection } from './terms-section';

describe('TermsSection', () => {
  let fixture: ComponentFixture<TermsSection>;
  let el: HTMLElement;

  // Trimmed text of each element matching `selector`, scoped to `root`.
  function texts(root: ParentNode, selector: string): string[] {
    return Array.from(root.querySelectorAll(selector)).map((node) => node.textContent?.trim() ?? '');
  }

  // The rendered terms card whose heading is `title`.
  function card(title: string): HTMLElement {
    const heading = Array.from(el.querySelectorAll('h3')).find((h3) => h3.textContent?.trim() === title);
    return heading!.closest('article')!;
  }

  beforeEach(async () => {
    // Renders against the real en.json and pricing.json, in English.
    await TestBed.configureTestingModule({ imports: [TermsSection] }).compileComponents();
    fixture = TestBed.createComponent(TermsSection);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('lays the seven cards out in the three hand-balanced columns', () => {
    // Each column's card titles, in order.
    const columns = Array.from(el.querySelectorAll('#commission-terms .grid > div'));
    expect(columns.map((column) => texts(column, 'h3'))).toEqual([
      ['Revisions', 'Workflow', 'Communication'],
      ['Pricing', 'Artwork Usage', 'Payment'],
      ['Terms of Service'],
    ]);
  });

  it('renders each card body in its own shape', () => {
    // Workflow is numbered, Revisions bulleted, Communication a paragraph.
    expect(card('Workflow').querySelectorAll('ol li').length).toBe(5);
    expect(card('Revisions').querySelectorAll('ul li').length).toBe(4);
    expect(card('Communication').querySelector('p')?.textContent).toContain('feel free to contact me');
  });

  it("appends each priced usage type's percent add-on to its Artwork Usage label", () => {
    // Personal is included (no add-on); the other three show pricing.json's percent.
    expect(texts(card('Artwork Usage'), 'p')).toEqual([
      'Personal (Included)',
      'Promotion (+50%)',
      'Distribution (+100%)',
      'Products (+200%)',
    ]);
  });

  it('gives Terms of Service the same 14px body text as every other card', () => {
    // ToS used to be 11px; now its body uses the shared text-sm body area.
    const tosBody = card('Terms of Service').querySelector('h3 + div');
    expect(tosBody?.classList.contains('text-sm')).toBe(true);
    expect(el.querySelector('[class*="text-[11px]"]')).toBeFalsy();
  });

  it('keeps the scroll anchors the request form jumps to', () => {
    // The whole section, and the Artwork Usage card specifically.
    expect(el.querySelector('#commission-terms')).toBeTruthy();
    expect(card('Artwork Usage').id).toBe('artwork-usage');
  });

  it('leaves no untranslated keys on the page', () => {
    // t() echoes a missing key back, so any "commission." text means a broken lookup.
    expect(el.textContent).not.toContain('commission.');
  });
});
