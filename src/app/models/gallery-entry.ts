import { ArtworkCategory } from './artwork-category';
import { ImageAsset } from './image-asset';

/**
 * One image in the gallery collection, plus its category and the pages that show it. `showIn` maps a page name to
 * the image's position on that page (ascending), so placement is a data edit in gallery.json. A category alone never
 * puts an image on a page; only `showIn` does.
 */
export interface GalleryEntry extends ImageAsset {
  readonly category: ArtworkCategory;
  readonly showIn: Readonly<Record<string, number>>;
}
