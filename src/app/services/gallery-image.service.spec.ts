import { TestBed } from '@angular/core/testing';

import { GalleryImageService } from './gallery-image.service';
import galleryJson from '../../assets/data/gallery.json';

describe('GalleryImageService', () => {
  let service: GalleryImageService;

  beforeEach(() => {
    // The service reads the real gallery.json, so no setup beyond injecting it.
    TestBed.configureTestingModule({});
    service = TestBed.inject(GalleryImageService);
  });

  it('should be created', () => {
    // Assert: injection works.
    expect(service).toBeTruthy();
  });

  it('returns only the entries that list the requested page', () => {
    // Act: ask for the gallery page, and count the JSON entries that list it.
    const galleryPage = service.imagesFor('gallery');
    const expected = galleryJson.filter((entry) => 'gallery' in entry.showIn);

    // Assert: exactly those, and at least one (so the test can't pass vacuously).
    expect(galleryPage.length).toBe(expected.length);
    expect(galleryPage.length).toBeGreaterThan(0);
  });

  it('returns entries in ascending order of the page-specific sort value', () => {
    // Act: ask for the home page, and sort the JSON entries by their home position by hand.
    const home = service.imagesFor('home');
    const expected = galleryJson
      .filter((entry) => 'home' in entry.showIn)
      .sort((a, b) => (a.showIn as Record<string, number>)['home'] - (b.showIn as Record<string, number>)['home'])
      .map((entry) => entry.src);

    // Assert: the service returns them in that order.
    expect(home.map((image) => image.src)).toEqual(expected);
  });

  it('orders each page independently: the same image can sit at different positions on different pages', () => {
    // Act: load both pages.
    const gallery = service.imagesFor('gallery').map((image) => image.src);
    const home = service.imagesFor('home').map((image) => image.src);

    // Assert: images on both pages appear in a different relative order on each.
    const shared = home.filter((src) => gallery.includes(src));
    expect(shared.length).toBeGreaterThan(1);
    expect(shared).not.toEqual(gallery.filter((src) => home.includes(src)));
  });

  it('filters by category on top of the page', () => {
    // Act: load each category of the commission page.
    const emotes = service.imagesFor('commission', 'emote');
    const chibi = service.imagesFor('commission', 'chibi');
    const illustrations = service.imagesFor('commission', 'illustration');

    // Assert: each category has images...
    expect(emotes.length).toBeGreaterThan(0);
    expect(chibi.length).toBeGreaterThan(0);
    expect(illustrations.length).toBeGreaterThan(0);

    // ...and together they make up the whole page.
    const all = service.imagesFor('commission');
    expect(all.length).toBe(emotes.length + chibi.length + illustrations.length);
  });

  it("does not let a category decide placement: a chibi or emote isn't on a page that doesn't list it", () => {
    // Arrange: the gallery page, and every non-illustration image in the data.
    const gallery = service.imagesFor('gallery').map((image) => image.src);
    const categoryOnly = galleryJson.filter((entry) => entry.category !== 'illustration').map((entry) => entry.src);

    // Assert: none of them made it onto the gallery page just by being in the data.
    expect(gallery.some((src) => categoryOnly.includes(src))).toBe(false);
  });

  it('returns an empty list for a page nothing lists', () => {
    // Act and assert: an unknown page gets no images rather than an error.
    expect(service.imagesFor('a-page-that-does-not-exist')).toEqual([]);
  });

  it('does not treat inherited object keys as pages', () => {
    // Act and assert: "constructor" exists on every object, but no entry lists it as a page.
    expect(service.imagesFor('constructor')).toEqual([]);
  });

  it('returns plain image assets, not the raw data entries', () => {
    // Act: take one result.
    const [first] = service.imagesFor('gallery');

    // Assert: only the image fields, none of the JSON's page/category metadata.
    expect(Object.keys(first).sort()).toEqual(['alt', 'height', 'src', 'width']);
  });

  it('returns a fresh array each call, so a caller mutating one cannot affect another', () => {
    // Act: shrink one returned list.
    const a = service.imagesFor('gallery');
    a.pop();

    // Assert: the next call is unaffected.
    expect(service.imagesFor('gallery').length).toBe(a.length + 1);
  });

  it('every entry has real alt text and positive dimensions', () => {
    // Assert: every image in the data is accessible and has a real size (prevents layout shift).
    for (const entry of galleryJson) {
      expect(entry.alt.trim().length).toBeGreaterThan(0);
      expect(entry.width).toBeGreaterThan(0);
      expect(entry.height).toBeGreaterThan(0);
    }
  });

  it('sort values within each page are unique', () => {
    // Arrange: every page named anywhere in the data.
    const pages = new Set(galleryJson.flatMap((entry) => Object.keys(entry.showIn)));

    // Assert: no two images on the same page share a position.
    for (const page of pages) {
      const orders = galleryJson
        .map((entry) => (entry.showIn as Record<string, number>)[page])
        .filter((order) => order !== undefined);
      expect(new Set(orders).size).toBe(orders.length);
    }
  });
});
