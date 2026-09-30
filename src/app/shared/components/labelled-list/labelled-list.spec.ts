import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LabelledList } from './labelled-list';

describe('LabelledList', () => {
  let fixture: ComponentFixture<LabelledList>;

  // Text of every element matching `selector`, trimmed.
  function texts(selector: string): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll(selector)).map(
      (el) => (el as HTMLElement).textContent?.trim() ?? '',
    );
  }

  beforeEach(async () => {
    // Every case starts from a middle-tone list; each test adds its own content before rendering.
    await TestBed.configureTestingModule({ imports: [LabelledList] }).compileComponents();
    fixture = TestBed.createComponent(LabelledList);
    fixture.componentRef.setInput('tone', 'middle');
  });

  it('renders plain items as a bulleted list, in order', () => {
    fixture.componentRef.setInput('items', ['First', 'Second', 'Third']);
    fixture.detectChanges();

    // One <ul> of bullets, no numbering.
    expect(fixture.nativeElement.querySelector('ul.list-disc')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('ol')).toBeFalsy();
    expect(texts('li')).toEqual(['First', 'Second', 'Third']);
  });

  it('renders numbered items as an ordered list', () => {
    fixture.componentRef.setInput('items', ['Sketch', 'Colour']);
    fixture.componentRef.setInput('numbered', true);
    fixture.detectChanges();

    // An <ol> with decimal markers instead of bullets.
    expect(fixture.nativeElement.querySelector('ol.list-decimal')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('ul')).toBeFalsy();
    expect(texts('li')).toEqual(['Sketch', 'Colour']);
  });

  it('renders groups as a label followed by its own bulleted items', () => {
    fixture.componentRef.setInput('groups', [
      { id: 'usage', label: 'Usage', items: ['Personal only.', 'No resale.'] },
      { id: 'refunds', label: 'Refunds', items: ['Non-refundable.'] },
    ]);
    fixture.detectChanges();

    // Each label is followed by exactly its own items.
    expect(texts('p')).toEqual(['Usage', 'Refunds']);
    const lists: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('ul'));
    expect(lists.length).toBe(2);
    expect(lists[0].querySelectorAll('li').length).toBe(2);
    expect(texts('li')).toEqual(['Personal only.', 'No resale.', 'Non-refundable.']);
  });

  it("colours group labels with the tone's heading colour", () => {
    fixture.componentRef.setInput('tone', 'dark');
    fixture.componentRef.setInput('groups', [{ id: 'a', label: 'A', items: ['x'] }]);
    fixture.detectChanges();

    // Dark tone gets the dark heading colour.
    expect(fixture.nativeElement.querySelector('p').classList.contains('text-on-dark-heading')).toBe(true);
  });

  it('renders nothing when given no content', () => {
    fixture.detectChanges();

    // No empty list or group wrappers.
    expect(fixture.nativeElement.querySelector('ul, ol, p')).toBeFalsy();
  });
});
