import { TestBed } from '@angular/core/testing';

import { GalleryImageService } from './gallery-image.service';
import galleryJson from '../../assets/data/gallery.json';

describe('GalleryImageService', () => {
  let service: GalleryImageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GalleryImageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns only the entries that list the requested page', () => {
    const galleryPage = service.imagesFor('gallery');
    const expected = galleryJson.filter((entry) => 'gallery' in entry.showIn);

    expect(galleryPage.length).toBe(expected.length);
    expect(galleryPage.length).toBeGreaterThan(0);
  });

  it('returns entries in ascending order of the page-specific sort value', () => {
    const home = service.imagesFor('home');
    const expected = galleryJson
      .filter((entry) => 'home' in entry.showIn)
      .sort((a, b) => (a.showIn as Record<string, number>)['home'] - (b.showIn as Record<string, number>)['home'])
      .map((entry) => entry.src);

    expect(home.map((image) => image.src)).toEqual(expected);
  });

  it('orders each page independently: the same image can sit at different positions on different pages', () => {
    const gallery = service.imagesFor('gallery').map((image) => image.src);
    const home = service.imagesFor('home').map((image) => image.src);

    const shared = home.filter((src) => gallery.includes(src));
    expect(shared.length).toBeGreaterThan(1);
    expect(shared).not.toEqual(gallery.filter((src) => home.includes(src)));
  });

  it('filters by category on top of the page', () => {
    const emotes = service.imagesFor('commission', 'emote');
    const chibi = service.imagesFor('commission', 'chibi');
    const illustrations = service.imagesFor('commission', 'illustration');

    expect(emotes.length).toBeGreaterThan(0);
    expect(chibi.length).toBeGreaterThan(0);
    expect(illustrations.length).toBeGreaterThan(0);

    const all = service.imagesFor('commission');
    expect(all.length).toBe(emotes.length + chibi.length + illustrations.length);
  });

  it("does not let a category decide placement: a chibi or emote isn't on a page that doesn't list it", () => {
    const gallery = service.imagesFor('gallery').map((image) => image.src);
    const categoryOnly = galleryJson.filter((entry) => entry.category !== 'illustration').map((entry) => entry.src);

    expect(gallery.some((src) => categoryOnly.includes(src))).toBe(false);
  });

  it('returns an empty list for a page nothing lists', () => {
    expect(service.imagesFor('a-page-that-does-not-exist')).toEqual([]);
  });

  it('returns plain image assets, not the raw data entries', () => {
    const [first] = service.imagesFor('gallery');

    expect(Object.keys(first).sort()).toEqual(['alt', 'height', 'src', 'width']);
  });

  it('returns a fresh array each call, so a caller mutating one cannot affect another', () => {
    const a = service.imagesFor('gallery');
    a.pop();

    expect(service.imagesFor('gallery').length).toBe(a.length + 1);
  });

  it('every entry has real alt text and positive dimensions', () => {
    for (const entry of galleryJson) {
      expect(entry.alt.trim().length).toBeGreaterThan(0);
      expect(entry.width).toBeGreaterThan(0);
      expect(entry.height).toBeGreaterThan(0);
    }
  });

  it('sort values within each page are unique', () => {
    const pages = new Set(galleryJson.flatMap((entry) => Object.keys(entry.showIn)));
    for (const page of pages) {
      const orders = galleryJson
        .map((entry) => (entry.showIn as Record<string, number>)[page])
        .filter((order) => order !== undefined);
      expect(new Set(orders).size).toBe(orders.length);
    }
  });
});
