import { Injectable } from '@angular/core';
import galleryJson from '../../assets/data/gallery.json';
import { ArtworkCategory } from '../models/artwork-category';
import { GalleryEntry } from '../models/gallery-entry';
import { ImageAsset } from '../models/image-asset';

/**
 * Reads the gallery collection (`assets/data/gallery.json`) and hands each page the images it lists, in that
 * page's own order. Nothing here knows which pages exist -- adding a page's images is a data edit only.
 */
@Injectable({
  providedIn: 'root',
})
export class GalleryImageService {
  private readonly entries = galleryJson as GalleryEntry[];

  imagesFor(page: string, category?: ArtworkCategory): ImageAsset[] {
    return this.entries
      .filter((entry) => Object.hasOwn(entry.showIn, page) && (category === undefined || entry.category === category))
      .sort((a, b) => a.showIn[page] - b.showIn[page])
      .map(({ src, alt, width, height }) => ({ src, alt, width, height }));
  }
}
