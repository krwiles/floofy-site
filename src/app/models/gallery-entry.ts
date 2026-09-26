import { ImageAsset } from './image-asset';

export type GalleryCategory = 'illustration' | 'chibi' | 'emote';

/**
 * One member of the gallery collection: an image asset plus its category and the pages that show it. `showIn`
 * maps a page name to that entry's sort position on that page (ascending), so which pages show an image -- and in
 * what order -- is a data edit in gallery.json, never a code change. A category alone never places an image on a
 * page; only `showIn` does.
 */
export interface GalleryEntry extends ImageAsset {
  readonly category: GalleryCategory;
  readonly showIn: Readonly<Record<string, number>>;
}
